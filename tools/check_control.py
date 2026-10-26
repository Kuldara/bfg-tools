# -*- coding: utf-8 -*-
"""Control characters in the source files.

The builds guard the finished page, but not the sources. The difference matters, because
a control character DOES NOT SHOW when displayed: it just disappears, and the code looks right.
Three times on 15.9.2026 our own editing wrote a Python string's escape sequence as
a byte instead of two characters:

  "\u0000" -> a NUL in domain.js; git read the source as binary, the build passed
  "\b"     -> a backspace in a regular expression of test_domain.js,
             which therefore COULD NEVER MATCH - the test looks like a check
             and is not. It is the same class of defect as the lifeless control golden (J133).

Newline, tab and carriage return are allowed. There is no
exception: if a character is to be documented, it is written visibly as an escape.

Run: python tools/check_control.py [-v]
"""
import io, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
# The whole repository, not just this app: shared code and data are elsewhere.
ROOT = os.path.dirname(HERE)
VERBOSE = "-v" in sys.argv
SKIP_DIR = (".git", "node_modules", "__pycache__", "tmp", "books", "dist", "out",
            "share version", ".tmp.drivedownload", ".tmp.driveupload")
EXT = (".py", ".js", ".md", ".json", ".html", ".txt", ".css")
OK = (9, 10, 13)

bad, scanned = [], 0
for root, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in SKIP_DIR and not d.startswith(".")]
    for name in files:
        if not name.endswith(EXT):
            continue
        path = os.path.join(root, name)
        rel = os.path.relpath(path, ROOT)
        try:
            data = io.open(path, "rb").read()
        except Exception:
            continue
        scanned += 1
        for i, ch in enumerate(data):
            if ch < 32 and ch not in OK or ch == 127:
                line = data.count(b"\n", 0, i) + 1
                bad.append((rel, line, hex(ch)))
                break
        if VERBOSE:
            print("  read %s" % rel)

for rel, line, ch in bad:
    print("  %s:%d  control character %s" % (rel, line, ch))
print("files checked %d, control characters %d" % (scanned, len(bad)))
sys.exit(1 if bad else 0)
