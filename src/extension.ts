import * as vscode from "vscode";
import * as path from "path";
import type { Board as BoardT, PortInfo } from "./board";

// serialport is a native module: load it lazily so a load problem can never stop
// the commands from registering (the failure mode of other CyberPi extensions).
type BoardModule = typeof import("./board");
let boardModule: BoardModule | undefined;
async function loadBoard(): Promise<BoardModule> {
  if (boardModule) return boardModule;
  try {
    boardModule = await import("./board");
    return boardModule;
  } catch (e) {
    throw new Error(`The serial driver failed to load (${(e as Error).message}). Reinstall the extension; if it persists, report your macOS version and Mac model.`);
  }
}

let out: vscode.OutputChannel;
let status: vscode.StatusBarItem;
let uploadButton: vscode.StatusBarItem;
let board: BoardT | undefined;
let busy = false;

const cfg = () => vscode.workspace.getConfiguration("cyberpi");
const shortName = (p: string) => p.replace(/^\/dev\/(cu|tty)\./, "");

export function activate(ctx: vscode.ExtensionContext) {
  out = vscode.window.createOutputChannel("CyberPi");
  status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  status.command = "cyberpi.selectPort";
  uploadButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
  uploadButton.command = "cyberpi.upload";
  uploadButton.text = "$(cloud-upload) Upload";
  uploadButton.tooltip = "Upload this file to the CyberPi";

  ctx.subscriptions.push(
    out, status, uploadButton,
    vscode.commands.registerCommand("cyberpi.upload", (uri?: vscode.Uri) => guard(() => uploadCommand(uri))),
    vscode.commands.registerCommand("cyberpi.selectPort", () => guard(async () => { await pickPort(true); })),
    vscode.commands.registerCommand("cyberpi.toggleMonitor", () => guard(toggleMonitor)),
    vscode.commands.registerCommand("cyberpi.restart", () => guard(restartCommand)),
    vscode.commands.registerCommand("cyberpi.newScript", () => guard(newScript)),
    vscode.window.onDidChangeActiveTextEditor(refreshStatus),
    vscode.workspace.onDidChangeConfiguration((e) => e.affectsConfiguration("cyberpi") && refreshStatus()),
    { dispose: () => { void board?.close(); } },
  );
  refreshStatus();
}

export async function deactivate() { await board?.close(); }

async function guard(fn: () => Promise<void>) {
  try { await fn(); } catch (e) {
    const msg = (e as Error).message || String(e);
    out.appendLine(`✖ ${msg}`);
    const pick = await vscode.window.showErrorMessage(`CyberPi: ${msg}`, "Show log", "Choose port");
    if (pick === "Show log") out.show(true);
    if (pick === "Choose port") await pickPort(true);
  } finally { refreshStatus(); }
}

function refreshStatus() {
  const port = cfg().get<string>("port") || "";
  const monitoring = board?.isOpen && !busy;
  status.text = `$(${monitoring ? "eye" : "plug"}) CyberPi${port ? ": " + shortName(port) : ""}`;
  status.tooltip = port ? `${port}${monitoring ? " · monitor open" : ""}\nClick to change port` : "Click to choose the CyberPi's USB port";
  status.show();
  const ed = vscode.window.activeTextEditor;
  if (ed?.document.languageId === "python") uploadButton.show(); else uploadButton.hide();
}

async function pickPort(force: boolean): Promise<string | undefined> {
  const { listPorts, toCallout } = await loadBoard();
  const saved = cfg().get<string>("port") ? toCallout(cfg().get<string>("port")!) : "";
  for (;;) {
    const ports = await listPorts();
    out.appendLine(`Ports found: ${ports.length ? ports.map((p) => p.path + (p.likely ? " (likely CyberPi)" : "")).join(", ") : "none"}`);
    if (!force && saved && ports.some((p) => p.path === saved)) return saved;
    const likely = ports.filter((p) => p.likely);
    if (!force && likely.length === 1) { await savePort(likely[0].path); return likely[0].path; }

    type Item = vscode.QuickPickItem & { path?: string; action?: "rescan" | "manual" };
    const items: Item[] = ports.map((p: PortInfo) => ({
      label: `${p.likely ? "$(circuit-board) " : ""}${shortName(p.path)}`,
      description: [p.likely ? "looks like a CyberPi" : "", p.label].filter(Boolean).join(" · "), detail: p.path, path: p.path,
    }));
    items.push(
      { label: "$(refresh) Rescan", description: ports.length ? "" : "nothing detected — plug in and switch on the CyberPi, then rescan", action: "rescan" },
      { label: "$(edit) Enter path manually…", description: "e.g. /dev/cu.usbserial-110", action: "manual" },
    );
    const choice = await vscode.window.showQuickPick(items, {
      title: "CyberPi USB port",
      placeHolder: ports.length ? "Pick the CyberPi (usually cu.usbserial-… or cu.wchusbserial-…)" : "No USB serial ports detected",
    });
    if (!choice) return undefined;
    if (choice.action === "rescan") { force = true; continue; }
    if (choice.action === "manual") {
      const typed = await vscode.window.showInputBox({ title: "CyberPi port path", value: saved || "/dev/cu.", prompt: "In Terminal, run: ls /dev/cu.*" });
      if (!typed) return undefined;
      const p = toCallout(typed.trim());
      await savePort(p);
      return p;
    }
    await savePort(choice.path!);
    return choice.path!;
  }
}

async function savePort(p: string) {
  if (board && board.path !== p) { await board.close(); board = undefined; }
  await cfg().update("port", p, vscode.ConfigurationTarget.Global);
  refreshStatus();
}

async function getBoard(portPath: string): Promise<BoardT> {
  const { Board } = await loadBoard();
  if (board && board.path === portPath) return board;
  await board?.close();
  board = new Board(portPath, (t) => out.append(t.replace(/\r\n/g, "\n")), (l) => out.appendLine(l));
  return board;
}

async function uploadCommand(uri?: vscode.Uri) {
  if (busy) { vscode.window.showInformationMessage("CyberPi: an upload is already running."); return; }
  const doc = uri ? await vscode.workspace.openTextDocument(uri) : vscode.window.activeTextEditor?.document;
  if (!doc) throw new Error("Open a Python file to upload.");
  if (doc.isDirty && !(await doc.save())) throw new Error("Save the file before uploading.");
  const name = path.basename(doc.fileName);
  if (!/\.py$/i.test(name)) throw new Error(`${name} isn't a .py file.`);
  const text = doc.getText();
  if (!text.trim()) throw new Error(`${name} is empty.`);

  if (cfg().get<boolean>("warnWithoutEventStart", true) && !/@\s*(cyberpi\.)?event\./.test(text)) {
    const go = await vscode.window.showWarningMessage(
      `${name} has no @event.start (or other @event) handler. CyberPi programs should start from an event handler; bare top-level loops can leave the board stuck until you power-cycle it.`,
      { modal: true }, "Upload anyway");
    if (go !== "Upload anyway") return;
  }

  const portPath = await pickPort(false);
  if (!portPath) return;

  const b = await getBoard(portPath);
  busy = true; refreshStatus();
  out.appendLine(`\n── Uploading ${name} to ${portPath} ──`);
  const t0 = Date.now();
  const signal = { cancelled: false };
  try {
    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: `CyberPi: uploading ${name}`, cancellable: true },
      async (progress, token) => {
        token.onCancellationRequested(() => { signal.cancelled = true; });
        let last = 0;
        progress.report({ message: "connecting…" });
        await b.close();          // fresh open = reset, so we start from a known state
        await b.open();
        const r = await b.upload(Buffer.from(text, "utf8"), {
          pad: cfg().get<boolean>("padUploads", true),
          bootWaitMs: cfg().get<number>("bootWaitSeconds", 3) * 1000,
          signal,
          onProgress: (d, total) => {
            const pct = Math.round((d / total) * 100);
            progress.report({ increment: pct - last, message: `${pct}%` });
            last = pct;
          },
        });
        out.appendLine(`✔ Uploaded ${r.bytes} bytes in ${((Date.now() - t0) / 1000).toFixed(1)}s.`);
        if (cfg().get<boolean>("restartAfterUpload", true)) {
          progress.report({ message: "restarting…" });
          out.appendLine("Restarting the CyberPi to run the new program…");
          await b.restart(500);
        }
      });
  } finally {
    busy = false;
  }

  if (cfg().get<boolean>("monitorAfterUpload", true)) {
    out.appendLine("── Program output (print) ── use “CyberPi: Stop Serial Monitor” to release the port ──");
    out.show(true);
  } else {
    await b.close();
  }
  vscode.window.setStatusBarMessage(`$(check) Uploaded ${name} to the CyberPi`, 5000);
  vscode.window.showInformationMessage(
    `Uploaded ${name}. If the new program doesn't start within a few seconds, switch the CyberPi off and on.`);
}

async function toggleMonitor() {
  if (board?.isOpen) {
    await board.close();
    out.appendLine("── Serial monitor stopped ──");
    return;
  }
  const portPath = await pickPort(false);
  if (!portPath) return;
  const b = await getBoard(portPath);
  await b.open();
  out.appendLine(`── Serial monitor on ${portPath} (opening the port restarts the CyberPi) ──`);
  out.show(true);
}

async function restartCommand() {
  const portPath = await pickPort(false);
  if (!portPath) return;
  const b = await getBoard(portPath);
  const wasOpen = b.isOpen;
  if (!wasOpen) await b.open();
  await b.restart(200);
  out.appendLine("── CyberPi restarted ──");
  if (!wasOpen) await b.close();
}

async function newScript() {
  const folder = vscode.workspace.workspaceFolders?.[0]?.uri;
  const name = await vscode.window.showInputBox({ title: "New CyberPi script", prompt: "File name", value: "my_program.py",
    validateInput: (v) => (/^[\w\- ]+\.py$/.test(v) ? undefined : "Use a name like my_program.py") });
  if (!name) return;
  const body = [
    "import event, time, cyberpi, mbot2, mbuild", "", "",
    "@event.start", "def on_start():", '    cyberpi.display.show_label("Ready", 24, "center")', "", "",
    '@event.is_press("a")', "def on_a():", '    cyberpi.audio.play("hello")', "",
  ].join("\n");
  if (folder) {
    const target = vscode.Uri.joinPath(folder, name);
    await vscode.workspace.fs.writeFile(target, Buffer.from(body));
    await vscode.window.showTextDocument(target);
  } else {
    const doc = await vscode.workspace.openTextDocument({ language: "python", content: body });
    await vscode.window.showTextDocument(doc);
  }
}
