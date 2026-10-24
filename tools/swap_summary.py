"""usage: swap_summary.py <all-pairs.json>  -> markdown table of old -> new class swaps with counts."""
import json, sys, difflib, collections
d = json.load(open(sys.argv[1]))["pairs"]
c = collections.Counter()
for p in d:
    if p.get("tag") == "Text-merged":
        continue
    a = p["old"].split(); b = [] if p["new"] == "(removed)" else p["new"].split()
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if tag == "equal": continue
        o = " ".join(a[i1:i2]); n = " ".join(b[j1:j2]) or "(removed)"
        c[(o, n)] += 1
print("| old | new | uses |\n| --- | --- | --- |")
for (o, n), k in sorted(c.items(), key=lambda kv: (-kv[1], kv[0])):
    print(f"| `{o}` | {'`'+n+'`' if n != '(removed)' else '(removed)'} | {k} |")
