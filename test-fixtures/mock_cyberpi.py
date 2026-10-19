"""Simulated CyberPi on a pseudo-terminal. Strictly validates frames like the
firmware would (bad header/body checksum -> silence), reassembles the uploaded
file and writes it to argv[2]. Prints the pty path on stdout first."""
import os, sys, struct, tty, time, json
master, slave = os.openpty()
tty.setraw(slave)
link = sys.argv[1]
if os.path.lexists(link): os.unlink(link)
os.symlink(os.ttyname(slave), link)
print(link, flush=True)
out_path = sys.argv[2]
mode = sys.argv[3] if len(sys.argv) > 3 else "ok"
buf = bytearray(); f = None; stats = {"bad": 0, "frames": 0, "blocks": 0}

def frame(body):
    n = len(body)
    return bytes([0xF3, (0xF3 + (n & 255) + (n >> 8)) & 255, n & 255, n >> 8]) + bytes(body) + bytes([sum(body) & 255, 0xF4])

def send(b): os.write(master, b)
ACK = frame([0x01, 0x00, 0x5E, 0xF0, 0x01, 0x00, 0x00])
banner = False
dropped_once = False
while True:
    try: chunk = os.read(master, 4096)
    except OSError: break
    buf += chunk
    while True:
        i = buf.find(0xF3)
        if i < 0: buf.clear(); break
        del buf[:i]
        if len(buf) < 4: break
        n = buf[2] | buf[3] << 8
        if len(buf) < n + 6: break
        hdr_ok = buf[1] == (0xF3 + buf[2] + buf[3]) & 255
        body = bytes(buf[4:4 + n]); ck_ok = buf[4 + n] == sum(body) & 255 and buf[5 + n] == 0xF4
        del buf[:n + 6]
        if not (hdr_ok and ck_ok): stats["bad"] += 1; continue   # firmware ignores bad frames
        stats["frames"] += 1
        if body == b"\x0d\x00\x00":
            if not banner: banner = True; send(b"PYB: fast reboot\r\nCyberOS booting...\r\n")
            send(frame(body)); continue
        if body[0] == 0x28:
            r = b'{"ret":null}'; send(frame(bytes([0x28, 0x05, 0, 0]) + struct.pack("<H", len(r)) + r)); continue
        if body[:3] == b"\x01\x00\x5e":
            cmd = body[3]; plen = struct.unpack("<H", body[4:6])[0]; p = body[6:6 + plen]
            assert len(p) == plen, "payload length field wrong"
            if cmd == 0x01:
                size, ck = struct.unpack("<I", p[1:5])[0], p[5:9]
                f = {"size": size, "ck": ck.hex(), "path": p[9:].decode(), "data": bytearray()}
            elif cmd == 0x02:
                off = struct.unpack("<I", p[:4])[0]
                assert f and off == len(f["data"]), f"offset {off} != {len(f['data']) if f else None}"
                f["data"] += p[4:]; stats["blocks"] += 1
                if mode == "drop" and not dropped_once and stats["blocks"] == 3:
                    dropped_once = True; f["data"] = f["data"][:off]; continue   # lose one ack -> host must retry
            send(b"noise between frames\r\n")
            send(ACK)
            if f and len(f["data"]) == f["size"]:
                d = bytes(f["data"]); x = 0
                d4 = d + b"\0" * (-len(d) % 4)
                for k in range(0, len(d4), 4): x ^= struct.unpack("<I", d4[k:k+4])[0]
                json.dump({"path": f["path"], "size": f["size"], "ck_ok": struct.pack("<I", x).hex() == f["ck"],
                           "data": d.hex(), **stats}, open(out_path, "w"))
                send(b"program says: hello from the new upload\r\n")
