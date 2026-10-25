"""Fills prbody/p{1,2}.v5.tmpl.md into p{1,2}.final.md from the evidence files.
  python3 fill_v5.py <evidence commit> <p1 head> <p2 head> <vitest summary>"""
import json, re, subprocess, sys
from collections import Counter
from pathlib import Path
EV, P1, P2, VITEST = sys.argv[1:5]
E = Path("/home/vercel-sandbox/evidence"); P = Path("/home/vercel-sandbox/prbody"); T = Path("/home/vercel-sandbox/tools")
EVT = f"https://github.com/Abhi1992002/AutoGPT/tree/{EV}"; EVB = f"https://github.com/Abhi1992002/AutoGPT/blob/{EV}"
first = lambda f: (E / f).read_text().splitlines()[0]

def counts(sha):
    u = (E / "counts" / f"head-{sha}.unix.txt").read_text()
    n = int(re.search(r"(\d+) problems", u).group(1)); lines = len((E / "counts" / f"head-{sha}.txt").read_text().splitlines())
    rules = Counter(re.findall(r"\[Error/shadcn\(([a-z-]+)\)\]", u))
    return n, lines, rules
dev, p1, p2 = counts("4bf85fe86"), counts(P1), counts(P2)
ORDER = ["no-raw-colors", "no-arbitrary-values", "no-inline-styles", "require-static-classes", "no-restyle"]
rules_txt = lambda a, b: ", ".join(f"{r} {a[2][r]} → {b[2][r]}" for r in ORDER)

def eqline(f):
    m = re.match(r"(\d+) unique class strings \((\d+) occurrences\), (\d+) cases.*?, (\d+) measurements.*?: (\d+) failing", first(f))
    a, b, c, d, e = m.groups()
    return f"{a} unique strings ({b} occurrences), {c} cases, {int(d):,} measurements, **{e} failing**"

def r43(n, base, head, extra):
    chk = (E / f"dark-check-pr{n}.txt").read_text().strip()
    tab = (E / f"swap-dark-pr{n}.md").read_text().strip().split("\n")
    rows = []
    for l in tab[2:]:
        if l.startswith("|"):
            c = l.rstrip().rstrip("|").rstrip().split(" | "); rows.append(" | ".join(c[:-1]) + " |")
    multi = f"Across the whole of `build/**`, the code (comments and TODO lines excluded) holds the same multiset of `dark:` classes at dev `4bf85fe86`, at `{P1}` and at `{P2}`: **71 = 71 = 71, `cmp` identical** ([`dark_multiset.sh`]({EVT}/tools/dark_multiset.sh), [`dark-multiset-{head}.txt`]({EVB}/dark-multiset-{head}.txt))."
    lead = "56 of the 66 `dark:` classes this branch had removed sit on lines the PR still changes; the other 10 are back on lines now identical to dev, so the diff no longer shows them. " if n == "1" else ""
    return f"""**Rule 43, `dark:` classes and dark-safe tokens.** Base `{base}`, head `{head}`.

(1) Every `dark:` class on a removed line reappears verbatim on an added code line ([`dark_check.py`]({EVT}/tools/dark_check.py)):

```
{chk}
```

{lead}{multi}

(2) Every colour swap, with the new token's `:root` and `.dark` values ([`swap-dark-pr{n}.md`]({EVB}/swap-dark-pr{n}.md)): **{tab[0]}**. A token that `.dark` doesn't redefine renders the same value in both modes, as the raw class did. Where an old class had a `dark:` companion, that companion is still on the element. {extra}

<details><summary><b>Per-swap table</b> (old class, new token, uses, values, kind, meaning)</summary>

{chr(10).join(rows)}

</details>

(3) The strict counts above are computed with every `dark:` class kept. (4) The equivalence below runs against this PR's own base, `{base}`."""

def xpr():
    out = (E / "text-variants-xpr-pr1.txt").read_text().strip()
    src = lambda sha: subprocess.run(["git", "show", f"{sha}:autogpt_platform/frontend/src/components/atoms/Text/helpers.ts"], capture_output=True, text=True, cwd="/home/vercel-sandbox/autogpt").stdout
    def parse(t):
        m = re.search(r"export const variants = \{(.*?)\n\} as const;", t, re.S); body = re.sub(r"//[^\n]*", "", m.group(1)) if m else ""
        return {a or b: c for a, b, c in re.findall(r'(?:"([^"]+)"|(\w+))\s*:\s*\n?\s*"([^"]*)"', body)}
    head, dev = parse(src(P1)), parse(src("4bf85fe86"))
    others = {}
    for line in open("/tmp/abhi-prs.txt").read().split("\n")[1:]:
        if not line.strip(): continue
        num, br, sha = line.split()
        if br.startswith("abhi/tokenise-flow-editor"): continue
        others[num] = parse(src(sha))
    rows = ["| variant | string | the same name and string in |", "| --- | --- | --- |"]
    for k, v in head.items():
        if dev.get(k) == v: continue
        same = [f"#{n}" for n, o in others.items() if o.get(k) == v]
        rows.append(f"| `{k}` | `{v}` | {', '.join(same) if same else 'only here'} |")
    return f"""**Rules 34/35, cross-PR Text variants** ([`text_variants_xpr.py`]({EVT}/tools/text_variants_xpr.py)), run after the last push on `{P1}` against dev and every open `abhi/*` PR head:

```
{out}
```

<details><summary><b>Every variant this PR adds</b> (and the tone <code>inherit</code>, which #16134 adds with the same string)</summary>

{chr(10).join(rows)}

</details>"""

def r46():
    L = (E / "removed-tokens-pr1.md").read_text().split("\n")
    head = L[0]; rows = [l for l in L[4:] if l.startswith("|")]
    q41 = [r for r in rows if "(QUALITY 41)" in r and "→ variant" not in r and "it wraps" not in r]
    rest = [re.sub(r"^\| `[^`]*/([^/`]+)`", r"| `\1`", r).replace(" it wraps", "").replace("the `<Text variant=", "`<Text variant=").replace("wrapping a new ", "+ new ") for r in rows if r not in q41]
    n41 = sum(r.count("(QUALITY 41)") for r in q41)
    return f"""**QUALITY 46, every class token this push removed and where it comes from now** ([`removed_tokens.mts`]({EVT}/tools/removed_tokens.mts), full table [`removed-tokens-pr1.md`]({EVB}/removed-tokens-pr1.md)): {head.replace('`772559324`', '`772559324` (the head the Cursor review read)')}. Only the typography a `<Text>` variant carries left an element; decoration, colour and layout stayed unless the variant or the atom carries the exact class. {n41} of the tokens are the QUALITY-41 state roles on {len(q41)} elements, each replaced in place by its raw class (`bg-surface-active` → `bg-zinc-200`, `bg-surface-hover` → `bg-zinc-100`, `active:bg-surface-hover` → `active:bg-zinc-100`). The six type-label colours in `nodes/helpers.ts` (`!text-brand` → `!text-purple-500`, `!text-info` → `!text-blue-500` ×5) are object strings, not a `className`, so the table doesn't list them. The rest:

<details><summary><b>Removed-token table</b> ({len(rest)} elements)</summary>

| element (head) | element | each removed token → where it comes from now |
| --- | --- | --- |
{chr(10).join(rest)}

</details>"""

def ovr(f):
    lines = (E / f).read_text().splitlines(); t = []
    for l in lines[2:]:
        if not l.startswith("|"): break
        t.append(l)
    return lines[0], "\n".join(t)

def text_table():
    # Full table (paths, merged strings, computed values) goes to the evidence
    # branch; the body keeps file:line, dev's string, the variant and the rest.
    subprocess.run(["python3", str(T / "text_table.py"), "/tmp/all-pairs-p1.json", str(E / "equivalence/pr1-equivalence.md"), str(P / "text-table-p1.md")], check=True, capture_output=True)
    (E / "text-table-pr1.md").write_text((P / "text-table-p1.md").read_text())
    sys.path.insert(0, str(T))
    vs = json.loads(subprocess.run(["npx", "tsx", "-e", "import('./src/components/atoms/Text/helpers.ts').then(m=>console.log(JSON.stringify(m.variants)))"], capture_output=True, text=True, cwd="/home/vercel-sandbox/wt-p1/autogpt_platform/frontend").stdout.strip().splitlines()[-1])
    L = (P / "text-table-p1.md").read_text().strip().split("\n")
    out = ["| element (head) | class string at dev | `variant` + the rest of the merged string | result |", "| --- | --- | --- | --- |"]
    bad = 0
    for l in L[2:]:
        c = l.split(" | "); res = c[-1].rstrip(" |")
        bad += not res.startswith("identical")
        m = re.match(r"\| `([^`]*)` `<Text variant=\"([^\"]*)\">`(.*)$", c[0])
        path, var, tail = m.group(1), m.group(2), m.group(3)
        rest = [w for w in c[2].strip("`").split() if w not in vs.get(var, "").split()]
        tail = tail.replace(" inside a legacy `<Button>`", ", in a legacy `<Button>`")
        out.append(f"| `{path.split('/')[-1]}`{tail} | {c[1]} | `{var}`{' + `' + ' '.join(rest) + '`' if rest else ''} | {'identical' if res.startswith('identical') else res} |")
    return "\n".join(out), len(L) - 2, bad

def fill(tmpl, outname, vals):
    s = (P / tmpl).read_text()
    for k, v in vals.items(): s = s.replace("{TBD:" + k + "}", v)
    s = s.replace("{P1}", P1).replace("{P2}", P2).replace("{EVT}", EVT).replace("{EVB}", EVB).replace("{EVS}", EV[:7])
    left = re.findall(r"\{TBD:[A-Z0-9]+\}|\{EV[TBS]\}|\{P[12]\}", s)
    if left: raise SystemExit(f"{outname}: unfilled {sorted(set(left))}")
    (P / outname).write_text(s); print(outname, len(s), "chars")
    if len(s) > 65536: print("  OVER THE 65,536 LIMIT")

mk = first("equivalence/pr1-markup-equivalence.md"); mkn = first("equivalence/pr1-markup-negative-control.md")
neg = json.load(open("/tmp/markup-neg.json"))
so = (E / "equivalence/same-output-pr1.txt").read_text().strip().splitlines()[-1]
m = re.match(r"(\d+) files compiled; (.*)$", so)
par = (E / "parity-pr1.md").read_text(); parn = par.split()[0]
wr = sum(int(x) for x in re.findall(r"plus (\d+) new", par))
tt, nrows, bad = text_table()
pairs = json.load(open("/tmp/all-pairs-p1.json"))["pairs"]; t = [p for p in pairs if p.get("tag") == "Text-merged"]
o1, o1t = ovr(f"atom-overrides-{P1}.md")
r15 = (E / "rule15-pr1.txt").read_text().strip()
ntt = (E / "rule31-non-text-pr1.txt").read_text().strip().splitlines()
r32 = (P / "r32-p1.md").read_text().strip()
r32 = re.sub(r"Output at `[0-9a-f]+`", f"Output at `{P1}`", r32)
r32 = re.sub(r"(\*\*Rule 40, DS1 token search for every colour `TODO\(tokens\)`:\*\* )[^.]*?contradictions", lambda mm: mm.group(1) + first("todo-token-search-pr1.md"), r32)
nfiles = len(subprocess.run(["git", "diff", "--name-only", "4bf85fe86", P1, "--", "autogpt_platform/frontend"], capture_output=True, text=True, cwd="/home/vercel-sandbox/autogpt").stdout.split())
fill("p1.v5.tmpl.md", "p1.final.md", {
    "C1L": str(p1[1]), "C1": str(p1[0]), "C2": str(p2[0]), "C1RULES": rules_txt(dev, p1), "C1RAW": str(p1[2]["no-raw-colors"]), "C1RESTYLE": str(p1[2]["no-restyle"]),
    "NFILES": str(nfiles), "R15": r15,
    "R43": r43("1", "4bf85fe86", P1, f"It includes the {len(json.load(open('/tmp/struct-colour-p1.json'))['pairs'])} swaps on elements whose copy moved into a `<Text>` (Retry's `bg-white`, the link Buttons' and Update's colours, the `•` separators), which the markup check measures. The CSS side: the drag preview's inline style keeps `#f4f4f5`, and no CSS in this PR reads a role variable."),
    "R32": r32,
    "R31": f"**Rule 31 sweep** ([`non_text_typo.mts`]({EVT}/tools/non_text_typo.mts), every element other than `<Text>` in `build/**` whose `className` carries a size, line-height, weight, family, tracking or decoration class): {len(ntt)} at `{P1}`, each listed by file:line with its reason under Deviations ([`rule31-non-text-pr1.txt`]({EVB}/rule31-non-text-pr1.txt)). Every other copy element in `build/**` renders through `<Text>`.",
    "XPR": xpr(), "R46": r46(),
    "OVR": o1.replace(" (base:", " (dev:"), "OVRTABLE": o1t,
    "EQ1": eqline("equivalence/pr1-equivalence.md"),
    "MK": "**" + re.sub(r"^(\d+) cases, (\d+) measurements.*?: (\d+) failing$", lambda mm: f"{mm.group(1)} cases, {int(mm.group(2)):,} measurements, {mm.group(3)} failing", mk) + "**",
    "MKNEGLIST": "; ".join(n["name"].replace("NEG ", "") for n in neg),
    "MKNEG": re.sub(r"^(\d+) cases, (\d+) measurements.*?: (\d+) failing$", lambda mm: f"{mm.group(3)} of {mm.group(1)} failing", mkn),
    "EQV": eqline("equivalence/pr1-text-variants.md"),
    "SOFILES": m.group(1), "SOHUNKS": m.group(2),
    "INERT": (E / "equivalence/todo-inert-pr1.txt").read_text().strip().splitlines()[-1],
    "PARN": parn, "PARX": f"{wr} new `<Text>` copy wrappers with no other attribute (each inside the element whose copy it now holds) and three additions: `style.ts` exports `blockDragPreviewClassName`, `Text`'s props gain an optional `htmlFor` (for `as=\"label\"`), and `MCPAuthSchemeField` gains the optional `labelVariant` (its label renders through `<Text>` when given one)",
    "TEXTCOUNT": f"{len({(p['file'], p['line']) for p in t})} elements in {nrows} rows, one per state for the two OutputHandler elements whose variant switches; {bad} not identical".replace("; 0 not identical", ""),
    "SWAPS": (P / "swaps-p1.md").read_text().strip(), "VITEST": VITEST,
})
r40 = (P / "r40-p2.md").read_text().strip()
r40 = re.sub(r"(\*\*Rule 40, DS1 token search for every colour `TODO\(tokens\)`:\*\* )[^.]*?contradictions", lambda mm: mm.group(1) + first("todo-token-search-pr2.md"), r40)
fill("p2.v5.tmpl.md", "p2.final.md", {
    "C1L": str(p1[1]), "C1": str(p1[0]), "C2L": str(p2[1]), "C2": str(p2[0]), "C2RULES": rules_txt(p1, p2),
    "R43": r43("2", P1, P2, "The CSS side: `flow.css` reads only `--color-builder-grid`, which `.dark` doesn't redefine, and `tutorial.css` reads no role variable (its colours stay raw, see Changes)."),
    "R40": r40, "EQ2": eqline("equivalence/pr2-equivalence.md"),
    "PARN": (E / "parity-pr2.md").read_text().split()[0], "SWAPS": (P / "swaps-p2.md").read_text().strip(), "VITEST": VITEST,
})
