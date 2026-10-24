import json, os, re, sys
# For every test in the organism-rendering files: final DOM (inline style removed,
# data-slot removed) on two base runs and two head runs. A test passes when some
# base run equals some head run. A test that differs base-vs-head while each commit
# repeats itself exactly would be a real change.
D = sys.argv[1]
STYLE = re.compile(r' style="[^"]*"')
runs = {r: D + "/" + r for r in ["base2", "base2-rerun", "head2", "head2-rerun"]}
files = sorted(os.listdir(runs["base2-rerun"]))
total = matched = 0; real = []; noisy = []
def final(r, f, t):
    p = os.path.join(runs[r], f)
    if not os.path.exists(p): return None
    s = json.load(open(p)).get(t)
    return STYLE.sub("", s[-1]) if s else ""
for f in files:
    tests = json.load(open(os.path.join(runs["base2-rerun"], f))).keys()
    for t in tests:
        total += 1
        b = [final(r, f, t) for r in ("base2", "base2-rerun")]
        h = [final(r, f, t) for r in ("head2", "head2-rerun")]
        if any(x == y for x in b for y in h): matched += 1; continue
        if b[0] == b[1] and h[0] == h[1]: real.append(f"{f} :: {t}")
        else: noisy.append(f"{f} :: {t}")
print(f"files={len(files)} tests={total} matched base/head final DOM={matched} unmatched but non-repeating on one commit={len(noisy)} unmatched and repeatable (real difference)={len(real)}")
for x in real: print("  REAL", x)
for x in noisy: print("  NOISY", x)
