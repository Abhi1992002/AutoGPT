# usage: asserts.py <dir> [<dir>...]  -> totals per dir and side-by-side failures
import json, glob, os, sys
dirs = sys.argv[1:]
res = {}
for d in dirs:
    r = {}
    for f in sorted(glob.glob(os.path.join(d, "*.asserts.json"))):
        st = os.path.basename(f).replace(".asserts.json", "")
        for a in json.load(open(f)):
            r[(st, a["name"])] = (a["pass"], a["got"])
    res[d] = r
for d in dirs:
    n = len(res[d]); bad = sum(1 for v in res[d].values() if not v[0])
    print(f"{os.path.basename(d)}: {n} assertions, {bad} failed")
keys = sorted(set().union(*[set(r) for r in res.values()]))
fails = [k for k in keys if any(not res[d].get(k, (True,))[0] for d in dirs)]
if fails:
    print("| state | assertion | " + " | ".join(os.path.basename(d) for d in dirs) + " |")
    print("|---|---|" + "---|" * len(dirs))
    for k in fails:
        cells = []
        for d in dirs:
            v = res[d].get(k)
            cells.append("missing" if v is None else ("pass" if v[0] else f"FAIL (got {v[1][:40]})"))
        print(f"| {k[0]} | {k[1]} | " + " | ".join(cells) + " |")
