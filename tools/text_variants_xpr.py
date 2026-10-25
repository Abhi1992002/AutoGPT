"""Rules 34/35: the Text variants and tones of one head against dev and every
open abhi/* PR head. A clash is one name with two different strings; a
duplicate is one string under two names. Only pairs that involve a name or
string this head adds over dev are reported.
  python3 text_variants_xpr.py <head sha> <dev sha> <prs.txt: "num branch sha" per line>"""
import re, subprocess, sys
from collections import defaultdict
P = "autogpt_platform/frontend/src/components/atoms/Text/helpers.ts"

def parse(sha):
    try:
        src = subprocess.run(["git", "show", f"{sha}:{P}"], capture_output=True, text=True, check=True).stdout
    except subprocess.CalledProcessError:
        return None
    out = {}
    for block in ("variants", "tones"):
        m = re.search(r"export const " + block + r" = \{(.*?)\n\} as const;", src, re.S)
        if not m: continue
        body = re.sub(r"//[^\n]*", "", m.group(1))
        for k, v in re.findall(r'(?:"([^"]+)"|(\w+))\s*:\s*\n?\s*"([^"]*)"', body) and [(a or b, c) for a, b, c in re.findall(r'(?:"([^"]+)"|(\w+))\s*:\s*\n?\s*"([^"]*)"', body)]:
            out[(block, k)] = " ".join(sorted(v.split()))
    return out

head, dev, prs = sys.argv[1], sys.argv[2], sys.argv[3]
H, D = parse(head), parse(dev)
added = {k: v for k, v in H.items() if D.get(k) != v}
print(f"head {head[:9]}: {sum(1 for k in H if k[0]=='variants')} variants, {sum(1 for k in H if k[0]=='tones')} tones; {len(added)} added or changed over dev {dev[:9]}")
others = [("dev", dev, D)]
for line in open(prs).read().split("\n")[1:]:
    if not line.strip(): continue
    n, b, s = line.split()
    if s.startswith(head[:9]) or b in ("abhi/tokenise-flow-editor", "abhi/tokenise-flow-editor-canvas"): continue
    t = parse(s)
    if t is not None: others.append((f"#{n} {b} {s[:9]}", s, t))
print(f"compared with dev and {len(others) - 1} open abhi/* PR heads (this stack excluded)")
clashes, dups = [], []
for label, _, T in others:
    for k, v in added.items():
        if k in T and T[k] != v: clashes.append(f"CLASH {k[0]}.{k[1]}: here `{v}`, {label} `{T[k]}`")
        for k2, v2 in T.items():
            if k2[0] == k[0] and k2 != k and v2 == v and k2 not in H: dups.append(f"DUP {k[0]}.{k[1]} here = {k2[0]}.{k2[1]} in {label}: `{v}`")
by = defaultdict(list)
for k, v in H.items(): by[(k[0], v)].append(k[1])
for (blk, v), names in by.items():
    if len(names) > 1: dups.append(f"DUP within head {blk}: {', '.join(names)}: `{v}`")
for l in clashes + dups: print(l)
print(f"{'OK' if not clashes and not dups else 'FAIL'} {len(clashes)} clashes, {len(dups)} duplicate strings")
