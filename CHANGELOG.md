# Changelog

## 0.2.0
- First public release under TWO+THREE (publisher `weare2plus3`).
- Tests use the project's own example programs and an independent Python reference encoder.

## 0.1.1
- Fix: CyberPi not detected on macOS. Ports are listed as `/dev/tty.*` and are now mapped to `/dev/cu.*`.
- Port picker always opens, with Rescan and manual entry; falls back to scanning `/dev/cu.*`.

## 0.1.0
- Upload the current Python file to the CyberPi over USB (⌘⌥U), serial monitor, restart, new-script command.
