/*
 * Makeblock CyberPi (mBot2) USB upload protocol.
 *
 * Wire frame (same as Makeblock's own HalocodePackData):
 *   F3  hdr  len_lo  len_hi  body...  ck  F4
 *   hdr = (0xF3 + len_lo + len_hi) & 0xFF      header checksum
 *   ck  = sum(body) & 0xFF                     body checksum
 *
 * Upload sequence (decoded from an mBlock 5 upload capture):
 *   "offline" ping, exec(import config), exec(repl_enable False)   x2
 *   file header -> /flash/_xx_main.py  (staging slot, swapped in on reboot)
 *   file blocks (offset + data)
 *   ping, exec, exec
 *   reboot
 */

export const F3 = 0xf3;
export const F4 = 0xf4;
export const STAGING_PATH = "/flash/_xx_main.py";
export const CHUNK = 80;

export function frame(body: Uint8Array | number[]): Buffer {
  const b = Buffer.from(body as Uint8Array);
  if (b.length > 0xffff) throw new Error("frame body too large");
  const lo = b.length & 0xff;
  const hi = (b.length >> 8) & 0xff;
  let ck = 0;
  for (const x of b) ck = (ck + x) & 0xff;
  return Buffer.concat([Buffer.from([F3, (F3 + lo + hi) & 0xff, lo, hi]), b, Buffer.from([ck, F4])]);
}

/** TYPE_ONLINE (0x0D) with idx 0 = switch to offline/upload mode. Board echoes it. */
export const PING_BODY = Buffer.from([0x0d, 0x00, 0x00]);
export const PING = frame(PING_BODY);

/** TYPE_SCRIPT (0x28) frame running a short Python snippet on the board. */
export function execFrame(code: string): Buffer {
  const src = Buffer.from(code, "utf8");
  const len = Buffer.alloc(2);
  len.writeUInt16LE(src.length);
  return frame(Buffer.concat([Buffer.from([0x28, 0x04, 0x00, 0x00]), len, src]));
}

export const EXEC_IMPORT_CONFIG = execFrame("try:\n    import config\nexcept:\n    pass");
export const EXEC_REPL_OFF = execFrame('try:\n    config.write_config("repl_enable", False)\nexcept:\n    pass');

/** XOR of little-endian 32-bit words, zero-padded. Matches mBlock's file checksum. */
export function fileChecksum(data: Buffer): Buffer {
  let x = 0;
  for (let i = 0; i < data.length; i += 4) {
    const w = (data[i] ?? 0) | ((data[i + 1] ?? 0) << 8) | ((data[i + 2] ?? 0) << 16) | ((data[i + 3] ?? 0) << 24);
    x = (x ^ w) >>> 0;
  }
  const out = Buffer.alloc(4);
  out.writeUInt32LE(x);
  return out;
}

/** File-transfer service 0x5E, sub-command `cmd`, with a LE16-length payload. */
function ftp(cmd: number, payload: Buffer): Buffer {
  const len = Buffer.alloc(2);
  len.writeUInt16LE(payload.length);
  return frame(Buffer.concat([Buffer.from([0x01, 0x00, 0x5e, cmd]), len, payload]));
}

export function fileHeaderFrame(data: Buffer, path = STAGING_PATH): Buffer {
  const size = Buffer.alloc(4);
  size.writeUInt32LE(data.length);
  return ftp(0x01, Buffer.concat([Buffer.from([0x00]), size, fileChecksum(data), Buffer.from(path, "ascii")]));
}

export function fileBlockFrame(offset: number, chunk: Buffer): Buffer {
  const off = Buffer.alloc(4);
  off.writeUInt32LE(offset);
  return ftp(0x02, Buffer.concat([off, chunk]));
}

/**
 * Pad with trailing newlines (no effect on the program) so the file splits into
 * full 80-byte blocks plus a 4-byte last block: the exact shape mBlock produced
 * in the capture and that has been confirmed on real hardware.
 */
export function padForWire(data: Buffer): Buffer {
  const pad = (4 - (data.length % CHUNK) + CHUNK) % CHUNK;
  return pad ? Buffer.concat([data, Buffer.alloc(pad, 0x0a)]) : data;
}

/** Split into blocks: [0, size-4) in CHUNK-sized pieces, then the last 4 bytes. */
export function blocks(data: Buffer): Array<{ offset: number; chunk: Buffer }> {
  if (data.length <= 4) return [{ offset: 0, chunk: data }];
  const out: Array<{ offset: number; chunk: Buffer }> = [];
  const end = data.length - 4;
  for (let off = 0; off < end; off += CHUNK) out.push({ offset: off, chunk: data.subarray(off, Math.min(off + CHUNK, end)) });
  out.push({ offset: end, chunk: data.subarray(end) });
  return out;
}

export interface Frame { hdr: number; body: Buffer }

/** Incremental parser: pulls F3..F4 frames out of the byte stream; everything else is program text. */
export class FrameReader {
  private buf = Buffer.alloc(0);
  constructor(private onFrame: (f: Frame) => void, private onText: (t: string) => void) {}

  push(chunk: Buffer) {
    this.buf = Buffer.concat([this.buf, chunk]);
    for (;;) {
      const start = this.buf.indexOf(F3);
      if (start < 0) { this.text(this.buf); this.buf = Buffer.alloc(0); return; }
      if (start > 0) { this.text(this.buf.subarray(0, start)); this.buf = this.buf.subarray(start); }
      if (this.buf.length < 4) return;
      const len = this.buf[2] | (this.buf[3] << 8);
      if (((F3 + this.buf[2] + this.buf[3]) & 0xff) !== this.buf[1] || len > 4096) {
        this.text(this.buf.subarray(0, 1)); this.buf = this.buf.subarray(1); continue;
      }
      if (this.buf.length < len + 6) return;
      const body = this.buf.subarray(4, 4 + len);
      let ck = 0;
      for (const x of body) ck = (ck + x) & 0xff;
      if (this.buf[4 + len] !== ck || this.buf[5 + len] !== F4) {
        this.text(this.buf.subarray(0, 1)); this.buf = this.buf.subarray(1); continue;
      }
      this.onFrame({ hdr: this.buf[1], body: Buffer.from(body) });
      this.buf = this.buf.subarray(len + 6);
    }
  }

  private text(b: Buffer) { if (b.length) this.onText(b.toString("latin1")); }
}

/** Reply matchers (lenient, like mBlock: any frame of the expected kind counts). */
// Observed in the capture: ping echoed (3-byte body), exec answered with
// {"ret":...} (18-byte body), file frames acked with a 7-byte body containing 5E F0.
export const isPingReply = (f: Frame) => f.body.length === 3 && f.body[0] === 0x0d;
export const isExecReply = (f: Frame) => f.body.includes(Buffer.from('"ret"')) || f.body.length === 18;
export const isFileAck = (f: Frame) => f.body.includes(Buffer.from([0x5e, 0xf0])) || f.body.length === 7;
