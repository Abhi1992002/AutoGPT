"""usage: cross.py <before-prefix> <after-prefix> <out.md>  (runs under /home/vercel-sandbox/shots)
Exact RGBA diff of every capture for every before-run x after-run pair; min per capture."""
import itertools, sys, json
from pathlib import Path
import numpy as np
from PIL import Image
S = Path("/home/vercel-sandbox/shots")
B = sorted(S.glob(sys.argv[1] + "-run*")); H = sorted(S.glob(sys.argv[2] + "-run*"))
names = sorted({p.name for d in B + H for p in d.glob("*.png")})
load = lambda p: np.array(Image.open(p).convert("RGBA"))
rows, worst, zero = [], 0, 0
for n in names:
    cells = []
    for b, h in itertools.product(B, H):
        A, C = load(b / n), load(h / n)
        cells.append(10**9 if A.shape != C.shape else int((A != C).any(2).sum()))
    m = min(cells); worst = max(worst, m); zero += m == 0
    rows.append(f"| {n} | " + " | ".join(map(str, cells)) + f" | **{m}** |")
hdr = "| capture | " + " | ".join(f"{b.name.split('-run')[1]}↔{h.name.split('-run')[1]}" for b, h in itertools.product(B, H)) + " | min |"
Path(sys.argv[3]).write_text(f"{sys.argv[1]} runs x {sys.argv[2]} runs (exact RGBA, threshold 0)\n\n{hdr}\n|{' --- |' * (len(B) * len(H) + 2)}\n" + "\n".join(rows) + "\n")
print(f"{len(names)} captures; {zero} have a pixel-identical {sys.argv[1]}/{sys.argv[2]} pair; worst min = {worst}")
