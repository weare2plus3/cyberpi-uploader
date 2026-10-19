import * as fs from "fs";
import { SerialPort } from "serialport";
import {
  Frame, FrameReader, PING, EXEC_IMPORT_CONFIG, EXEC_REPL_OFF,
  fileHeaderFrame, fileBlockFrame, blocks, padForWire,
  isPingReply, isExecReply, isFileAck,
} from "./protocol";

export interface PortInfo { path: string; label: string; likely: boolean }

const CH340_VENDORS = ["1a86"]; // WCH CH340/CH9102, used on the CyberPi

/**
 * macOS exposes each serial device twice: /dev/tty.X (dial-in, waits for carrier on open)
 * and /dev/cu.X (call-out, opens immediately). serialport's list() reports the tty.
 * name, so convert to cu. — the one to open.
 */
export const toCallout = (p: string) => (process.platform === "darwin" ? p.replace(/^\/dev\/tty\./, "/dev/cu.") : p);

const isNoise = (p: string) => /Bluetooth|debug-console|wlan-debug|AirPods/i.test(p);
const looksLikeCyberPi = (p: string, vid = "") =>
  CH340_VENDORS.includes(vid.toLowerCase()) || /usbserial|wchusbserial|usbmodem|SLAB_USBtoUART/i.test(p);

/** Serial ports, CyberPi-looking ones first. */
export async function listPorts(): Promise<PortInfo[]> {
  const found = new Map<string, PortInfo>();
  try {
    for (const p of await SerialPort.list()) {
      const path = toCallout(p.path);
      if (isNoise(path)) continue;
      const vid = (p.vendorId || "").toLowerCase();
      const label = [p.manufacturer, vid && `VID ${vid}`].filter(Boolean).join(" · ");
      found.set(path, { path, label, likely: looksLikeCyberPi(path, vid) });
    }
  } catch { /* fall through to the /dev scan */ }
  if (process.platform === "darwin") {
    // Fallback: anything the system created under /dev, in case the driver didn't register with IOKit's list.
    try {
      for (const n of fs.readdirSync("/dev")) {
        const path = `/dev/${n}`;
        if (n.startsWith("cu.") && !isNoise(path) && !found.has(path)) found.set(path, { path, label: "", likely: looksLikeCyberPi(path) });
      }
    } catch { /* ignore */ }
  }
  return [...found.values()].sort((a, b) => Number(b.likely) - Number(a.likely));
}

export type Log = (line: string) => void;

export interface UploadOptions {
  pad: boolean;            // pad to the hardware-proven 80/80/.../4 block shape
  bootWaitMs: number;      // wait after opening the port (opening resets the board)
  ackTimeoutMs: number;
  retries: number;
  signal?: { cancelled: boolean };
  onProgress?: (done: number, total: number) => void;
}

export const DEFAULTS: UploadOptions = { pad: true, bootWaitMs: 3000, ackTimeoutMs: 3000, retries: 3 };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class Board {
  private port?: SerialPort;
  private waiters: Array<{ match: (f: Frame) => boolean; resolve: (f: Frame) => void }> = [];
  private reader = new FrameReader(
    (f) => {
      const i = this.waiters.findIndex((w) => w.match(f));
      if (i >= 0) this.waiters.splice(i, 1)[0].resolve(f);
    },
    (t) => this.onText(t),
  );

  constructor(public readonly path: string, private onText: (t: string) => void = () => {}, private log: Log = () => {}) {}

  get isOpen() { return !!this.port?.isOpen; }

  async open(baudRate = 115200): Promise<void> {
    if (this.isOpen) return;
    const port = new SerialPort({ path: this.path, baudRate, autoOpen: false });
    await new Promise<void>((res, rej) => port.open((e) => (e ? rej(friendlyOpenError(e, this.path)) : res())));
    port.on("data", (d: Buffer) => this.reader.push(d));
    port.on("close", () => { if (this.port === port) this.port = undefined; });
    port.on("error", (e) => this.log(`serial error: ${e.message}`));
    this.port = port;
  }

  async close(): Promise<void> {
    const p = this.port;
    this.port = undefined;
    this.waiters = [];
    if (p?.isOpen) await new Promise<void>((r) => p.close(() => r()));
  }

  /** Closing and reopening the port toggles DTR, which resets the CyberPi (same as mBlock). */
  async restart(bootWaitMs = 3000): Promise<void> {
    await this.close();
    await sleep(300);
    await this.open();
    await sleep(bootWaitMs);
  }

  private write(data: Buffer): Promise<void> {
    const p = this.port;
    if (!p?.isOpen) return Promise.reject(new Error("CyberPi port is not open"));
    return new Promise((res, rej) => p.write(data, (e) => (e ? rej(e) : p.drain((e2) => (e2 ? rej(e2) : res())))));
  }

  private waitFor(match: (f: Frame) => boolean, ms: number): Promise<Frame | undefined> {
    return new Promise((resolve) => {
      const w = { match, resolve: (f: Frame) => { clearTimeout(t); resolve(f); } };
      const t = setTimeout(() => { this.waiters = this.waiters.filter((x) => x !== w); resolve(undefined); }, ms);
      this.waiters.push(w);
    });
  }

  /** Send one frame and wait for its reply (lock-step, like mBlock). */
  async transact(data: Buffer, match: (f: Frame) => boolean, label: string, o: UploadOptions): Promise<Frame> {
    for (let attempt = 1; attempt <= o.retries; attempt++) {
      if (o.signal?.cancelled) throw new Error("Upload cancelled");
      const reply = this.waitFor(match, o.ackTimeoutMs);
      await this.write(data);
      const f = await reply;
      if (f) return f;
      this.log(`  ${label}: no reply (attempt ${attempt}/${o.retries})`);
    }
    throw new Error(`No reply from the CyberPi for ${label}. Check it is switched on, that mBlock/mLink isn't using the port, and try again.`);
  }

  async upload(source: Buffer, opts: Partial<UploadOptions> = {}): Promise<{ bytes: number; frames: number }> {
    const o = { ...DEFAULTS, ...opts };
    const data = o.pad ? padForWire(source) : source;
    const parts = blocks(data);
    const total = 6 + 1 + parts.length + 3;
    let done = 0;
    const step = () => { done++; o.onProgress?.(done, total); };

    if (!this.isOpen) { await this.open(); }
    this.log(`Waiting ${o.bootWaitMs / 1000}s for the CyberPi to boot…`);
    await sleep(o.bootWaitMs);

    const pre: Array<[Buffer, (f: Frame) => boolean, string]> = [
      [PING, isPingReply, "upload-mode"], [EXEC_IMPORT_CONFIG, isExecReply, "prepare"], [EXEC_REPL_OFF, isExecReply, "prepare"],
    ];
    for (const pass of [1, 2]) for (const [f, m, l] of pre) { await this.transact(f, m, `${l} (${pass})`, o); step(); }
    this.log("Board is in upload mode.");

    await this.transact(fileHeaderFrame(data), isFileAck, "file header", o); step();
    for (const { offset, chunk } of parts) {
      await this.transact(fileBlockFrame(offset, chunk), isFileAck, `block @${offset}`, o); step();
    }
    this.log(`Sent ${data.length} bytes in ${parts.length} blocks.`);

    for (const [f, m, l] of pre) { await this.transact(f, m, `${l} (finish)`, o); step(); }
    return { bytes: data.length, frames: done };
  }
}

function friendlyOpenError(e: Error, path: string): Error {
  const m = e.message || String(e);
  if (/busy|resource busy|access denied|cannot lock|EBUSY/i.test(m)) {
    return new Error(`${path} is in use by another app. Quit mBlock 5 (and mLink) or close the serial monitor, then retry.`);
  }
  if (/no such file|ENOENT|not found/i.test(m)) {
    return new Error(`${path} isn't there any more. Plug in the CyberPi with a data USB cable, switch it on, and pick the port again.`);
  }
  return new Error(`Couldn't open ${path}: ${m}`);
}
