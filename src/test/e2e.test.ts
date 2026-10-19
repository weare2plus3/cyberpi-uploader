import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import { spawn } from "child_process";
import { Board } from "../board";
import { padForWire } from "../protocol";

const fx = path.join(__dirname, "..", "..", "test-fixtures");
const tmp = fs.mkdtempSync("/tmp/cpi-");

async function run(file: string, mode: string, pad: boolean) {
  const link = path.join(tmp, `tty-${mode}-${pad}`), result = path.join(tmp, `res-${mode}-${pad}.json`);
  const mock = spawn("python3", ["-I", path.join(fx, "mock_cyberpi.py"), link, result, mode]);
  await new Promise<void>((r) => mock.stdout.once("data", () => r()));
  let text = ""; const log: string[] = [];
  const b = new Board(link, (t) => (text += t), (l) => log.push(l));
  const src = fs.readFileSync(path.join(fx, "programs", file));
  try {
    await b.open();
    let last = 0; const r = await b.upload(src, { pad, bootWaitMs: 200, ackTimeoutMs: 800, onProgress: (d, t) => { assert.ok(d === last + 1 && d <= t); last = d; } }); assert.strictEqual(last, r.frames);
    await new Promise((res) => setTimeout(res, 300));
    const got = JSON.parse(fs.readFileSync(result, "utf8"));
    const data = Buffer.from(got.data, "hex");
    const expected = pad ? padForWire(src) : src;
    assert.ok(data.equals(expected), "board received exactly the sent bytes");
    assert.strictEqual(data.toString().trimEnd(), src.toString().trimEnd(), "program text unchanged apart from trailing newlines");
    assert.strictEqual(got.path, "/flash/_xx_main.py");
    assert.ok(got.ck_ok, "file checksum accepted");
    assert.strictEqual(got.bad, 0, "no malformed frames");
    assert.ok(text.includes("PYB: fast reboot") && text.includes("hello from the new upload"), "print() output captured");
    assert.ok(!text.includes("\xf3"), "no frame bytes leaked into the monitor text");
    console.log(`✔ ${file} [${mode}${pad ? "" : ", unpadded"}]: ${src.length}→${r.bytes} B, ${got.blocks} blocks, ${r.frames} frames${log.some((l) => l.includes("no reply")) ? ", recovered from a lost ack" : ""}`);
  } finally { await b.close(); mock.kill(); }
}

(async () => {
  for (const f of fs.readdirSync(path.join(fx, "programs"))) await run(f, "ok", true);
  await run("04_obstacle_avoid.py", "drop", true);
  await run("05_line_follow.py", "ok", false);
  console.log("e2e tests passed");
})().catch((e) => { console.error("✖", e); process.exit(1); });
