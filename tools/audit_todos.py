"""Every raw colour (palette class with any prefix, arbitrary colour, hex, rgb(),
named colour string) in the given files carries a TODO(tokens): on its line, in
the comment lines right above it, or above the template literal it sits in."""
import re, sys
sys.path.insert(0, "/home/vercel-sandbox/tools")
from regen_todos import template_spans  # main is guarded
FAMS = "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose"
RAW = re.compile(r"(?<![\w/-])(?:[\w\-\[\]&>:=_.*()]+:)?!?[a-z]+(?:-[a-z]+)*-(?:(?:" + FAMS + r")-\d{2,3}|white|black)(?:/\d+)?(?![\w-])|-\[[^\]]*(?:#[0-9a-fA-F]{3,8}|rgba?\()[^\]]*\]|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|rgba?\(\d|\"(?:gray|grey|black|white)\"|\b(?:white|black)\b(?= *[!;,)])")
bad = total = 0
for f in sys.argv[1:]:
    src = open(f).read()
    lines = src.split("\n")
    header = {}
    for a, b, _ in template_spans(src):
        for k in range(a, b + 1):
            header.setdefault(k, a)
    def covered(i, hits=()):
        if "TODO(tokens)" in lines[i]:
            return True
        for k in range(max(0, i - 8), i):
            if "TODO(tokens)" in lines[k] and all(h.lower() in " ".join(lines[k:i]).lower() for h in hits):
                return True
        j = i - 1
        while j >= 0 and re.match(r"^\s*(//|/\*|\*|\{/\*)", lines[j]) or (j >= 0 and lines[j].rstrip().endswith("*/") and "TODO" not in lines[j] and j < i and False):
            if "TODO(tokens)" in lines[j]:
                return True
            j -= 1
        # multi-line /* */ comment ending right above
        j = i - 1
        while j >= 0 and j >= i - 6:
            if "TODO(tokens)" in lines[j]:
                if all(re.match(r"^\s*(\*|/\*|//)", lines[k]) or lines[k].rstrip().endswith("*/") or "TODO" in lines[k] for k in range(j, i)):
                    return True
            j -= 1
        if i in header:
            a = header[i]
            return any("TODO(tokens)" in lines[k] for k in range(max(0, a - 3), a + 1))
        return False
    for i, line in enumerate(lines):
        s = line.strip()
        if s.startswith(("//", "*", "/*", "{/*")) or s.startswith("import "):
            continue
        hits = [m.group(0) for m in RAW.finditer(re.sub(r"/\*.*?\*/", "", line))]
        hits = [h for h in hits if not re.search(r"(text|bg|border|ring)-(sm|xs|lg|base|xl)\b", h)]
        if not hits:
            continue
        total += 1
        if not covered(i, hits):
            bad += 1
            print(f"UNCOVERED {f}:{i + 1}: {hits[:4]}  | {s[:140]}")
print(f"{total} lines with a raw colour; {bad} without a TODO(tokens)")
