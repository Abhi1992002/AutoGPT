#!/usr/bin/env python3
"""Text variants defined on <head> vs the same names in every open PR's diff:
a name with a different class string is a clash. usage: xprscan.py <head>"""
import json, re, subprocess, sys
h = sys.argv[1]
R = "/home/vercel-sandbox/autogpt"
src = subprocess.run(["git", "show", f"{h}:autogpt_platform/frontend/src/components/atoms/Text/helpers.ts"], capture_output=True, text=True, cwd=R).stdout
body = src[src.index("export const variants"): src.index("} as const")]
mine = {m.group(1) or m.group(2): " ".join(m.group(3).split()) for m in re.finditer(r'^\s*(?:"([a-z0-9-]+)"|([a-z0-9]+)):\s*\n?\s*"([^"]+)"', body, re.M)}
tb = src[src.index("export const tones"):]
tb = tb[:tb.index("} as const")]
my_tones = {m[0]: m[1] for m in re.findall(r'^\s*([a-z]+):\s*"([^"]+)"', tb, re.M)}
import os
CACHE = "/home/vercel-sandbox/autogpt/.context/evidence/diffcache"
os.makedirs(CACHE, exist_ok=True)
prs = json.loads(subprocess.run(["gh", "pr", "list", "--repo", "Significant-Gravitas/AutoGPT", "--state", "open", "--limit", "1000", "--json", "number,headRefOid,changedFiles"], capture_output=True, text=True, check=True).stdout)
def pr_diff(p):
    f = f"{CACHE}/{p['number']}-{p['headRefOid'][:12]}.diff"
    # A cached diff must hold every changed file (one was found truncated).
    if os.path.exists(f) and len(re.findall(r"^diff --git", open(f).read(), re.M)) < p.get("changedFiles", 0):
        os.remove(f)
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
clash = 0; seen = 0; table = {}; editors = []; tone_table = {}
STACK = set(range(16124, 16131))
for p in prs:
    if p["number"] in STACK:
        continue
    d = pr_diff(p)
    if "atoms/Text/helpers.ts" not in d:
        continue
    seen += 1
    editors.append(p["number"])
    for m in re.finditer(r'^\+\s*([a-z]+):\s*"(text-[^"]+)",', d, re.M):
        if m[1] in my_tones:
            tone_table.setdefault(m[1], set()).add((p["number"], m[2] == my_tones[m[1]]))
            if m[2] != my_tones[m[1]]:
                clash += 1; print(f"CLASH tone {m[1]}: #{p['number']} '{m[2]}' vs mine '{my_tones[m[1]]}'")
    for m in re.finditer(r'^\+\s*"([a-z0-9-]+)":\s*\n\+\s*"([^"]+)"|^\+\s*"([a-z0-9-]+)":\s*"([^"]+)",', d, re.M):
        name = m.group(1) or m.group(3); val = " ".join((m.group(2) or m.group(4)).split())
        if name in mine and val not in TAGS:
            table.setdefault(name, set()).add((p["number"], val == mine[name]))
        if name in mine and mine[name] != val and val not in TAGS:
            clash += 1; print(f"CLASH {name}: #{p['number']} '{val}' vs mine '{mine[name]}'")
if "--tones" in sys.argv:
    print("| tone | class on this head | other open PRs defining the same tone | same class |")
    print("| --- | --- | --- | --- |")
    for n in [x for x in sys.argv[sys.argv.index("--tones") + 1].split(",") if x]:
        prsn = sorted(tone_table.get(n, set()))
        print(f"| `{n}` | `{my_tones.get(n, 'MISSING')}` | {', '.join('#' + str(a) for a, _ in prsn) or 'none (new name)'} | {'yes' if all(ok for _, ok in prsn) else 'NO'} |")
if "--table" in sys.argv:
    names = [x for x in sys.argv[sys.argv.index("--table") + 1].split(",") if x]
    print("| variant | class string on this head | other open PRs defining the same name | same string |")
    print("| --- | --- | --- | --- |")
    for n in names:
        prsn = sorted(table.get(n, set()))
        print(f"| `{n}` | `{mine.get(n, 'MISSING')}` | {', '.join('#' + str(a) for a, _ in prsn) or 'none (new name)'} | {'yes' if all(ok for _, ok in prsn) else 'NO'} |")
stack = sorted(n for n in STACK if any(q["number"] == n for q in prs))
print(f"open PRs scanned: {len(prs)}; outside this stack, {seen} edit Text/helpers.ts: {', '.join('#' + str(n) for n in sorted(editors))}")
print(f"OK {clash} clashes ({len(mine)} variants and {len(my_tones)} tones on {h})" if not clash else f"{clash} clashes")
