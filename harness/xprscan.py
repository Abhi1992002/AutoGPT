#!/usr/bin/env python3
"""Text variants defined on <head> vs the same names in every open PR's diff:
a name with a different class string is a clash. usage: xprscan.py <head>"""
import json, re, subprocess, sys
h = sys.argv[1]
R = "/home/vercel-sandbox/autogpt"
src = subprocess.run(["git", "show", f"{h}:autogpt_platform/frontend/src/components/atoms/Text/helpers.ts"], capture_output=True, text=True, cwd=R).stdout
body = src[src.index("export const variants"): src.index("} as const")]
mine = {m.group(1) or m.group(2): " ".join(m.group(3).split()) for m in re.finditer(r'^\s*(?:"([a-z0-9-]+)"|([a-z0-9]+)):\s*\n?\s*"([^"]+)"', body, re.M)}
import os
CACHE = "/home/vercel-sandbox/autogpt/.context/evidence/diffcache"
os.makedirs(CACHE, exist_ok=True)
prs = json.loads(subprocess.run(["gh", "pr", "list", "--repo", "Significant-Gravitas/AutoGPT", "--state", "open", "--limit", "200", "--json", "number,headRefOid"], capture_output=True, text=True, check=True).stdout)
def pr_diff(p):
    f = f"{CACHE}/{p['number']}-{p['headRefOid'][:12]}.diff"
    if not os.path.exists(f):
        out = subprocess.run(["gh", "pr", "diff", str(p["number"]), "--repo", "Significant-Gravitas/AutoGPT"], capture_output=True, text=True)
        text = out.stdout
        if out.returncode != 0:
            # Too large for the API (over 300 files): fetch the PR ref with git
            # (no API call) and diff it locally against its merge base.
            ref = f"refs/remotes/pr/{p['number']}"
            subprocess.run(["git", "fetch", "-q", "origin", f"pull/{p['number']}/head:{ref}"], cwd=R, check=True)
            mb = subprocess.run(["git", "merge-base", "origin/dev", ref], capture_output=True, text=True, cwd=R, check=True).stdout.strip()
            text = subprocess.run(["git", "diff", mb, ref], capture_output=True, text=True, cwd=R).stdout
        open(f, "w").write(text)
    return open(f).read()
# variantElementMap values are element tags, not class strings.
TAGS = {"h1", "h2", "h3", "h4", "h5", "h6", "p", "span", "div", "code", "label", "kbd", "li", "dt", "dd"}
clash = 0; seen = 0; table = {}
STACK = set(range(16124, 16131))
for p in prs:
    if p["number"] in STACK:
        continue
    d = pr_diff(p)
    if "atoms/Text/helpers.ts" not in d:
        continue
    seen += 1
    for m in re.finditer(r'^\+\s*"([a-z0-9-]+)":\s*\n\+\s*"([^"]+)"|^\+\s*"([a-z0-9-]+)":\s*"([^"]+)",', d, re.M):
        name = m.group(1) or m.group(3); val = " ".join((m.group(2) or m.group(4)).split())
        if name in mine and val not in TAGS:
            table.setdefault(name, set()).add((p["number"], val == mine[name]))
        if name in mine and mine[name] != val and val not in TAGS:
            clash += 1; print(f"CLASH {name}: #{p['number']} '{val}' vs mine '{mine[name]}'")
if "--table" in sys.argv:
    names = [x for x in sys.argv[sys.argv.index("--table") + 1].split(",") if x]
    print("| variant | class string on this head | other open PRs defining the same name | same string |")
    print("| --- | --- | --- | --- |")
    for n in names:
        prsn = sorted(table.get(n, set()))
        print(f"| `{n}` | `{mine.get(n, 'MISSING')}` | {', '.join('#' + str(a) for a, _ in prsn) or 'none (new name)'} | {'yes' if all(ok for _, ok in prsn) else 'NO'} |")
print(f"OK {clash} clashes ({len(mine)} variants on {h}; {seen} open PRs edit Text/helpers.ts)" if not clash else f"{clash} clashes")
