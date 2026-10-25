#!/usr/bin/env python3
"""Multi-line scan of a PR's diff for typography carried by <Text className>
(size, line-height, weight, tracking). Colour/layout/shape are allowed.
usage: textscan.py <base> <head>"""
import re, subprocess, sys
b, h = sys.argv[1:3]
files = subprocess.run(["git", "diff", "--name-only", "--diff-filter=AMR", b, h, "--", "autogpt_platform/frontend/src"], capture_output=True, text=True, cwd="/home/vercel-sandbox/autogpt").stdout.split()
SIZE = r"text-(xs|sm|base|lg|[2-9]?xl|tiny|caption-sm|caption|body-sm|body|body-md|body-lg|lead|heading-sm|heading|title|display|\[[0-9.]+(px|rem|em)\])"
TYPO = re.compile(r"(^|\s|:)(" + SIZE + r"|leading-\S+|font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)|tracking-\S+)(?=\s|$)")
hits = 0
for f in files:
    if not f.endswith((".tsx", ".ts")):
        continue
    src = subprocess.run(["git", "show", f"{h}:{f}"], capture_output=True, text=True, cwd="/home/vercel-sandbox/autogpt").stdout
    added = set()
    diff = subprocess.run(["git", "diff", "-U0", b, h, "--", f], capture_output=True, text=True, cwd="/home/vercel-sandbox/autogpt").stdout
    for m in re.finditer(r"^@@ -\S+ \+(\d+)(?:,(\d+))? @@", diff, re.M):
        start, n = int(m.group(1)), int(m.group(2) or 1)
        added.update(range(start, start + n))
    for m in re.finditer(r"<Text\b(.*?)>", src, re.S):
        line = src[: m.start()].count("\n") + 1
        span = set(range(line, line + m.group(0).count("\n") + 1))
        if not span & added:
            continue
        cm = re.search(r'className=(?:"([^"]*)"|\{cn\(([^)]*)\)\})', m.group(1), re.S)
        if not cm:
            continue
        cls = (cm.group(1) or cm.group(2) or "")
        bad = [x.group(2) for x in TYPO.finditer(cls)]
        if bad:
            hits += 1
            print(f"HIT {f.replace('autogpt_platform/frontend/', '')}:{line}: {bad}  className=\"{' '.join(cls.split())[:120]}\"")
print(f"{hits} hits ({b}..{h})")
sys.exit(1 if hits else 0)
