# usage: python3 -I hcompare.py <before-dir> <after-dir> <tag> <diff-root> <report.md>
# The gate between two harness runs: every screenshot identical at threshold 0 (DS1's comparePngs), the same
# capture files on both sides, every keyboard/visibility check passing on both, and every observed
# behaviour (scroll owner, focus after Escape, ...) the same on both. Exit 1 on any difference.
import json, re, subprocess, sys, os
before, after, tag, diff_root, report = sys.argv[1:6]
# optional 6th arg: JSON {screenshot-prefix: reason} for captures whose difference is the change itself
# (a story that lists every Text variant gains the new one); reported with its diff, never silently passed
expected = json.load(open(sys.argv[6])) if len(sys.argv) > 6 else {}
FE = "/home/vercel-sandbox/autogpt/autogpt_platform/frontend"
out = subprocess.run(["npx", "tsx", "scripts/screenshot-pages.ts", "compare", before, after, "--diff", os.path.join(diff_root, f"diff-{tag}")],
                     cwd=FE, capture_output=True, text=True).stdout
rows = [l for l in out.splitlines() if l.startswith("| ") and not l.startswith(("| screenshot", "| ---"))]
nonzero = [l for l in rows if not l.rstrip().endswith("| 0 |")]
def why(line):
    name = line.split("|")[1].strip()
    return next((r for p, r in expected.items() if name.startswith(p)), None)
px_expected = [(l, why(l)) for l in nonzero if why(l)]
px_bad = [l for l in nonzero if not why(l) and not (l.split("|")[1].strip().startswith("sweep-newstory-") and "only in after" in l)]
rb = {(r["id"], r["viewport"]): r for r in json.load(open(os.path.join(before, "results.json")))}
ra = {(r["id"], r["viewport"]): r for r in json.load(open(os.path.join(after, "results.json")))}
problems = []; new_in_head = []; slot_only = []
for key in sorted(set(rb) | set(ra)):
    b, a = rb.get(key), ra.get(key)
    name = f"{key[0]} ({key[1]})"
    if not b or not a: problems.append(f"{name}: only in {'after' if a else 'before'}"); continue
    for side, r in (("before", b), ("after", a)):
        if not r["ok"]: problems.append(f"{name}: failed on {side}: {r.get('error', '')[:160]}")
    if b["observed"].get("story in this commit") == "absent" and a["observed"].get("story in this commit") == "yes":
        # a story this commit adds: base has nothing to show, so only its own checks count (all must pass)
        if not all(c["ok"] for c in a["checks"]): problems.append(f"{name}: a check failed on after")
        new_in_head.append(key[0].replace("sweep-newstory-", "")); continue
    cb = [(c["step"], c["ok"]) for c in b["checks"]]; ca = [(c["step"], c["ok"]) for c in a["checks"]]
    if cb != ca: problems.append(f"{name}: checks differ: {set(cb) ^ set(ca)}")
    if b["observed"] != a["observed"]:
        # the DS7 data-slot attributes a PR adds show up in element descriptions; equal once they are removed = same element
        strip = lambda o: {k: re.sub(r" data-slot=[\w-]+", "", str(v)) for k, v in o.items()}
        if strip(b["observed"]) == strip(a["observed"]): slot_only.append(f"{name}: " + "; ".join(f"{k}: `{b['observed'][k]}` → `{a['observed'][k]}`" for k in a["observed"] if b["observed"].get(k) != a["observed"][k]))
        else: problems.append(f"{name}: observed differs: {b['observed']} vs {a['observed']}")
    if sorted(b["files"]) != sorted(a["files"]): problems.append(f"{name}: different capture files")
checks = sum(len(r["checks"]) for r in ra.values())
lines = [f"# {tag}", "", f"{len(rows)} screenshots compared at threshold 0: **{len(px_bad)} with unexplained differences**" + (f", {len(px_expected)} expected (the change itself, listed below)." if px_expected else "."),
         f"{len(ra)} captures (spec x viewport), {checks} asserted steps on the after side: **{len(problems)} problems**" + (f" ({len(slot_only)} observed values name the same element with a `data-slot` added, listed below)." if slot_only else "."), ""]
if px_bad: lines += ["## Screenshots that differ", "", "| screenshot | size | changed pixels |", "| --- | --- | --- |", *px_bad, ""]
if px_expected: lines += ["## Expected differences (the change itself)", "", "| screenshot | size | changed pixels | why |", "| --- | --- | --- | --- |", *[f"{l.rstrip()} {r} |" for l, r in px_expected], ""]
if problems: lines += ["## Problems", "", *[f"- {p}" for p in problems], ""]
if slot_only: lines += ["## Same element, only a `data-slot` attribute added (the PR's DS7 slots)", "", *[f"- {x}" for x in slot_only], ""]
if new_in_head: lines += ["## Stories new in this head (no base to compare; head-vs-head is gated)", "", *[f"- `{x}`" for x in sorted(set(new_in_head))], ""]
lines += ["## Every screenshot", "", "| screenshot | size | changed pixels |", "| --- | --- | --- |", *rows]
open(report, "w").write("\n".join(lines) + "\n")
print(f"{tag}: {len(rows)} screenshots, {len(px_bad)} differ unexplained, {len(px_expected)} expected; {len(ra)} captures, {checks} checks, {len(problems)} problems")
sys.exit(1 if px_bad or problems else 0)
