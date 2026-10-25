#!/usr/bin/env python3
"""Cross-PR Text variant/tone scan (QUALITY 35). Equivalent of the orchestrator's
conductor/text-variants-xpr.py, which is not present in this workspace.
Reads `variants` and `tones` from autogpt_platform/frontend/src/components/atoms/Text/helpers.ts
on origin/dev and on the head of every open PR that changes that file, then reports:
  CLASH  : the same name defined with different strings in two sources
  DUPSTR : the same string defined under different names (within or across sources)
Exit 1 if any CLASH/DUPSTR involves the PRs named in --mine."""
import json, re, subprocess, sys
REPO = "Significant-Gravitas/AutoGPT"
PATH = "autogpt_platform/frontend/src/components/atoms/Text/helpers.ts"
mine = [int(x) for x in sys.argv[sys.argv.index("--mine") + 1].split(",")] if "--mine" in sys.argv else []
sh = lambda *a: subprocess.run(a, capture_output=True, text=True, check=True).stdout
def parse(src):
    out = {}
    for block in ("variants", "tones"):
        m = re.search(r"export const %s = \{(.*?)\n\} as const;" % block, src, re.S)
        if not m: continue
        body = re.sub(r"//[^\n]*", "", m.group(1))
        for k, v in re.findall(r'"?([\w-]+)"?\s*:\s*"([^"]*)"', body):
            out[(block, k)] = " ".join(v.split())
    return out
sources = []
sh("git", "fetch", "-q", "origin", "dev")
dev = sh("git", "rev-parse", "--short", "origin/dev").strip()
sources.append((f"dev@{dev}", parse(sh("git", "show", f"origin/dev:{PATH}"))))
prs = json.loads(sh("gh", "pr", "list", "-R", REPO, "--state", "open", "--limit", "400", "--json", "number,headRefOid,headRefName,files"))
touch = sorted([p for p in prs if any(f["path"] == PATH for f in p["files"])], key=lambda p: p["number"])
for p in touch:
    sha = p["headRefOid"]
    subprocess.run(["git", "fetch", "-q", "origin", f"pull/{p['number']}/head"], check=True)
    sources.append((f"#{p['number']}@{sha[:9]} ({p['headRefName']})", parse(sh("git", "show", f"{sha}:{PATH}"))))
print(f"scan of {PATH}")
print(f"sources: {len(sources)} (dev + {len(touch)} open PRs that change the file)")
for name, d in sources: print(f"  {name}: {sum(1 for b,_ in d if b=='variants')} variants, {sum(1 for b,_ in d if b=='tones')} tones")
issues = []
names = {}
for src, d in sources:
    for key, val in d.items(): names.setdefault(key, {}).setdefault(val, []).append(src)
for (block, k), vals in sorted(names.items()):
    if len(vals) > 1:
        issues.append(("CLASH", f"{block}.{k}", "; ".join(f"{v!r} in {', '.join(s)}" for v, s in vals.items())))
strs = {}
for src, d in sources:
    for (block, k), val in d.items(): strs.setdefault((block, val), set()).add(k)
for (block, val), ks in sorted(strs.items()):
    if len(ks) > 1:
        who = sorted({s for s, d in sources for kk in ks if d.get((block, kk)) == val})
        issues.append(("DUPSTR", f"{block} {val!r}", f"names {sorted(ks)} in {', '.join(who)}"))
for kind, what, detail in issues: print(f"{kind} {what}: {detail}")
mine_tags = [f"#{n}@" for n in mine]
bad = [i for i in issues if not mine or any(t in i[2] for t in mine_tags)]
if mine: print(f"involving {', '.join('#'+str(n) for n in mine)}: {len(bad)}")
print(f"OK 0 clashes" if not bad else f"FAIL {len(bad)} clashes involving the PRs under check")
sys.exit(1 if bad else 0)
