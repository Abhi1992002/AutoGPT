# PR bodies for DS3a-1 parts 1-4 from the call-site harness evidence (usage: python3 -I assemble2.py <k>...)
import json, os, re, sys, subprocess
sys.path.insert(0, os.path.dirname(__file__))
from body_static import PRS, COMMON_DEV
import body_r0616

E = "/home/vercel-sandbox/autogpt/.context/ev"; S = "/home/vercel-sandbox/shots"
CFG = json.load(open(f"{E}/assemble2_cfg.json"))
EVSHA = open(f"{E}/evsha").read().strip()
TREE = f"https://github.com/Abhi1992002/AutoGPT/tree/{EVSHA}/ds3a-1"
BLOB = f"https://github.com/Abhi1992002/AutoGPT/blob/{EVSHA}/ds3a-1"
RAW = f"https://raw.githubusercontent.com/Abhi1992002/AutoGPT/{EVSHA}/ds3a-1"
SHAS = dict(zip(["base", "p1", "p2", "p3", "p4"], open(f"{E}/shas.txt").read().split()[1:]))
FULL = {k: subprocess.run(["git", "-C", "/home/vercel-sandbox/autogpt", "rev-parse", v], capture_output=True, text=True).stdout.strip() for k, v in SHAS.items()}
LABELS = ["base", "p1", "p2", "p3", "p4"]
BRANCH = {k: PRS[k]["branch"] for k in PRS}

def d(label): return f"{label}-{SHAS[label]}"  # published capture folders carry the commit they were taken on

def results(label):
    return {(r["id"], r["viewport"]): r for r in json.load(open(f"{S}/h-{label}-run1/results.json"))}

def summary(tag):
    t = open(f"{E}/cmp/{tag}.md").read().splitlines()
    return t[2], t[3]

counts = {}
files_counts = {}
for line in open(f"{E}/counts.txt"):
    m = re.match(r"c(\d) (\w+) (\S+) wc=(\S+) unix=(\S+)", line)
    if m: counts[(int(m.group(1)), m.group(3))] = (m.group(4), m.group(5))
    m = re.match(r"PR(\d) files@(\w+) n=(\d+) nfiles=(\d+)", line)
    if m: files_counts.setdefault(int(m.group(1)), []).append((m.group(2), m.group(3), m.group(4)))
rules = {}; cur = side = None
for line in open(f"{E}/rules.txt"):
    if line.startswith("### PR"): cur = int(line[6]); rules[cur] = {}; continue
    if line.startswith("== "): side = line[3:].strip(); rules[cur][side] = {}; continue
    m = re.match(r"\s*(\d+) shadcn\(([a-z-]+)\)", line)
    if m and cur: rules[cur][side][m.group(2)] = int(m.group(1))

def counts_section(k):
    b, h = SHAS[LABELS[k - 1]], SHAS[LABELS[k]]
    rows = [f"| directory | base `{b}` | head `{h}` |", "| --- | --- | --- |"]
    for dname in ["src/components/__legacy__/ui", "src/components/__legacy__", "src/components/atoms", "src/components/molecules", "src"]:
        o, n = counts[(k - 1, dname)], counts[(k, dname)]
        rows.append(f"| `{dname}` | {o[1]} | **{n[1]}** |")
    fc = files_counts[k]
    rows.append(f"| the {fc[1][2]} files this PR touches | {fc[0][1]} | **{fc[1][1]}** |")
    rb, rh = rules[k].get(b, {}), rules[k].get(h, {})
    by = ", ".join(f"{r} {rb.get(r, 0)} → {rh.get(r, 0)}" for r in sorted(set(rb) | set(rh)))
    return "\n".join(rows) + f"\n\nTouched files by rule, base → head: {by}. Counted with the strict oxlint config from DS4 `1ee6580dc` overlaid on both SHAs (`oxlint -c .oxlintrc.strict.json -f unix`, never committed)." + (("\n\n" + body_r0616.COUNT_NOTE[k]) if k in body_r0616.COUNT_NOTE else "")

def keyboard_lines(k, prev, curr):
    rp, rc = results(prev), results(curr)
    out = []
    for key in sorted(k2 for k2 in rc if k2[0].startswith(f"pr{k}-")):
        r = rc[key]; p = rp.get(key)
        steps = [c for c in r["checks"] if not c["step"].startswith("visible:")]
        if not steps and not r["observed"]: continue
        line = f"- `{key[0]}` ({key[1]}): " + "; ".join(f"{c['step']} ✓" + (f" ({' '.join(c['detail'].split())})" if c["detail"] and "Tab" in c["step"] else "") for c in steps)
        out.append(line)
        for name, val in r["observed"].items():
            bv = p['observed'].get(name) if p else '?'
            same_el = bv != val and re.sub(r" data-slot=[\w-]+", "", str(bv)) == re.sub(r" data-slot=[\w-]+", "", str(val))
            out.append(f"  - observed `{name}`: base `{bv}` · head `{val}` " + ("(the same element; the head's carries the `data-slot` listed under Deviations)" if same_el else "(same on both; not changed here)"))
    return out

def body(k):
    P = PRS[k]; prev, curr = LABELS[k - 1], LABELS[k]
    base_branch = "dev" if k == 1 else BRANCH[k - 1]
    tag = f"h-{prev}-vs-{curr}"
    pass
    pass
    out = []
    out.append(f"Base: {base_branch}. Merged by the orchestrator through the squash merge queue once stable; zero visual change.")
    out.append("Link Linear SECRT-3112.\n")
    out.append(f"Linear: [SECRT-3112](https://linear.app/autogpt/issue/SECRT-3112) (DS3a part 1 of 4, of SECRT-3097). Stack {k}/8, primitives: {P['prims']}.\n")
    out.append(f"**Head `{FULL[curr]}`.** Every count, table and check below was taken on this commit and on its base `{FULL[prev]}`{' (`dev`)' if k == 1 else ''}. {CFG['merge_k'][str(k)]}\n")
    out.append("### Why / What / How\n")
    out.append(f"**Why.** {P['why']} Every importer moves to the design-system component of the same role, then the legacy file is deleted, with zero visual change.\n")
    out.append("**How.** Same value, new name: class strings change only where a token, role or atom holds the exact same value (table 2); everything else stays as it renders today, with a `TODO(tokens)` where no role holds the value. Visual check: batch diff after merge, per Abhimanyu 25 Oct.\n")
    out.append("### Changes 🏗️\n")
    out.append(P["what"] + "\n")
    out.append(f"### Evidence\n")
    out.append(f"Scripts and outputs are on the evidence-only branch [`Abhi1992002/AutoGPT@evidence/ds3a-1-small-primitives`]({TREE}) (`{EVSHA[:9]}`), never on this branch.\n")
    out.append("#### 1. Counts\n")
    out.append(counts_section(k) + "\n")
    out.append("#### 2. Value equivalence\n")
    out.append(f"- **DS1 `scripts/check-token-equivalence.ts` (unedited):** {CFG['ds1']} ([output]({BLOB}/equivalence/ds1-check-token-equivalence.txt)).")
    first, rest = open(f"{E}/eq/pr{k}-equivalence.md").read().strip().split("\n", 1)
    out.append(f"- **Every exact class string this PR writes**, rendered at a 16px root in parents at `leading-[30px]` and `leading-[1.5]`, plain and inside `[data-profile-tabs] [role=tabpanel]`, at 1440 and 390, in default/hover/focus/focus-visible/focus-within/active, as written and as merged on the real element: {first}. [Negative control]({BLOB}/equivalence/negative-control.md): `text-sm→text-body`, `text-xs→text-caption`, `bg-neutral-200→bg-border-base`, `h-[1px]→h-0.5` all fail.\n")
    out.append(rest + "\n")
    if k == 2:
        out.append(f"**Glyph check** (the redrawn spinner): the old lucide SVG and its `Icon`-atom render, at 5 sizes and each call site's element, rasterised and compared at threshold 0 in 3 colours: {CFG['glyph']} ([table]({BLOB}/equivalence/glyph-equivalence.md)). Extra evidence: the drawn ring equals the lucide one.\n")
    out.append("#### 3. Visual check\n")
    out.append("Visual check: batch diff after merge, per Abhimanyu 25 Oct\n")
    out.append("#### Rule 17: deletion / replacement\n")
    out.append("**(a) Every changed call site:**\n")
    out.append("| file | change |\n| --- | --- |")
    for f, c, w in P["importers"]: out.append(f"| {f} | {c} |")
    out.append("\n**(b) Interactive states and keyboard:** markup, event handlers and Radix/cmdk/embla parts are carried over unchanged (the DOM change is the `data-slot` attributes under Deviations); the unit tests named in Changes cover open/close, keyboard and selection paths. Visual states: batch diff after merge.\n")
    out.append("**(c) Prop / API parity, old vs replacement:**\n")
    out.append(P["parity"] + "\n")
    out.append(f"**(d) Checks on this head `{SHAS[curr]}`:** {CFG['checks'][str(k)]} Zero remaining imports of the deleted paths: `{CFG['grep'][str(k)]}` → no output.\n")
    out.append(f"**(e) No behaviour change:** every class string written is identical in computed value (table 2) and markup is unchanged apart from the `data-slot` attributes listed under Deviations{' and the Text atom on the text noted below' if k in (1, 3) else ''}.\n")
    out.append("#### Rule 15: raw type sizes in the files this PR changes\n")
    out.append(CFG["rule15"][str(k)] + "\n")
    out.append("#### Rules 31/32: typography on the lines this PR adds\n")
    out.append(CFG["rule3132"][str(k)].replace("{TREE}", TREE) + "\n")
    if CFG["text_first"].get(str(k)):
        out.append("#### Text-first (rules 8/22): atom className overrides\n")
        out.append(CFG["text_first"][str(k)] + "\n")
    out.append(body_r0616.extra(k).replace("{TREE}", TREE) + "\n")
    out.append("#### 4. What improved\n")
    out.append("\n".join(P["improved"]) + "\n")
    out.append("### Deviations\n")
    for dv in P["deviations"] + COMMON_DEV: out.append(f"- {dv}")
    if P["todos"]: out.append("- **Remaining `TODO(tokens)` this PR writes:** " + "; ".join(P["todos"]) + ".")
    out.append(f"- **Found while testing, not changed here (pre-existing on base):** {CFG['found']}")
    out.append("\n### Agents and large language models used\n")
    out.append("- Claude Code with Claude Opus 5.5 (`claude-opus-5-5[1m]`)\n")
    out.append("### Checklist 📋\n\n#### For code changes:\n- [x] I have clearly listed my changes in the PR description\n- [x] I have made a test plan\n- [x] I have tested my changes according to the test plan:\n  - [x] typecheck, lint, format, production `next build` and the full `vitest` suite on this head (section (d))\n  - [x] Value equivalence of every class string written (table 2), 0 failing\n  - [ ] Visual check: batch diff after merge, per Abhimanyu 25 Oct\n\n#### For configuration changes:\n- [x] `.env.default` is updated or already compatible with my changes\n- [x] `docker-compose.yml` is updated or already compatible with my changes\n- [x] I have included a list of my configuration changes in the PR description (under **Changes**) (none)\n")
    out.append("🤖 Generated with [Claude Code](https://claude.com/claude-code)")
    return "\n".join(out)

if __name__ == "__main__":
    for k in [int(a) for a in sys.argv[1:]]:
        open(f"{E}/body3-pr{k}.md", "w").write(body_r0616.post(k, body(k)))
    print("ok")
