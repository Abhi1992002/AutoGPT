# usage: python3 -I variants_xpr.py <pr> [<pr> ...]  (refs/open/<n> fetched)  -> QUALITY rules 35/44 cross-PR table for atoms/Text and atoms/Button:
# every variant/tone/size a PR adds or changes against its merge-base with dev, compared with dev and with every other open PR's additions.
# A clash is one name with two strings, or one string under two names (a second family). Ends "OK 0 clashes" or lists them.
import re, subprocess, sys
R = "/home/vercel-sandbox/autogpt"; F = "autogpt_platform/frontend/src/components/atoms/"
FILES = {"Text": F + "Text/helpers.ts", "Button": F + "Button/helpers.ts", "Badge": F + "Badge/Badge.tsx"}
git = lambda *a: subprocess.run(["git", "-C", R, *a], capture_output=True, text=True).stdout
def parse(src):
    consts = {m.group(1): " ".join(m.group(2).split()) for m in re.finditer(r'(?m)^\s*(?:export )?const (\w+)\s*=\s*\n?\s*"([^"]*)";', src)}
    out, group = {}, None
    for m in re.finditer(r'(?m)^\s*(?:export )?const (\w+)\s*(?::[^=]+)?=|^\s*(variant|size|tone)s?:\s*\{|^\s*"?([\w-]+)"?:\s*\n?\s*(?:"([^"]*)"|`([^`]*)`)', src):
        if m.group(1): group = m.group(1)
        elif m.group(2): group = m.group(2)
        elif m.group(3) and group and group != "variantElementMap" and m.group(3) not in ("size", "variant"):
            v = m.group(4) if m.group(4) is not None else re.sub(r"\$\{(\w+)\}", lambda x: consts.get(x.group(1), x.group(0)), m.group(5))
            out[(group, m.group(3))] = " ".join(v.split())
    return out
dev = git("rev-parse", "origin/dev").strip()
ours = sys.argv[1:]
prs = [l.split()[0] for l in open("/tmp/openprs.txt")]
added = {}  # (file, group, name) -> {pr: string}
devdefs = {k: parse(git("show", f"{dev}:{p}")) for k, p in FILES.items()}
for n in prs:
    ref = f"refs/open/{n}"
    mb = git("merge-base", ref, dev).strip()
    if not mb: continue
    for k, p in FILES.items():
        h, b = git("show", f"{ref}:{p}"), git("show", f"{mb}:{p}")
        if not h or h == b: continue
        H, B = parse(h), parse(b)
        for key, s in H.items():
            if B.get(key) != s: added.setdefault((k,) + key, {})[n] = s
clash = []
for key, by in added.items():
    strs = set(by.values()) | ({devdefs[key[0]][key[1:]]} if key[1:] in devdefs[key[0]] else set())
    if len(strs) > 1 and any(p in ours for p in by) and key[2] not in ("size", "variant"): clash.append(f"name `{key[2]}` ({key[0]} {key[1]}): " + "; ".join(f"#{p} `{s}`" for p, s in by.items()))
bystring = {}
for key, by in added.items():
    for p, s in by.items(): bystring.setdefault((key[0], s), set()).add((key[1], key[2], p))
for (f, k), d in devdefs.items() if False else []: pass
for f, defs in devdefs.items():
    for (g, name), s in defs.items(): bystring.setdefault((f, s), set()).add((g, name, "dev"))
for (f, s), names in bystring.items():
    distinct = {n for g, n, _ in names}  # a renamed object (badgeVariants -> tintVariants) is not a second name
    if len(distinct) > 1 and any(p in ours for _, _, p in names) and s:
        clash.append(f"string `{s}` ({f}) under " + ", ".join(sorted(f"`{n}` ({g}, {'dev' if p == 'dev' else '#' + p})" for g, n, p in names)))
print("| atom | group | name | string | defined by |\n| --- | --- | --- | --- | --- |")
for key, by in sorted(added.items()):
    if not any(p in ours for p in by): continue
    for s in sorted(set(by.values())):
        print(f"| {key[0]} | {key[1]} | `{key[2]}` | `{s}` | " + ", ".join(f"#{p}" for p, v in sorted(by.items()) if v == s) + " |")
print()
near = []
oursB = {(k[1], k[2]): v for k, by in added.items() if k[0] == "Button" for p, v in by.items() if p in ours}
for k, by in added.items():
    if k[0] != "Button": continue
    for p, v in by.items():
        if p in ours or (k[1], k[2]) in oursB: continue
        for (g, n), ov in oursB.items():
            a, b = set(ov.split()), set(v.split())
            if g == k[1] and a and len(a & b) / len(a | b) >= 0.8: near.append((g, n, ov, k[2], v, p))
seen = set()
if near:
    print("Near-duplicates in other open PRs (Button, >= 80% of classes shared):\n\n| group | this stack | its string | other PR's name | its string | PR |\n| --- | --- | --- | --- | --- | --- |")
    for g, n, ov, on, v, p in sorted(near, key=lambda x: (x[1], x[5])):
        if (n, on, v) in seen: continue
        seen.add((n, on, v)); prs_ = sorted({x[5] for x in near if x[1] == n and x[3] == on and x[4] == v})
        print(f"| {g} | `{n}` | `{ov}` | `{on}` | `{v}` | " + ", ".join("#" + q for q in prs_) + " |")
    print()
print("\n".join(clash) if clash else "OK 0 clashes")
