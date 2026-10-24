import json, os, re, sys
# Usage: domdump-compare.py <baseDir> <headDir> <headSlotsDir> <organismSlugsFile>
# Normalises out timing noise (inline style values written by animation frames),
# then compares, per test, the final DOM and the set of distinct DOM states.
base, head, slotsdir, slugfile = sys.argv[1:5]
STYLE = re.compile(r' style="[^"]*"')
norm = lambda h: STYLE.sub("", h)
def states(lst):
    out = []
    for h in map(norm, lst):
        if not out or out[-1] != h: out.append(h)
    return out
files = sorted(set(os.listdir(base)) | set(os.listdir(head)))
tests = final_diff = set_diff = 0; finals = []; sets = []
for f in files:
    a = json.load(open(os.path.join(base, f))) if os.path.exists(os.path.join(base, f)) else {}
    b = json.load(open(os.path.join(head, f))) if os.path.exists(os.path.join(head, f)) else {}
    for t in sorted(set(a) | set(b)):
        tests += 1
        sa, sb = states(a.get(t, [])), states(b.get(t, []))
        if (sa[-1:] != sb[-1:]):
            final_diff += 1; finals.append(f"{f} :: {t}")
        if set(sa) != set(sb):
            set_diff += 1; sets.append(f"{f} :: {t}")
slugs = set(json.load(open(slugfile)))
seen = set()
for f in os.listdir(slotsdir):
    seen |= set(json.load(open(os.path.join(slotsdir, f))))
print(f"test files={len(files)} tests={tests} final DOM differs={final_diff} distinct-state set differs={set_diff}")
for d in finals[:30]: print("  FINAL", d)
print(f"organism slots rendered somewhere in the suite: {len(slugs & seen)} of {len(slugs)}")
json.dump({"final": finals, "sets": sets, "unrendered": sorted(slugs - seen)}, open(os.path.join(os.path.dirname(head.rstrip('/')), "compare-detail.json"), "w"), indent=1)
