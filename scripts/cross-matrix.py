import re, sys, os, glob
# Builds the base x head pixel matrix from the compare logs in /tmp.
pairs = {}
for log in sorted(glob.glob("/tmp/cmp-base2-*-head2-*.log")):
    name = os.path.basename(log)[4:-4]
    pairs[name] = {}
    for line in open(log):
        m = re.match(r"\| (\S+\.png) \| [^|]+ \| (\S+) \|", line)
        if m: pairs[name][m.group(1)] = m.group(2)
cols = list(pairs)
shots = sorted(set().union(*[set(p) for p in pairs.values()]))
rows = ["| screenshot | " + " | ".join(c.replace("-head2", " vs head2").replace("base2-", "dev ").replace("head2-", "head ") for c in cols) + " | 0-px pair |", "|---" * (len(cols) + 2) + "|"]
bad = []
for s in shots:
    vals = [pairs[c].get(s, "-") for c in cols]
    zero = [c for c, v in zip(cols, vals) if v == "0"]
    ok = zero[0].replace("-head2", " vs head2").replace("base2-", "dev ").replace("head2-", "head ") if zero else "NONE"
    if not zero: bad.append(s)
    rows.append(f"| {s} | " + " | ".join(vals) + f" | {ok} |")
rows.append("")
rows.append(f"{len(shots)} screenshots; without a 0-px base/head pair: {', '.join(bad) or 'none'}")
open(sys.argv[1], "w").write("\n".join(rows))
print(rows[-1])
