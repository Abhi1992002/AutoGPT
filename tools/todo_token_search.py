"""For every hex a TODO(tokens) names in build/** at <sha>, search DS1's token
definitions (globals.css --color-* role values, as 'R G B') for that exact value.
  python3 todo_token_search.py <sha> <out.md>"""
import re, subprocess, sys, collections
sha, out = sys.argv[1:3]; ROOT = "/home/vercel-sandbox/autogpt"
g = subprocess.run(["git", "show", f"{sha}:autogpt_platform/frontend/src/app/globals.css"], cwd=ROOT, capture_output=True, text=True).stdout
roles = collections.defaultdict(list)
# Light values only: the :root block(s); the .dark block never applies (forcedTheme="light").
light = "".join(re.findall(r":root\s*\{(.*?)\n\s*\}", g, re.S))
for m in re.finditer(r"--color-([\w-]+):\s*(\d+)\s+(\d+)\s+(\d+)\s*;", light):
    roles["#%02X%02X%02X" % tuple(int(x) for x in m.groups()[1:])].append(m.group(1))
files = subprocess.run(["git", "ls-tree", "-r", "--name-only", sha, "autogpt_platform/frontend/src/app/(platform)/build"], cwd=ROOT, capture_output=True, text=True).stdout.split()
hexes = collections.defaultdict(set); kinds = {}
for f in files:
    if not re.search(r"\.(tsx?|css)$", f) or "test" in f: continue
    src = subprocess.run(["git", "show", f"{sha}:{f}"], cwd=ROOT, capture_output=True, text=True).stdout
    for block in re.findall(r"TODO\(tokens\)[^\n]*(?:\n\s*(?!//|\*/|/\*)[^\n]*?\*/)?|TODO\(tokens\)(?:[^*]|\*(?!/))*\*/", src):
        # A hex inside parentheses is context ("the input handle is text-handle #9CA3AF"), not a claim.
        claim = re.sub(r"\([^()]*\)", "", block)
        for h in re.findall(r"#[0-9A-F]{6}\b", claim):
            hexes[h].add(f.split("build/")[1])
            kinds.setdefault(h, "no fitting role" if re.search(rf"no fitting role for [^;]*{h}", block) else "no exact role")
rows = []
bad = 0
for h in sorted(hexes):
    hit = roles.get(h, [])
    if hit and kinds[h] == "no exact role": bad += 1
    rows.append(f"| {h} | `{int(h[1:3],16)} {int(h[3:5],16)} {int(h[5:7],16)}` in `:root` → {len(hit)} | {', '.join('`'+r+'`' for r in hit) or '(none)'} | {kinds[h]} | {len(hexes[h])} |")
md = f"{len(hexes)} hex values named in TODO(tokens) comments in build/** at {sha}; {sum(1 for h in hexes if not roles.get(h))} held by no DS1 colour role; {len(hexes)-sum(1 for h in hexes if not roles.get(h))} held by a role of another kind (each such TODO says \"no fitting role\" and names it); {bad} contradictions\n\nDS1 roles searched: {sum(len(v) for v in roles.values())} `--color-*` light values (`:root`) in `globals.css` at {sha}.\n\n| hex | search | roles holding it | TODO says | files |\n| --- | --- | --- | --- | --- |\n" + "\n".join(rows) + "\n"
open(out, "w").write(md); print(md.split("\n")[0])
