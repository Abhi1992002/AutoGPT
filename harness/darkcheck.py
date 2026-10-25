#!/usr/bin/env python3
"""QUALITY 43: every dark: class on a removed line of `git diff <base>...<head>`
must reappear verbatim on an added line (moved, not dropped).
usage: darkcheck.py <base> <head>"""
import re, subprocess, sys
from collections import Counter
b, h = sys.argv[1:3]
d = subprocess.run(["git", "diff", "-M", f"{b}...{h}", "--", "autogpt_platform/frontend/src"], capture_output=True, text=True, cwd="/home/vercel-sandbox/autogpt").stdout
tok = re.compile(r"(?<![\w-])((?:[\w-]+:)*dark:[^\s\"'`]+)")
rem, add = Counter(), Counter()
for line in d.splitlines():
    if line.startswith("-") and not line.startswith("---"):
        rem.update(tok.findall(line))
    elif line.startswith("+") and not line.startswith("+++"):
        add.update(tok.findall(line))
dropped = rem - add
print(f"git diff {b}...{h} | grep -E '^-.*dark:': {sum(rem.values())} dark: classes on removed lines, {sum(add.values())} on added lines; dropped: {sum(dropped.values())}")
for t, n in dropped.items():
    print(f"DROPPED {t} x{n}")
sys.exit(1 if dropped else 0)
