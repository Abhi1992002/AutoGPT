"""For flaky routes: union bbox of pixel differences within one commit's runs
(noise) vs between commits. Cross-commit differences must sit inside the noise
box. Also reports the smallest cross-commit diff per head run."""
import sys, itertools
from PIL import Image, ImageChops
S = "/home/vercel-sandbox/autogpt/.context/shots/"
def runs(c):
    base = {"dev": ["dev-c-routes", "dev-d-routes"], "pr1": ["pr1-a-routes", "pr1-b-routes"], "pr2": ["pr2-a-routes", "pr2-b-routes"]}[c]
    return [S + d for d in base] + [S + f"flaky-{c}-{i}" for i in (1, 2, 3)]
def bbox(a, b):
    A = Image.open(a).convert("RGB"); B = Image.open(b).convert("RGB")
    if A.size != B.size: return "size"
    return ImageChops.difference(A, B).getbbox()
def union(bs):
    bs = [b for b in bs if b and b != "size"]
    if not bs: return None
    return (min(b[0] for b in bs), min(b[1] for b in bs), max(b[2] for b in bs), max(b[3] for b in bs))
def inside(b, n): return b is None or (n is not None and b[0] >= n[0] and b[1] >= n[1] and b[2] <= n[2] and b[3] <= n[3])
base, head = sys.argv[1], sys.argv[2]
print(f"| screenshot | noise box within {base} runs | noise box within {head} runs | box of all {base}↔{head} differences | inside the noise box |")
print("| --- | --- | --- | --- | --- |")
for name in sys.argv[3:]:
    nb = union([bbox(f"{x}/{name}", f"{y}/{name}") for x, y in itertools.combinations(runs(base), 2)])
    nh = union([bbox(f"{x}/{name}", f"{y}/{name}") for x, y in itertools.combinations(runs(head), 2)])
    cross = union([bbox(f"{x}/{name}", f"{y}/{name}") for x in runs(base) for y in runs(head)])
    noise = union([nb, nh])
    print(f"| {name} | {nb} | {nh} | {cross} | {'yes' if inside(cross, noise) else 'NO'} |")
