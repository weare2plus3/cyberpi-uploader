import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import * as P from "../protocol";

const fx = path.join(__dirname, "..", "..", "test-fixtures");
const exp = JSON.parse(fs.readFileSync(path.join(fx, "expected.json"), "utf8"));
const hex = (b: Buffer) => b.toString("hex");

// 1. Preamble frames: known-answer bytes observed on the wire from mBlock 5,
//    and agreement with the independent Python reference encoder.
const CAPTURED = {
  PING: "f3f603000d00000df4",
  EXEC1: "f3202d002804000027007472793a0a20202020696d706f727420636f6e6669670a6578636570743a0a2020202070617373b5f4",
  EXEC2: "f33c49002804000043007472793a0a20202020636f6e6669672e77726974655f636f6e66696728227265706c5f656e61626c65222c2046616c7365290a6578636570743a0a202020207061737389f4",
};
assert.strictEqual(hex(P.PING), CAPTURED.PING, "PING");
assert.strictEqual(hex(P.EXEC_IMPORT_CONFIG), CAPTURED.EXEC1, "EXEC import config");
assert.strictEqual(hex(P.EXEC_REPL_OFF), CAPTURED.EXEC2, "EXEC repl_enable");
assert.deepStrictEqual([exp.PING, exp.EXEC1, exp.EXEC2], [CAPTURED.PING, CAPTURED.EXEC1, CAPTURED.EXEC2]);
console.log("✔ preamble frames match mBlock 5's bytes");

// 2. File frames: byte-identical to the reference encoder for every example program.
for (const [name, f] of Object.entries<any>(exp.files)) {
  const data = P.padForWire(Buffer.from(f.source, "hex"));
  const mine = [P.fileHeaderFrame(data), ...P.blocks(data).map((b) => P.fileBlockFrame(b.offset, b.chunk))].map(hex);
  assert.deepStrictEqual(mine, f.frames, `${name}: frames`);
  console.log(`✔ ${name}: ${mine.length} frames match the reference encoder`);
}

// File checksum = XOR of little-endian 32-bit words (zero-padded).
assert.strictEqual(hex(P.fileChecksum(Buffer.from([1, 2, 3, 4, 5]))), "04020304");
assert.strictEqual(hex(P.fileChecksum(Buffer.from([0xff, 0, 0, 0, 0xff, 0, 0, 0]))), "00000000");
console.log("✔ file checksum known answers");

// 3. Header byte of every frame = (0xF3 + len) & 0xFF — the rule behind the old "magic command" bytes.
for (const len of [0, 3, 7, 14, 77, 90, 300, 4096]) {
  const fr = P.frame(Buffer.alloc(len, 1));
  assert.strictEqual(fr[1], (0xf3 + (len & 0xff) + (len >> 8)) & 0xff);
}

// 4. Padding and blocking shapes.
for (let n = 1; n < 400; n++) {
  const d = P.padForWire(Buffer.alloc(n, 0x41));
  assert.strictEqual(d.length % 80, 4, `pad ${n}`);
  const bl = P.blocks(d);
  assert.strictEqual(bl[bl.length - 1].chunk.length, 4);
  assert.ok(bl.slice(0, -1).every((b) => b.chunk.length === 80));
  assert.ok(Buffer.concat(bl.map((b) => b.chunk)).equals(d));
}
console.log("✔ padding/blocking shapes correct for sizes 1..399");

// 5. FrameReader: splits frames from interleaved program text, survives bytes arriving one at a time.
const frames: P.Frame[] = []; let text = "";
const r = new P.FrameReader((f) => frames.push(f), (t) => (text += t));
const stream = Buffer.concat([Buffer.from("PYB: fast reboot\r\n"), P.PING, Buffer.from("hi \xf3 there\n", "latin1"), P.EXEC_REPL_OFF, Buffer.from("bye")]);
for (const byte of stream) r.push(Buffer.from([byte]));
assert.strictEqual(frames.length, 2);
assert.ok(P.isPingReply(frames[0]));
assert.ok(text.includes("PYB: fast reboot") && text.includes("there") && text.endsWith("bye"));
console.log("✔ frame reader separates frames from print() output");
console.log("protocol tests passed");
