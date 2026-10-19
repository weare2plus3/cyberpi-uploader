<img src="https://raw.githubusercontent.com/weare2plus3/cyberpi-uploader/main/images/icon.png" width="96" alt="">

# CyberPi Uploader

Upload Python programs from VS Code to a Makeblock **CyberPi** (the brain of the **mBot2**) over USB on macOS, with no mBlock, mLink or Python install needed.

By [TWO+THREE](https://2plus3.studio) · [Website](https://weare2plus3.github.io/cyberpi-uploader/)

## Install
In VS Code, open the Extensions panel (⇧⌘X), search for **CyberPi Uploader** and click **Install**. Or install it from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=weare2plus3.cyberpi-uploader).

To install without the Marketplace, download the `.vsix` from [Releases](https://github.com/weare2plus3/cyberpi-uploader/releases). Then open the Extensions panel, click **⋯**, choose **Install from VSIX…** and pick the file.

## Use
1. Plug the CyberPi into your Mac with a **data** USB cable and switch it on. Quit mBlock 5 first, because it holds the port.
2. Open a `.py` file and press **⌘⌥U**, or click the cloud-upload icon at the top right of the editor. It's also in the status bar and the Explorer right-click menu.
3. The first time, pick the port: usually `cu.usbserial-…` or `cu.wchusbserial-…`. It's remembered after that.
4. The board restarts and runs your program. Anything it `print()`s appears in the **CyberPi** output panel.

Programs should start from an event handler, as mBlock-generated code does:

```python
import event, cyberpi

@event.start
def on_start():
    cyberpi.display.show_label("Hello!", 24, "center")
    cyberpi.led.on(0, 255, 0)
```

The extension warns before uploading a file with no `@event` handler, because bare top-level loops can leave the board stuck until it's power-cycled.

## Commands
Open the Command Palette (⇧⌘P) and type "CyberPi":

| Command | |
|---|---|
| Upload Current File | ⌘⌥U |
| Select USB Port | also by clicking **CyberPi** in the status bar |
| Start / Stop Serial Monitor | shows `print()` output; stop it to free the port for mBlock |
| Restart Board | |
| New Script | starter file with `@event.start` |

## Settings
| Setting | Default | |
|---|---|---|
| `cyberpi.port` | auto | e.g. `/dev/cu.usbserial-110` |
| `cyberpi.restartAfterUpload` | `true` | restart so the new program runs |
| `cyberpi.monitorAfterUpload` | `true` | keep the port open and show `print()` output |
| `cyberpi.padUploads` | `true` | pad with trailing newlines to mBlock's exact block layout |
| `cyberpi.bootWaitSeconds` | `3` | wait after opening the port (which resets the board) |
| `cyberpi.warnWithoutEventStart` | `true` | warn before uploading a file with no `@event` handler |

## Troubleshooting
- **No port found.** Run `ls /dev/cu.*` in Terminal with the CyberPi switched on. If nothing like `cu.usbserial-…` appears, the Mac can't see the board; try another cable, since many USB-C cables are charge-only.
- **Port busy.** Quit mBlock 5 and mLink, or stop the serial monitor.
- **Upload succeeded but the old program still runs.** Switch the CyberPi off and on.

## How it works
The extension speaks the same USB serial protocol mBlock 5 uses (115200 8N1).

**Frame:** `F3 hdr len_lo len_hi body… ck F4`, where `hdr = (0xF3 + len_lo + len_hi) & 0xFF` and `ck = sum(body) & 0xFF`. Any bytes outside frames are the running program's `print()` output.

| Step | Body |
|---|---|
| Upload mode | `0D 00 00` (board echoes it) |
| Prepare | script frames `28 04 00 00 <len16> <python>` running `import config` and `config.write_config("repl_enable", False)` (sent twice, like mBlock) |
| File header | `01 00 5E 01 <len16> 00 <size32> <xor32> /flash/_xx_main.py` |
| File blocks | `01 00 5E 02 <len16> <offset32> <data>`, 80 data bytes per block, last block 4 bytes |
| Finish | upload-mode + prepare frames again, then reset via the serial port |

All integers are little-endian. `xor32` is the XOR of the file's 32-bit little-endian words, zero-padded. Every frame waits for the board's reply before the next is sent, with retries. The file goes to a staging slot that the firmware swaps in on reboot, so a failed upload leaves the previous program intact.

## Development
```bash
npm install
npm run compile
npm test           # protocol tests + end-to-end uploads to a simulated CyberPi (needs python3)
npx vsce package   # builds the .vsix
npm run site       # rebuilds the website in docs/ from site/build.js
```

The website is pre-rendered from the TWO+THREE design system's components (copied into `docs/assets/ds/`) and served by GitHub Pages from `docs/`.

The tests check every frame against an independent Python encoder (`test-fixtures/reference_encoder.py`) and against bytes mBlock 5 sends. They also run full uploads, including a dropped acknowledgement, against a simulated board on a pseudo-terminal.

## Credits
The upload sequence was first decoded from mBlock 5 traffic by [dachrisch/mbot2-course-setup](https://github.com/dachrisch/mbot2-course-setup). The frame header follows Makeblock's own `HalocodePackData` (from the `makeblock` Python package). Thanks to both.

Not affiliated with or endorsed by Makeblock. CyberPi, mBot2 and mBlock are trademarks of Makeblock Co., Ltd.

## License
MIT © 2026 TWO PLUS THREE LIMITED
