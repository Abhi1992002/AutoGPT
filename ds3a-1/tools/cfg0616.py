# usage: python3 -I cfg0616.py  -> per-head fields of assemble2_cfg.json for the shas in shas.txt (rule 15, rules 31/32, CI line, merge line)
import json, re, subprocess
E = "/home/vercel-sandbox/autogpt/.context/ev"; R = "/home/vercel-sandbox/autogpt"; F = "autogpt_platform/frontend/"
sh = open(f"{E}/shas.txt").read().split()[1:]; PR = {1: 16136, 2: 16137, 3: 16139, 4: 16140}
git = lambda *a: subprocess.run(["git", "-C", R, *a], capture_output=True, text=True)
c = json.load(open(f"{E}/assemble2_cfg.json"))
dev = git("rev-parse", "--short", "origin/dev").stdout.strip()
since = git("log", "--format=%h", f"{sh[0]}..origin/dev").stdout.split()
stack = set(git("diff", "--name-only", sh[0], sh[4]).stdout.split())
touched = set(git("diff", "--name-only", sh[0], "origin/dev").stdout.split()) & stack
MOVED = {(2, "src/components/atoms/Calendar/Calendar.tsx"): "is the weekday label's `text-[0.8rem]` (12.8px), moved from `__legacy__/ui/calendar.tsx:50`: no type role holds that size (SECRT-3152, rare size), Deviation in rule 37(b)"}
RX = r"\btext-(xs|sm|base|lg|[2-9]?xl)\b|text-\[[0-9.]+(px|rem|em)\]|font-size:|fontSize"
for k in (1, 2, 3, 4):
    b, h = sh[k - 1], sh[k]
    files = [f for f in git("diff", "--name-only", "--diff-filter=AMR", b, h, "--", F + "src").stdout.split() if not re.search(r"\.(test|stories)\.|__tests__", f)]
    added = {}
    for f in files:
        d = git("diff", "-U0", b, h, "--", f).stdout; s = set()
        for m in re.finditer(r"^@@ -\S+ \+(\d+)(?:,(\d+))? @@", d, flags=re.M): s.update(range(int(m.group(1)), int(m.group(1)) + int(m.group(2) or 1)))
        added[f] = s
    hits = git("grep", "-nE", RX, h, "--", *files).stdout.splitlines()
    rows = [l.split(":", 1)[1].replace(F, "") for l in hits]
    on_added = [r for r in rows if int(r.split(":")[1]) in added[F + r.split(":")[0]]]
    txt = f"`git grep -nE \"{RX}\" {h} -- <the {len(files)} non-test files this PR changes>`:\n\n```\n" + ("\n".join(rows) or "(no output)") + "\n```\n\n"
    def why(r):
        f, ln, code = r.split(":", 2)
        if code.strip().startswith("//"): return f"`{f}:{ln}` is a comment that names the class"
        return f"`{f}:{ln}` " + MOVED.get((k, f), "is a class on an added line")
    txt += (f"Added lines among the hits: " + "; ".join(why(r) for r in on_added) + ". Every other hit is on a line this PR does not touch and renders as before." if on_added else
            ("Every hit is on a line this PR does not touch (none is an added line in its diff); each renders as before." if rows else "No raw type size in any file this PR changes."))
    c["rule15"][str(k)] = txt
    g = subprocess.run(["python3", "-I", f"{E}/grep3132.py", b, h], capture_output=True, text=True).stdout.strip()
    c["rule3132"][str(k)] = (f"`python3 grep3132.py {b} {h}` ([script]({{TREE}}/tools/grep3132.py), the stand-in for `conductor/rule32-scan.py`, which is not in this sandbox: a `<Text>` whose className holds a size, line height, weight, family or tracking class is a rule-32 hit; "
                             "a raw `span`/`p`/`div`/`h1-6`/`label` with one is a rule-31 hit; JSX tags read across lines, counted when any of their lines is added), run on this diff before the push:\n\n```\n" + g + "\n```"
                             + ("\n\nBoth rule-31 hits are Deviation rows below (a form-control container, and the Badge atom's own unchanged span)." if k == 3 else ""))
    ci = json.loads(subprocess.run(["python3", "-I", f"{E}/ci_line.py", str(PR[k]), h], capture_output=True, text=True).stdout or "{}")
    c["checks"][str(k)] = ci.get("text", "CI line unavailable")
    mt = git("merge-tree", "--write-tree", "origin/dev", h).returncode
    c.setdefault("merge_k", {})[str(k)] = (f"**Merges cleanly with the latest `dev`:** `git merge-tree --write-tree origin/dev {h}` exits {mt}{' with no conflicts' if mt == 0 else ''}, `origin/dev` at `{dev}`. "
        + (f"The {len(since)} commits on `dev` since the stack's base `{sh[0]}` share no file with this stack, so `dev` is not merged in." if not touched else f"`dev` touched {sorted(touched)}."))
json.dump(c, open(f"{E}/assemble2_cfg.json", "w"), indent=1)
print({k: c["merge_k"][k][:120] for k in c["merge_k"]}); print(c["rule15"]["2"]); print(c["rule3132"]["3"][-400:])
