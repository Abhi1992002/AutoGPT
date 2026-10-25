"""QUALITY 43 (2): every colour swap in a PR (from its measured pair list) with the
new token's :root and .dark values, kind and meaning, and whether dark mode is
unchanged (token not redefined under .dark, or redefined to the old value).
  python3 swap_dark_table.py <pairs.json> <head sha> <out.md>"""
import json, re, subprocess, sys, collections
sys.path.insert(0, "/home/vercel-sandbox/tools")
from regen_todos import role_kind
pairs, head, out = sys.argv[1:4]
PAL = json.load(open("/home/vercel-sandbox/tools/palette.json"))
g = subprocess.run(["git", "show", f"{head}:autogpt_platform/frontend/src/app/globals.css"], cwd="/home/vercel-sandbox/autogpt", capture_output=True, text=True).stdout
def block(sel):
    m = re.search(sel + r"\s*\{(.*?)\n\s*\}", g, re.S)
    return {k: (v, (c or "").strip()) for k, v, c in re.findall(r"--color-([\w-]+):\s*([\d ]+?)\s*;\s*(?:/\*(.*?)\*/)?", "".join(re.findall(sel + r"\s*\{(.*?)\n\s*\}", g, re.S)))}
root, dark = block(r":root"), block(r"\.dark")
UT = r"(bg|text|border(?:-[trblxy])?|ring|ring-offset|stroke|fill|outline|divide|placeholder|from|via|to|decoration|shadow|scrollbar-thumb)"
def colour(tok):
    m = re.match(r"^((?:[\w\-\[\]&>:=]+:)*)(!?)" + UT + r"-(.+?)(/\d+)?$", tok)
    if not m: return None
    pre, bang, util, name, alpha = m.groups()
    if name in root or name in PAL or name in ("white", "black", "transparent", "inherit", "current"): return (pre + bang + util, name, alpha or "")
    return None
rows = collections.Counter()
for p in json.load(open(pairs))["pairs"]:
    o, n = p["old"].split(), (p["new"] or "").split()
    rem = [t for t in o if t not in n and colour(t)]; add = [t for t in n if t not in o and colour(t)]
    for t in rem:
        k = colour(t)
        for u in add:
            if colour(u)[0] == k[0] and colour(u)[1] in root and colour(u)[2] == k[2]:
                rows[(t, u)] += 1; break
lines = ["| old class | new token | uses | `:root` value | `.dark` value | kind | meaning | dark mode |", "| --- | --- | --- | --- | --- | --- | --- | --- |"]
bad = 0
for (t, u), n in sorted(rows.items(), key=lambda x: (-x[1], x[0])):
    role = colour(u)[1]; rv, meaning = root[role]
    dv = dark.get(role, (None, ""))[0]
    oldhex = PAL.get(colour(t)[1], "")
    same = dv is None or dv == rv
    bad += not same
    lines.append(f"| `{t}` | `{u}` | {n} | `{rv}` | {('`'+dv+'`') if dv else 'not redefined (same)'} | {role_kind(role)} | {meaning or '-'} | {'unchanged' if same else '**differs**'} |")
md = f"{sum(rows.values())} colour swaps ({len(rows)} distinct) at {head}; {bad} onto a token whose .dark value differs\n\n" + "\n".join(lines) + "\n"
open(out, "w").write(md); print(md.split("\n")[0])
