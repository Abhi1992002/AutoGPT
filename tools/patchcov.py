"""usage: patchcov.py <cobertura.xml> <base> <head> -> codecov-style patch coverage per file
(added lines that the report lists as executable; hit if hits > 0)."""
import re, subprocess, sys, collections
import xml.etree.ElementTree as ET
xml, base, head = sys.argv[1:4]
ROOT = "/home/vercel-sandbox/autogpt"; FE = "autogpt_platform/frontend/"
cov = collections.defaultdict(dict)
for cls in ET.parse(xml).iter("class"):
    fn = cls.get("filename")
    for ln in cls.iter("line"):
        cov[fn][int(ln.get("number"))] = int(ln.get("hits"))
diff = subprocess.run(["git", "diff", "-U0", base, head, "--", FE + "src"], cwd=ROOT, capture_output=True, text=True).stdout
added = collections.defaultdict(set); cur = None
for l in diff.splitlines():
    if l.startswith("+++ "): cur = l[6:] if l.startswith("+++ b/") else None
    m = re.match(r"@@ -\S+ \+(\d+)(?:,(\d+))? @@", l)
    if m and cur:
        s, n = int(m.group(1)), int(m.group(2) or 1)
        added[cur].update(range(s, s + n))
tot = hit = 0; rows = []
for f, lines in added.items():
    key = next((k for k in cov if f.endswith(k) or k.endswith(f.replace(FE, ""))), None)
    if not key: continue
    ex = [l for l in lines if l in cov[key]]
    h = [l for l in ex if cov[key][l] > 0]
    tot += len(ex); hit += len(h)
    if ex: rows.append((len(ex) - len(h), len(ex), f.replace(FE + "src/app/(platform)/build/", ""), sorted(set(ex) - set(h))))
print(f"patch: {hit}/{tot} = {100*hit/max(tot,1):.1f}%")
for miss, n, f, ls in sorted(rows, reverse=True)[:45]: print(f"{miss:4d}/{n:<4d} {f}  {ls[:12]}")
