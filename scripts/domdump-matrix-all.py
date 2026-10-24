import json, os, re, sys
# Final DOM (inline style and data-slot removed) per test across every run of each
# commit. Pass = some dev run equals some head run. "Real" = no pair matches while
# every run of each commit agrees with the others of that commit.
D = sys.argv[1]
STYLE = re.compile(r' style="[^"]*"')
BASE = ["base2", "base2-rerun", "x-base2-1", "x-base2-2"]
HEAD = ["head2", "head2-rerun", "x-head2-1", "x-head2-2"]
def final(r, f, t):
    p = os.path.join(D, r, f)
    if not os.path.exists(p): return None
    s = json.load(open(p)).get(t)
    return STYLE.sub("", s[-1]) if s else None
files = sorted(os.listdir(os.path.join(D, "x-head2-1")))
total = matched = 0; real = []; noisy = []
for f in files:
    for t in json.load(open(os.path.join(D, "x-head2-1", f))):
        total += 1
        b = [x for x in (final(r, f, t) for r in BASE) if x is not None]
        h = [x for x in (final(r, f, t) for r in HEAD) if x is not None]
        if any(x == y for x in b for y in h): matched += 1; continue
        (real if len(set(b)) == 1 and len(set(h)) == 1 else noisy).append(f"{f} :: {t}")
print(f"files={len(files)} tests={total} final DOM matched (dev run == head run)={matched} unmatched, nondeterministic on one commit={len(noisy)} unmatched and repeatable={len(real)}")
for x in real: print("  REAL", x)
for x in noisy: print("  NOISY", x)
