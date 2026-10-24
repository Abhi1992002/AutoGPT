import json, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from body_static import PRS, COMMON_DEV

E = "/home/vercel-sandbox/autogpt/.context/ev"
EVSHA = open(f"{E}/evsha").read().strip()  # evidence branch commit
RAW = f"https://raw.githubusercontent.com/Abhi1992002/AutoGPT/{EVSHA}/ds3a-1"
TREE = f"https://github.com/Abhi1992002/AutoGPT/tree/{EVSHA}/ds3a-1"
BLOB = f"https://github.com/Abhi1992002/AutoGPT/blob/{EVSHA}/ds3a-1"
SHAS = json.load(open(f"{E}/shas.json"))  # {"base": full, "p1": full, ...}
LABELS = ["base"] + [f"p{k}" for k in range(1, 9)]
BRANCHES = {k: PRS[k]["branch"] for k in PRS}

counts = {}
for line in open(f"{E}/counts.txt"):
    m = re.match(r"c(\d) (\w+) (\S+) wc=(\S+) unix=(\S+)", line)
    if m:
        counts[(int(m.group(1)), m.group(3))] = (m.group(4), m.group(5))
files_counts = {}
for line in open(f"{E}/counts.txt"):
    m = re.match(r"PR(\d) files@(\w+) n=(\d+) nfiles=(\d+)", line)
    if m:
        files_counts.setdefault(int(m.group(1)), []).append((m.group(2), m.group(3), m.group(4)))
rules = {}
cur = None; side = None
for line in open(f"{E}/rules.txt"):
    if line.startswith("### PR"): cur = int(line[6]); rules[cur] = {}; continue
    if line.startswith("== "): side = line[3:].strip(); rules[cur][side] = {}; continue
    m = re.match(r"\s*(\d+) shadcn\(([a-z-]+)\)", line)
    if m and cur: rules[cur][side][m.group(2)] = int(m.group(1))

def short(s): return s[:9]

def counts_section(k):
    b, h = SHAS[LABELS[k - 1]], SHAS[LABELS[k]]
    rows = ["| directory | base `%s` `\\| wc -l` | base `-f unix` | head `%s` `\\| wc -l` | head `-f unix` |" % (short(b), short(h)), "| --- | --- | --- | --- | --- |"]
    for d in ["src/components/__legacy__/ui", "src/components/__legacy__", "src/components/atoms", "src/components/molecules", "src"]:
        o, n = counts[(k - 1, d)], counts[(k, d)]
        rows.append(f"| `{d}` | {o[0]} | {o[1]} problems | **{n[0]}** | {n[1]} problems |")
    fc = files_counts[k]
    rows.append(f"| the {fc[1][2]} files this PR touches (that exist at each side) | {fc[0][1]} | {fc[0][1]} problems | **{fc[1][1]}** | {fc[1][1]} problems |")
    rb, rh = rules[k][b[:9]] if b[:9] in rules[k] else list(rules[k].values())[0], list(rules[k].values())[-1]
    allr = sorted(set(rb) | set(rh))
    byrule = ", ".join(f"{r} {rb.get(r,0)} → {rh.get(r,0)}" for r in allr)
    return "\n".join(rows) + f"\n\nTouched files by rule, base → head: {byrule}."

def eq_section(k):
    md = open(f"{E}/eq/pr{k}-equivalence.md").read().strip()
    first, rest = md.split("\n", 1)
    return first, rest

def cmp_summary(tag):
    p = f"{E}/cmp/{tag}.md"
    if not os.path.exists(p): return None
    t = open(p).read()
    rows = [l for l in t.splitlines() if l.startswith("| ") and not l.startswith("| screenshot") and not l.startswith("| ---")]
    nonzero = [l for l in rows if not l.rstrip().endswith("| 0 |")]
    return len(rows), nonzero

CAUSES = {
    "T": "the \"Last updated\" time (not code)",
    "M": "the 390px top-of-page band that varies between runs of one build (not code)",
    "S": "the sidebar entrance animation race (not code)",
}

def classify(tag):
    import subprocess
    o = subprocess.run(["python3", "-I", f"{E}/../evtools/classify.py", tag], capture_output=True, text=True).stdout
    res = {}
    for line in o.splitlines():
        if line.startswith("SUMMARY"):
            if not line.endswith(" 0 unexplained"): raise SystemExit(f"unexplained differences in {tag}: {line}")
            continue
        name, n, box, c = line.split("\t")
        res[name] = CAUSES.get(c, "UNEXPLAINED")
    return res

def img_row(name, prev, curr, tag):
    return f"| `{name}` | ![]({RAW}/{prev}/{name}) | ![]({RAW}/{curr}/{name}) | ![]({RAW}/diff-{tag}/{name}) |"

def body(k):
    P = PRS[k]
    base_branch = "dev" if k == 1 else BRANCHES[k - 1]
    prev, curr = LABELS[k - 1], LABELS[k]
    head = SHAS[curr]
    out = []
    out.append(f"Base: {base_branch}. Merged by the orchestrator through the squash merge queue once stable; zero visual change.")
    out.append("Link Linear SECRT-3112.\n")
    out.append(f"Linear: [SECRT-3112](https://linear.app/autogpt/issue/SECRT-3112) (DS3a part 1 of 4, of SECRT-3097). Stack {k}/8, primitives: {P['prims']}.\n")
    out.append(MERGE_LINE.get(k, "") + "\n")
    out.append("### Why / What / How\n")
    out.append(f"**Why.** {P['why']} Every importer moves to the design-system component of the same role, then the legacy file is deleted, with zero visual change.\n")
    out.append("**How.** Same value, new name: class strings change only where a token or role class holds the exact same value (proved in table 2); everything else stays as it renders today, with a `TODO(tokens)` where no role holds the value. Every call site, interactive state and keyboard path below was captured on base and head and compared at a pixel threshold of 0.\n")
    out.append("### Changes 🏗️\n")
    out.append(P["what"] + "\n")
    out.append(f"### Evidence (head `{head}`, base `{base_branch}` at `{SHAS[prev]}`)\n")
    out.append(f"Everything below is on the evidence-only branch [`Abhi1992002/AutoGPT@evidence/ds3a-1-small-primitives`]({TREE}) (`{EVSHA[:7]}`), never on this branch; the scripts that produced it are under [`tools/`]({TREE}/tools).\n")
    out.append("#### 1. Counts\n")
    out.append("Strict config from DS4 `1ee6580dc` (`git checkout 1ee6580dc -- .oxlintrc.strict.json package.json pnpm-lock.yaml` + `pnpm install` in a throwaway worktree, never committed), the same overlay for both SHAs.\n")
    out.append(counts_section(k) + "\n")
    out.append(EXPLAIN_COUNTS.get(k, "") + "\n")
    out.append("#### 2. Value equivalence\n")
    out.append(f"- **DS1 `scripts/check-token-equivalence.ts` at the stack head (unedited):** {DS1_SUMMARY} ([output]({BLOB}/equivalence/ds1-check-token-equivalence.txt)).")
    first, rest = eq_section(k)
    out.append(f"- **Every exact class string this PR writes** (DS1's method, extended from DS5d's tool with the cn()-merged string on the real element and with width/height/radius/border-style/text-align): {first}. Each is rendered at a 16px root inside parents at `leading-[30px]` and `leading-[1.5]`, plain and inside `[data-profile-tabs] [role=tabpanel]`, at 1440 and 390 wide, in default/hover/focus/focus-visible/focus-within/active, as written, under a conflict base and as merged on the real element. [Negative control]({BLOB}/equivalence/negative-control.md): `text-sm→text-body`, `text-xs→text-caption`, `bg-neutral-200→bg-border-base`, `h-[1px]→h-0.5` all FAIL; `text-sm→text-body leading-5` passes.\n")
    out.append(rest + "\n")
    if k in (2, 7):
        out.append(f"**Glyph check** (the redrawn icons/spinner): every old SVG (from the base checkout) and its new `Icon`-atom render, at 5 sizes plus each real call-site element, rasterised in Chromium with DS1's deterministic flags and compared with DS1's `comparePngs` at threshold 0 in 3 colours: {GLYPH_SUMMARY} ([table]({BLOB}/equivalence/glyph-equivalence.md)); a11y attributes (`aria-*`, `role`, `title`) compared on all 38 elements: 0 differences. [Negative control]({BLOB}/equivalence/glyph-negative-control.md): a wrong glyph, the Hugeicons spinner and a 2px stroke all differ (41-177 px).\n")
    out.append("#### 3. Screenshots\n")
    out.append(SCREEN_INTRO.format(prev=prev, curr=curr) + "\n")
    for kind, tag in [("app routes + interactive states", f"{prev}-vs-{curr}"), ("stories", f"{prev}-sb-vs-{curr}-sb")]:
        r = cmp_summary(tag)
        if r:
            n, nz = r
            out.append(f"- **{kind}:** {n} captures compared, **{len(nz)} with differences** ([table]({BLOB}/compare/{tag}.md), [diff images]({TREE}/diff-{tag})).")
            causes = classify(tag)
            for l in nz:
                name = l.split("|")[1].strip().strip("`")
                out.append(f"  - `{name}`: {l.split('|')[-2].strip()} px, {causes.get(name, 'UNEXPLAINED')}")
    out.append(f"- **Determinism (base captured twice):** {DETERMINISM.replace('{TREE}', TREE)}\n")
    if TAKE_NOTE.get(k): out.append(f"- **Retakes:** {TAKE_NOTE[k].replace('{TREE}', TREE)}")
    out.append(f"- **Keyboard and ARIA** (`keyboard-aria.json`, base vs head): {KB.get(k,'identical')}\n")
    out.append("| capture | base | head | diff (0 px) |\n| --- | --- | --- | --- |")
    shown = ["app__settings_profile__desktop.png", "app__team_autopilot__desktop.png"] + PRS[k].get("shots", [])
    for name in shown:
        out.append(img_row(name, prev, curr, f"{prev}-vs-{curr}") if not name.startswith("story__") else img_row(name, prev + "-sb", curr + "-sb", f"{prev}-sb-vs-{curr}-sb"))
    out.append(f"\nAll captures: [`{prev}`]({TREE}/{prev}), [`{curr}`]({TREE}/{curr}), [`{prev}-sb`]({TREE}/{prev}-sb), [`{curr}-sb`]({TREE}/{curr}-sb).\n")
    out.append("#### Rule 17: deletion / replacement\n")
    out.append("**(a) Every importer / call site changed, and what renders it:**\n")
    out.append("| file | change | captured on |\n| --- | --- | --- |")
    for f, c, w in P["importers"]: out.append(f"| {f} | {c} | {w} |")
    out.append("\n**(b) Interactive states and keyboard:** see the keyboard/ARIA line and the `interact__*` captures above: " + INTERACT_LIST + "\n")
    out.append("**(c) Prop / API parity, old vs replacement:**\n")
    out.append(P["parity"] + "\n")
    out.append("**(d) Checks on the stack head:** " + CHECKS.format(head=SHAS["p8"][:9]) + f" Zero remaining imports of the paths this PR deletes: `{GREP[k]}` → no output.\n")
    out.append("**(e) No behaviour change:** " + E_LINE.get(k, "every story capture is identical; every app, interaction and keyboard/ARIA difference above is one of the three non-code causes base shows against itself. The only DOM change is the `data-slot` attributes under Deviations.") + "\n")
    out.append("#### 4. What improved\n")
    out.append("\n".join(P["improved"]) + "\n")
    out.append("### Deviations\n")
    devs = P["deviations"] + COMMON_DEV
    for d in devs: out.append(f"- {d}")
    if P["todos"]:
        out.append("- **Remaining `TODO(tokens)` this PR writes:** " + "; ".join(P["todos"]) + ".")
    out.append("\n### Agents and large language models used\n")
    out.append("- Claude Code with Claude Opus 5.5 (`claude-opus-5-5[1m]`)\n")
    out.append("### Checklist 📋\n\n#### For code changes:\n- [x] I have clearly listed my changes in the PR description\n- [x] I have made a test plan\n- [x] I have tested my changes according to the test plan:\n  - [x] `pnpm types`, `pnpm lint`, `pnpm format`, production `next build`, full `vitest` suite\n  - [x] Value equivalence of every class string written (table 2), 0 failing\n  - [x] Screenshots of every affected page, story and interactive state at 1440x900 and 390x844 against base: 0 px from code (every non-zero capture matched to a non-code cause that base shows against itself)\n  - [x] Keyboard paths and ARIA snapshots identical to base\n\n#### For configuration changes:\n- [x] `.env.default` is updated or already compatible with my changes\n- [x] `docker-compose.yml` is updated or already compatible with my changes\n- [x] I have included a list of my configuration changes in the PR description (under **Changes**) (none)\n")
    out.append("🤖 Generated with [Claude Code](https://claude.com/claude-code)")
    return "\n".join(out)

cfg = json.load(open(f"{E}/assemble_cfg.json"))
DS1_SUMMARY = cfg["ds1"]; GLYPH_SUMMARY = cfg["glyph"]; SCREEN_INTRO = cfg["screen_intro"]; DETERMINISM = cfg["determinism"]
KB = {int(k): v for k, v in cfg.get("kb", {}).items()}; INTERACT_LIST = cfg["interact_list"]; CHECKS = cfg["checks"]
GREP = {int(k): v for k, v in cfg["grep"].items()}; E_LINE = {int(k): v for k, v in cfg.get("e_line", {}).items()}
EXPLAIN_COUNTS = {int(k): v for k, v in cfg.get("explain_counts", {}).items()}
MERGE_LINE = {int(k): v for k, v in cfg.get("merge_line", {}).items()}
TAKE_NOTE = {int(k): v for k, v in cfg.get("take_note", {}).items()}
for k, v in cfg.get("shots", {}).items(): PRS[int(k)]["shots"] = v
if __name__ == "__main__":
    for k in ([int(a) for a in sys.argv[1:]] or PRS):
        open(f"{E}/body-pr{k}.md", "w").write(body(k))
    print("ok")
