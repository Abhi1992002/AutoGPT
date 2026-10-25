# usage: python3 -I darkcheck.py <base> <head>  -> QUALITY rule 43(1): every removed line carrying dark: classes, the component it
# belongs to, and whether each class is back verbatim on an added line of the same component (moved) or the component is gone
import re, subprocess, sys
R = "/home/vercel-sandbox/autogpt"; b, h = sys.argv[1:3]
d = subprocess.run(["git", "-C", R, "diff", "-U0", "--find-renames", f"{b}...{h}", "--", "autogpt_platform/frontend/src"], capture_output=True, text=True).stdout
RX = re.compile(r"(?<![\w-])((?:[\w\[\]=&.>/()-]+:)*dark:[^\s\"'`,]+)")
rows, added, f, ctx, old_ln, src = [], {}, None, "", 0, []
def owner(n):
    for i in range(min(n, len(src)) - 1, -1, -1):
        m = re.match(r"(?:export )?(?:const|function) (\w+)", src[i])
        if m: return f"const {m.group(1)}"
    return ""
for l in d.splitlines():
    m = re.match(r"diff --git a/(\S+) b/(\S+)", l)
    if m:
        f = m.group(1).replace("autogpt_platform/frontend/", "")
        src = subprocess.run(["git", "-C", R, "show", f"{b}:{m.group(1)}"], capture_output=True, text=True).stdout.splitlines(); continue
    m = re.match(r"@@ -(\d+)", l)
    if m: old_ln = int(m.group(1)); continue
    if l.startswith(("---", "+++")): continue
    if l.startswith("-"):
        for c in RX.findall(l): rows.append((f, owner(old_ln), c))
        old_ln += 1
    elif l.startswith("+"):
        for c in RX.findall(l): added.setdefault(c, 0); added[c] += 1
# a removed component: its name no longer exported/defined anywhere in src on head
def gone(ctx):
    m = re.search(r"(?:const|function)\s+(\w+)", ctx)
    if not m: return None
    n = m.group(1)
    hit = subprocess.run(["git", "-C", R, "grep", "-lE", rf"(const|function) {n}\b", h, "--", "autogpt_platform/frontend/src"], capture_output=True, text=True).stdout
    return n if not hit.strip() else None
res = []
for f, ctx, c in rows:
    g = gone(ctx)
    res.append((f, ctx, c, "gone" if g else ("back" if added.get(c) else "NOT BACK"), g))
n = lambda k: sum(1 for r in res if r[3] == k)
print(f"git diff {b}...{h} | grep -E '^-.*dark:'  ->  {len(res)} dark: classes on removed lines: {n('back')} back verbatim on added lines, {n('gone')} on components deleted with no importer, {n('NOT BACK')} dropped")
for f, ctx, c, st, g in res:
    if st != "back": print(f"  {c}  ({f}, `{g or ctx}`): " + ("deleted with no importer; the class goes with it" if st == "gone" else "NOT BACK"))
