"""Cross-matrix: for every capture, exact RGBA pixel diff of every before-run against every
after-run (like DS1's compare at threshold 0), the minimum, and the minimum between the
before-runs themselves (same commit: the capture's own noise).
usage: cross.py <out.md> <before dir,...> <after dir,...>"""
import itertools, sys
from pathlib import Path
import numpy as np
from PIL import Image
out, A, B = sys.argv[1], [Path(p) for p in sys.argv[2].split(",")], [Path(p) for p in sys.argv[3].split(",")]
names = sorted({p.name for d in A + B for p in d.glob("*.png")})
def load(p): return np.array(Image.open(p).convert("RGBA")) if p.exists() else None
def diff(x, y):
    if x is None or y is None: return "missing", None
    if x.shape != y.shape: return "size", None
    m = (x != y).any(axis=2); c = int(m.sum())
    if not c: return 0, None
    ys, xs = np.nonzero(m); return c, (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max()))
rows = []; zero = 0; nz = []
for n in names:
    ia = [load(d / n) for d in A]; ib = [load(d / n) for d in B]
    cross = [diff(x, y) for x, y in itertools.product(ia, ib)]
    same = [diff(x, y) for x, y in itertools.combinations(ia, 2)] + [diff(x, y) for x, y in itertools.combinations(ib, 2)]
    nums = [c for c, _ in cross if isinstance(c, int)]
    best = min(nums) if nums else cross[0][0]
    snums = [c for c, _ in same if isinstance(c, int)]
    if best == 0: zero += 1
    else: nz.append(n)
    boxes = "; ".join(sorted({str(b) for c, b in cross if b})) if best else ""
    sboxes = "; ".join(sorted({str(b) for c, b in same if b}))
    rows.append(f"| {n} | {' / '.join(str(c) for c, _ in cross)} | **{best}** | {' / '.join(str(c) for c in snums) or 'n/a'} | {boxes} | {sboxes} |")
hdr = f"{len(names)} captures: {zero} have a before/after pair at 0 px; {len(nz)} do not\n\n| capture | before×after diffs ({len(A)}×{len(B)} runs) | min | same-commit diffs | before×after diff boxes (x0,y0,x1,y1) | same-commit diff boxes |\n| --- | --- | --- | --- | --- | --- |"
Path(out).write_text(hdr + "\n" + "\n".join(rows) + "\n")
print(hdr.split("\n")[0]); [print("  nonzero:", n) for n in nz]
