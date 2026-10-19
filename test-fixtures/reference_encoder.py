"""Independent reference encoder for the CyberPi upload protocol, written from the
protocol description in README.md. The TypeScript implementation is tested against
the frames this produces (tests/expected.json). Regenerate with:

    python3 test-fixtures/reference_encoder.py
"""
import json, os, struct

HERE = os.path.dirname(os.path.abspath(__file__))
CHUNK = 80
PATH = b"/flash/_xx_main.py"


def frame(body: bytes) -> bytes:
    n = len(body)
    return bytes([0xF3, (0xF3 + (n & 0xFF) + (n >> 8)) & 0xFF, n & 0xFF, n >> 8]) + body + bytes([sum(body) & 0xFF, 0xF4])


def exec_frame(code: str) -> bytes:
    src = code.encode()
    return frame(bytes([0x28, 0x04, 0x00, 0x00]) + struct.pack("<H", len(src)) + src)


def checksum(data: bytes) -> bytes:
    x = 0
    padded = data + b"\0" * (-len(data) % 4)
    for i in range(0, len(padded), 4):
        x ^= struct.unpack_from("<I", padded, i)[0]
    return struct.pack("<I", x)


def ftp(cmd: int, payload: bytes) -> bytes:
    return frame(bytes([0x01, 0x00, 0x5E, cmd]) + struct.pack("<H", len(payload)) + payload)


def pad(data: bytes) -> bytes:
    return data + b"\n" * ((4 - len(data) % CHUNK) % CHUNK)


def file_frames(data: bytes) -> list:
    out = [ftp(0x01, b"\x00" + struct.pack("<I", len(data)) + checksum(data) + PATH)]
    end = len(data) - 4
    for off in range(0, end, CHUNK):
        out.append(ftp(0x02, struct.pack("<I", off) + data[off:min(off + CHUNK, end)]))
    out.append(ftp(0x02, struct.pack("<I", end) + data[end:]))
    return out


if __name__ == "__main__":
    progs = os.path.join(HERE, "programs")
    result = {
        "PING": frame(b"\x0d\x00\x00").hex(),
        "EXEC1": exec_frame("try:\n    import config\nexcept:\n    pass").hex(),
        "EXEC2": exec_frame('try:\n    config.write_config("repl_enable", False)\nexcept:\n    pass').hex(),
        "files": {},
    }
    for name in sorted(os.listdir(progs)):
        src = open(os.path.join(progs, name), "rb").read()
        result["files"][name] = {"source": src.hex(), "frames": [f.hex() for f in file_frames(pad(src))]}
    with open(os.path.join(HERE, "expected.json"), "w") as fh:
        json.dump(result, fh, indent=1)
    print({k: len(v["frames"]) for k, v in result["files"].items()})
