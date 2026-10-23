"""Condenses molecules-equivalence.md: one row per distinct token swap."""
import re, sys, collections
md=open(sys.argv[1]).read().split("\n\n")[0].splitlines()[2:]
rows=collections.OrderedDict()
cases=0; fails=0
for line in md:
    cells=[c.strip() for c in re.split(r'(?<!\\)\|',line)[1:-1]]
    f,old,new,val,res=cells
    o=old.strip('`').split(); n=new.strip('`').split()
    rem=[t for t in o if t not in n]; add=[t for t in n if t not in o]
    if not rem and not add: continue
    key=(" ".join(rem)," ".join(add))
    m=re.search(r'\((\d+) cases\)',res); c=int(m.group(1)) if m else 0
    cases+=c; fails+= res.startswith("FAIL")
    r=rows.setdefault(key,{"files":[], "val":val, "res":[], "c":0})
    short=f.split("/")[0].split(" ")[0].replace(".tsx","")
    if short not in r["files"]: r["files"].append(short)
    r["c"]+=c; r["res"].append(res)
print("| removed (old) | added (new) | where | resolved value (new, first parent) | result |")
print("| --- | --- | --- | --- | --- |")
for (rem,add),r in rows.items():
    ok=all(x.startswith("identical") for x in r["res"])
    val=r["val"]
    print(f"| `{rem or '—'}` | `{add or '—'}` | {', '.join(r['files'])} | {val} | {'identical' if ok else 'FAIL'} ({r['c']} cases) |")
print(f"\n{len(md)} class-string pairs, {len(rows)} distinct swaps, {cases} computed cases, {fails} failing", file=sys.stderr)
