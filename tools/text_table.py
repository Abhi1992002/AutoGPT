"""The <Text> table for the PR body: every Text-merged pair (file:line, variant,
parent it inherits from) joined with its measured row in the equivalence md.
  python3 text_table.py <all-pairs.json> <equivalence.md> <out.md>"""
import json, re, sys
pairs = [p for p in json.load(open(sys.argv[1]))["pairs"] if p.get("tag") == "Text-merged"]
rows = {}
for l in open(sys.argv[2]):
    m = re.match(r"\| \d+ \| `(.*?)` \| `(.*?)` \| (.*?) \| (.*?) \|$", l.strip())
    if m: rows.setdefault((m.group(1), m.group(2)), (m.group(3), m.group(4)))
out = ["| element (head) | class string at dev | `cn(variant, tone, className)` the `<Text>` renders | computed (16px root, leading-[30px] parent, 1440px) | result |", "| --- | --- | --- | --- | --- |"]
miss = 0
for p in sorted(pairs, key=lambda p: (p["file"], p["line"])):
    comp, res = rows.get((p["old"], p["new"]), ("**not measured**", "**missing**"))
    miss += (p["old"], p["new"]) not in rows
    where = f"`{p['file'].split('build/')[1]}:{p['line']}` `<Text variant=\"{p['variant']}\">`" + (f" inside a legacy `<Button>` (inherits `{p['parent']}`)" if p.get("parent") else "")
    out.append(f"| {where} | `{p['old']}` | `{p['new']}` | {comp} | {res} |")
open(sys.argv[3], "w").write("\n".join(out) + "\n")
print(len(pairs), "Text rows;", miss, "missing a measured row")
