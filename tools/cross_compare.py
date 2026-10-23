"""For every capture: pixel diff of each base run against each head run (exact RGBA,
like DS1's compare at threshold 0, which counts anti-aliased pixels too), the
bounding box of each nonzero diff, and whether some head run equals some base run."""
import itertools, json, sys
from pathlib import Path
import numpy as np
from PIL import Image
S = Path("/home/vercel-sandbox/shots")
base = sorted(S.glob("base-run*")); head = sorted(S.glob("head-run*"))
names = sorted({p.name for d in base + head for p in d.glob("*.png")})
SIDEBAR = (0, 46, 103, 293)  # x0, x1, y0, y1
rows, summary = [], {"captures": len(names), "exact_match_somewhere": 0, "nonzero_outside_sidebar": []}
def load(p): return np.array(Image.open(p).convert("RGBA"))
for n in names:
    cells = {}
    for b, h in itertools.product(base, head):
        A, B = load(b / n), load(h / n)
        if A.shape != B.shape:
            cells[(b.name, h.name)] = ("size", None); continue
        m = (A != B).any(axis=2); c = int(m.sum())
        box = None
        if c:
            ys, xs = np.nonzero(m); box = (int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max()))
        cells[(b.name, h.name)] = (c, box)
    counts = [v[0] for v in cells.values()]
    best = min(c for c in counts if c != "size") if any(c != "size" for c in counts) else "size"
    if best == 0: summary["exact_match_somewhere"] += 1
    for (bn, hn), (c, box) in cells.items():
        if c == "size" or (c and not (box[0] >= SIDEBAR[0] and box[1] <= SIDEBAR[1] and box[2] >= SIDEBAR[2] and box[3] <= SIDEBAR[3])):
            summary["nonzero_outside_sidebar"].append((n, bn, hn, c, box))
    rows.append((n, cells, best))
hdr = "| capture | " + " | ".join(f"{b.name.split('-')[1]}↔{h.name.split('-')[1]}" for b, h in itertools.product(base, head)) + " | min |"
lines = [hdr, "|" + " --- |" * (len(base) * len(head) + 2)]
for n, cells, best in rows:
    lines.append(f"| {n} | " + " | ".join(str(cells[(b.name, h.name)][0]) for b, h in itertools.product(base, head)) + f" | {best} |")
Path(sys.argv[1]).write_text("\n".join(lines) + "\n")
print(json.dumps(summary, indent=1))
