# run0616 / run0626 layer over body_static: migrated legacy Button/Badge, Deviations by file:line, rule 37(b),
# DS1 token search (rule 40), cross-PR table, QUALITY 39 map. Imported by assemble2.py after body_static.
import json, re, subprocess
from body_static import PRS, COMMON_DEV

E = "/home/vercel-sandbox/autogpt/.context/ev"; R = "/home/vercel-sandbox/autogpt"
SH = open(f"{E}/shas.txt").read().split()[1:]
GLYPH = ("existing glyph kept for 0 px. The icon-library rule is DS4/SECRT-3100's no-restricted-imports "
         "(lucide/@radix-ui/react-icons stay on the warn ratchet). Swapping is a design change for Abhimanyu. "
         "Orchestrator approval run0616.")
B16092 = subprocess.run(["git", "-C", R, "rev-parse", "--short", "refs/pr/16092"], capture_output=True, text=True).stdout.strip()
B16118 = subprocess.run(["git", "-C", R, "rev-parse", "--short", "refs/pr/16118"], capture_output=True, text=True).stdout.strip()

def drop(k, *prefixes):
    PRS[k]["deviations"] = [d for d in PRS[k]["deviations"] if not any(d.startswith(p) for p in prefixes)]

# --- PR 1: PaginationControls on atoms/Button legacy-outline (#16092's variant)
PRS[1]["what"] = PRS[1]["what"].replace(
    "- `pagination-controls` (2 admin importers) becomes `molecules/PaginationControls` at today's markup.",
    "- `pagination-controls` (2 admin importers) becomes `molecules/PaginationControls` at today's markup. Its two page buttons render "
    "`atoms/Button` with `variant=\"legacy-outline\"`, the variant DS3a-3 #16092 adds at the legacy `outline` Button's look (SECRT-3112 How 2); "
    f"`atoms/Button` (`Button.tsx`, `helpers.ts`, `LegacyButton.tsx`, its story and tests) is #16092's files at its head `{B16092}`, byte for byte (QUALITY rule 41; table below).")
PRS[1]["what"] += "\n- Stories: `molecules/Carousel` (Default, Looping, Vertical) and `molecules/PaginationControls` (FirstPage, MiddlePage, LastPage, SinglePage)."
drop(1, "**Legacy dependency kept", "**New design-system components without a story")
# --- PR 2
drop(2, "**Calendar dropdown on the select primitives", "**Glyphs that are not Hugeicons", "**New design-system components without a story")
PRS[2]["deviations"] = [
    "**Calendar dropdown on the select primitives, not the `Select` atom:** `atoms/Calendar`'s month/year dropdown (`src/components/atoms/Calendar/Calendar.tsx`) renders "
    "`atoms/Select/components/SelectPrimitives` (DS3a-4 #16086 moved the legacy `select` there), as on `dev`. The `atoms/Select` atom renders a different trigger and list, "
    "so switching to it is a visible change and not part of this ticket.",
    "**Glyphs that are not Hugeicons:** `src/components/atoms/Calendar/Calendar.tsx:5-9` (the `@radix-ui/react-icons` import), `:144` `ChevronLeftIcon`, `:151` `ChevronRightIcon`, "
    f"`:158` `ChevronDownIcon`; `src/components/atoms/LoadingSpinner/LoadingSpinner.tsx:21` (lucide `loader-circle` path, drawn through the `Icon` atom): {GLYPH}",
] + PRS[2]["deviations"]
PRS[2]["what"] += "\n- Stories: `atoms/Calendar` (Default, WithSelection, Range, WithDisabledDays) and `molecules/ScrollArea` (Vertical, Horizontal)."
# --- PR 3: MultiSelect chip on atoms/Badge secondary (#16118's variant)
PRS[3]["what"] = PRS[3]["what"].replace(
    "Each chip label is",
    "Each selected value's chip renders `atoms/Badge` with `variant=\"secondary\"`, the chip variant DS3a-2 #16118 adds at the legacy `secondary` badge's look "
    f"(SECRT-3112 How 2); `atoms/Badge/Badge.tsx` is #16118's file at its head `{B16118}`, byte for byte (table below). Each chip label is")
PRS[3]["what"] += "\n- Story: `molecules/MultiSelect` (Empty, WithValues, WithDisabledOption)."
drop(3, "**Legacy dependency kept", "**Glyphs that are not Hugeicons", "**Rule 31, one hit kept", "**New design-system components without a story")
PRS[3]["deviations"] = [
    f"**Glyphs that are not Hugeicons:** `src/components/molecules/MultiSelect/MultiSelect.tsx:13` (the lucide import), `:214` `RemoveIcon` (lucide `X`), `:334` `Check`: {GLYPH}",
    "**Rule 31, one hit kept:** `src/components/molecules/MultiSelect/MultiSelect.tsx:181` (`MultiSelectorTrigger`'s `<div>`, tag at `:177`) carries `text-body leading-5` (was `text-sm`). "
    "It is the flex container of the chips and the cmdk input, and the class only serves the font the cmdk `<input>` inherits (each chip's label is `<Text>`); "
    "`<Text>` would render a `p` around a form control. Orchestrator approval run0616.",
    "**Rule 31 scanner hit on `atoms/Badge`:** `src/components/atoms/Badge/Badge.tsx:67` is the atom's own tint `<span>` (`font-sans font-medium`), unchanged; the scanner counts it because "
    "`badgeVariants` → `tintVariants` on `:73` sits inside the tag. The chip `<div>` (`:57`) takes its type from `chipBase`, the atom's own classes. Both are #16118's lines, byte for byte.",
] + PRS[3]["deviations"]
PRS[3]["deviations"] = [d.replace("One element is not slotted: each selected value's chip, which is the legacy `Badge` (a `div`); it gets its slot when the DS3a part that moves `badge` replaces it.",
                                  "Each selected value's chip is `atoms/Badge`, slotted `badge` by the atom.") for d in PRS[3]["deviations"]]

# --- Done-when: name the PRs that carry the rest, not the ticket
COMMON_DEV[:] = [d for d in COMMON_DEV if not d.startswith("**Done-when not yet met")] + [
    "**Done-when not yet met (by design, one primitive group per PR):** `src/components/__legacy__/ui` still exists on this stack's last head. Left there: `card`, `label`, `icons`, `separator` "
    "(this stack's parts 5-8), `badge` (DS3a-2 #16118), `checkbox` (#16120), `form` (#16122), `skeleton` (#16119), `textarea` (#16121), `button` (DS3a-3 #16092) and `input` (#16091). "
    "`dialog`, `select`, `table` (DS3a-4), `tabs`, `sheet` and `dropdown-menu` (OPEN-3682) are already gone on `dev`."]

# --- Cross-PR table (PR 1 and PR 3)
def conflicts(head, other):
    out = subprocess.run(["git", "-C", R, "merge-tree", "--write-tree", head, other], capture_output=True, text=True).stdout
    files = set()
    for l in out.splitlines():
        if not l.startswith("CONFLICT"): continue
        m = re.search(r"Merge conflict in (\S+)", l) or re.search(r"\): (\S+) deleted in", l)
        files.add(m.group(1).replace("autogpt_platform/frontend/", ""))
    return sorted(files)

def conflict_line(head, other, num, why):
    c = conflicts(head, other)
    oh = subprocess.run(["git", "-C", R, "rev-parse", "--short", other], capture_output=True, text=True).stdout.strip()
    return (f"`git merge-tree --write-tree {head} {oh}` (#{num}): the shared files above merge without a conflict; {len(c)} other files conflict: "
            + ", ".join(f"`{f}`" for f in c) + f". {why}")

def same(head, ref, path):
    g = lambda r: subprocess.run(["git", "-C", R, "rev-parse", f"{r}:autogpt_platform/frontend/src/components/{path}"], capture_output=True, text=True).stdout.strip()
    return g(head) == g(ref) and g(head) != ""

def cross(k):
    if k == 1:
        rows = []
        for f, u in [("Button.tsx", "`variant=\"legacy-outline\"` renders `LegacyButton`"), ("helpers.ts", "`legacyButtonVariants` `legacy-outline` + size `default` (`h-9 px-4 py-2`)"), ("LegacyButton.tsx", "the plain `<button>` with those classes")]:
            p = f"atoms/Button/{f}"
            rows.append(f"| `src/components/{p}` | {'yes, byte for byte' if same(SH[1], 'refs/pr/16092', p) else 'no: one line, below'} | {u} |")
        d = subprocess.run(["git", "-C", R, "diff", "-U0", SH[1], "refs/pr/16092", "--", "autogpt_platform/frontend/src/components/atoms/Button/helpers.ts"], capture_output=True, text=True).stdout
        changed = [l for l in d.splitlines() if l[:1] in "+-" and not l.startswith(("+++", "---"))]
        note = ""
        if changed:
            note = (f"\n\n#16092's head `{B16092}` changes one string in `helpers.ts` after `40b31932f` (`legacy-default`'s `dark:bg-neutral-50` → `dark:bg-background`). That change is being reverted on #16092 "
                    "(QUALITY rule 41: a shared copy changes everywhere in one push or nowhere), so this PR keeps the string `dev`'s legacy `button.tsx` has. The `dark:` classes never apply (`forcedTheme=\"light\"`).\n\n```diff\n" + "\n".join(changed) + "\n```")
        return ("#### Shared with other open PRs (QUALITY rule 41)\n\n| file on this head | the same file on #16092 (DS3a-3) head `" + B16092 + "` | what this PR uses |\n| --- | --- | --- |\n"
                + "\n".join(rows) + note
                + "\n\nThe legacy `outline` Button's class string and `legacy-outline`'s are pair 2 of table 2 (identical, 48 measurements): `text-sm` → `text-body leading-5` and `bg-white` → `bg-surface`, everything else the same string. "
                + conflict_line(SH[1], "refs/pr/16092", 16092, "`atoms/Text/helpers.ts`: both add variants at the same place (keep both). `PaginationControls.tsx`: #16092 makes the same `legacy-outline` / `body-tight` change to the legacy file this PR moves, and this side adds the DS7 `data-slot`s (take this side). `carousel.tsx`: #16092 edits the legacy file this PR deletes (keep the delete: `molecules/Carousel` does not carry the parts #16092 edited). Whichever PR lands second takes that merge; no rendered value changes."))
    if k == 3:
        heads = {n: subprocess.run(["git", "-C", R, "rev-parse", "--short", f"refs/pr/{n}"], capture_output=True, text=True).stdout.strip() for n in (16118, 16119, 16120, 16121, 16122)}
        cells = " | ".join(("yes" if same(SH[3], f"refs/pr/{n}", "atoms/Badge/Badge.tsx") else "no") for n in heads)
        return ("#### Shared with other open PRs (QUALITY rule 41)\n\n| file on this head | " + " | ".join(f"#{n} `{h}`" for n, h in heads.items()) + " | what this PR uses |\n| --- |" + " --- |" * (len(heads) + 1) + "\n"
                f"| `src/components/atoms/Badge/Badge.tsx` | {cells} | `chipBase` + `chipVariants.secondary` |\n\n"
                "Byte for byte the same file on all five DS3a-2 PRs. The legacy `secondary` badge's class string and `chipBase` + `secondary`'s are in table 2 (identical): `text-xs` → `text-caption leading-4`, `focus:ring-neutral-950` → `focus:ring-focus`, "
                "dead `dark:` classes dropped. " + conflict_line(SH[3], "refs/pr/16118", 16118, "`NodeExecutionBadge.tsx`, `MCPToolDialog.tsx`: adjacent import lines, #16118 moves `badge` and #16137 moves `loading`/`scroll-area` (keep both new imports). `MultiSelect.tsx`: #16118 makes the same `small-semibold-tight` chip label change to the legacy file this PR moves, and this side adds the DS7 `data-slot` (take this side). `atoms/Text/helpers.ts`: both add variants at the same place (keep both). Whichever PR lands second takes that merge; no rendered value changes."))
    return ""

# --- Rule 37(b): every strict-lint hit the moved files carried on base
L37 = json.load(open(f"{E}/lint37.json"))
REMOVED = {  # base line -> why it is gone (export with no importer, not carried over)
    "src/components/__legacy__/ui/carousel.tsx:315": "`CarouselIndicator`, no importer, not carried over", "src/components/__legacy__/ui/carousel.tsx:316": "`CarouselIndicator`, no importer, not carried over",
    "src/components/__legacy__/ui/command.tsx:36": "`CommandDialog`, no importer, not carried over", "src/components/__legacy__/ui/command.tsx:37": "`CommandDialog`, no importer, not carried over",
    "src/components/__legacy__/ui/command.tsx:54": "`CommandInput`, no importer, not carried over", "src/components/__legacy__/ui/command.tsx:97": "`CommandGroup`, no importer, not carried over",
    "src/components/__legacy__/ui/command.tsx:112": "`CommandSeparator`, no importer, not carried over", "src/components/__legacy__/ui/command.tsx:141": "`CommandShortcut`, no importer, not carried over",
}
TOKENISED = {"hover:text-neutral-50": "`hover:text-primary-foreground` (#FAFAFA)", "focus:text-neutral-50": "`focus:text-primary-foreground` (#FAFAFA)",
             "bg-white": "`bg-surface`", "text-sm": "`text-body leading-5`", "Use a SelectTrigger size: . Margin here or gap on the parent": "`bg-surface text-body leading-5` on the select primitive, no strict hit at head"}
POPOVER = {"border-neutral-200": "moved to the four callers' `className`, kept with a `TODO(tokens)`", "text-neutral-950": "moved to the four callers' `className` (the `focus` role is a ring colour), kept with a `TODO(tokens)`"}
POPOVER_AT = ("`src/app/(platform)/build/components/NewControlPanel/NewBlockMenu/BlockMenu/BlockMenu.tsx:54`, `.../NewSaveControl/NewSaveControl.tsx:58`, "
              "`src/components/atoms/DateInput/DateInput.tsx:146`, `src/components/atoms/DateTimeInput/DateTimeInput.tsx:213`")
KEPT_WHY = {"no-raw-colors": "no exact role (`TODO(tokens)`, token search below)", "no-arbitrary-values": None, "no-inline-styles": "Radix `ScrollArea` viewport: the overflow axes come from props at runtime, moved as is"}
ARB = {"text-[0.8rem]": "12.8px, no type role at that size (SECRT-3152, rare size)", "rounded-[inherit]": "no radius name for `inherit`, moved as is",
       "p-[1px]": "moved as is (rename, 82% similar); Tailwind's `p-px` is the same 1px, but it is a spacing-scale class, not a DS1 token, so this PR leaves the moved line alone"}

def lint37(k):
    rows = L37[str(k)]
    out = [f"#### Rule 37(b): strict-lint hits the moved files carried on base\n",
           f"`python3 lint37.py` ([script]({{TREE}}/tools/lint37.py)): DS4's `.oxlintrc.strict.json` at `1ee6580dc` on each deleted file at base `{SH[k - 1]}` and on its new home at head `{SH[k]}`, "
           "matched by rule and the quoted class.\n", "| base hit | rule | class / message | at head | fixed or deviated |", "| --- | --- | --- | --- | --- |"]
    for r in rows:
        if not r["file"]: continue
        tok = r["token"]; rule = r["rule"].replace("shadcn(", "").rstrip(")")
        if r["head"]:
            why = ARB.get(tok) if rule == "no-arbitrary-values" else KEPT_WHY.get(rule, "kept")
            if rule == "no-raw-colors" and "neutral-950" in tok: why = "the `focus` token holds #0A0A0A, but it is the focus-ring role, not a text colour (SECRT-3154); kept with a `TODO(tokens)`, token search below"
            out.append(f"| `{r['file']}` | {rule} | `{tok[:70]}` | `{r['head']}` | Deviation: {why} |")
        else:
            if r["file"] in REMOVED: why = REMOVED[r["file"]]
            elif tok.startswith("dark:"): why = "dead `dark:` class dropped (`forcedTheme=\"light\"`)"
            elif k == 4 and tok in POPOVER: why = POPOVER[tok] + f": {POPOVER_AT}"
            elif tok in TOKENISED: why = "token: " + TOKENISED[tok]
            else: why = "fixed"
            out.append(f"| `{r['file']}` | {rule} | `{tok[:70]}` | - | {'Deviation: ' if k == 4 and tok in POPOVER else 'Fixed: '}{why} |")
    new = [r for r in rows if not r["file"]]
    if k == 2:
        out.append("\nStrict hits on the head lines that no moved file carried: `src/components/atoms/Calendar/Calendar.tsx:116` `hover:bg-neutral-100`, `hover:text-neutral-900` come from the legacy "
                   "`Button`'s `ghost` variant (`src/components/__legacy__/ui/button.tsx:22`), which the day button's classes were built from; written out as the exact string, kept with a `TODO(tokens)` "
                   "(`button.tsx` keeps its own copy until #16092 deletes it). `src/components/atoms/LoadingSpinner/LoadingSpinner.tsx:48`, `:56` (`require-static-classes`) are the two hits the file "
                   "already had on base (`:21`, `:29`), moved down by the `circle` variant.")
    elif new:
        out.append("\nNew at head: " + ", ".join(f"`{r['head']}` {r['rule']} `{r['token'][:50]}`" for r in new))
    return "\n".join(out)

def tokensearch(k):
    t = subprocess.run(["python3", "-I", f"{E}/tokensearch.py", SH[k - 1], SH[k]], capture_output=True, text=True).stdout.strip()
    return ("#### Rule 40: DS1 token search for every colour `TODO(tokens)` this PR writes\n\n"
            f"`python3 tokensearch.py {SH[k - 1]} {SH[k]}` ([script]({{TREE}}/tools/tokensearch.py)): every `--color-*` in the light `:root` of `src/app/globals.css` whose RGB equals the value, "
            "and every `scripts/codemod-tokens.ts` mapping for the exact class. `none` means no token holds the value.\n\n" + t.split("\n", 2)[2] +
("\n\nWhere a token does hold the value it is a role of another kind, named in the comment: " + "; ".join(x for h, x in [
                ("#0A0A0A", "#0A0A0A is `focus`, the Button focus-ring colour, not a text colour (SECRT-3154 asks for a text role)"),
                ("#FAFAFA", "#FAFAFA is shadcn's `background` (and its `*-foreground` pairs), the page background; the `legacy-*` Button uses it only as `text-neutral-50` on dark fills and in dead `dark:` classes")] if h + " | --color-" in t) + "." if any(h + " | --color-" in t for h in ("#0A0A0A", "#FAFAFA")) else ""))

# --- QUALITY 39: SECRT-3112 How items -> PR -> file (PR 4 body)
Q39 = """#### SECRT-3112 How items → PR → file (the whole DS3a-1 stack)

| How item | PR | files |
| --- | --- | --- |
| 1. `carousel`, `collapsible`, `pagination-controls` → the molecule of the same role | #16136 | `molecules/Carousel/Carousel.tsx` (new), `molecules/Collapsible/Collapsible.tsx`, `molecules/PaginationControls/PaginationControls.tsx` (moved); importers `marketplace/components/AgentsSection/AgentsSection.tsx`, `admin/marketplace/components/AdminAgentsDataTable.tsx`, `admin/spending/components/AdminUserGrantHistory.tsx` |
| 1. `calendar`, `loading`, `scroll-area` | #16137 | `atoms/Calendar/Calendar.tsx` (new), `atoms/LoadingSpinner/LoadingSpinner.tsx` (`variant="circle"`), `molecules/ScrollArea/ScrollArea.tsx` (moved); importers `atoms/DateInput`, `atoms/DateTimeInput`, `build/.../AgentOutputs.tsx`, `NodeExecutionBadge.tsx`, `ViewMoreData.tsx`, `MCPToolDialog.tsx`, `reset-password/page.tsx` |
| 1. `multiselect`, `command` | #16139 | `molecules/MultiSelect/MultiSelect.tsx` (moved), `molecules/MultiSelect/components/Command.tsx` (new); importers `renderers/.../SelectWidget.tsx`, `renderers/.../MultiSelectField.tsx` |
| 1. `popover` → `molecules/Popover` | #16140 | importers `build/.../BlockMenu.tsx`, `build/.../NewSaveControl.tsx`, `atoms/DateInput/DateInput.tsx`, `atoms/DateTimeInput/DateTimeInput.tsx` |
| 1. `card`, `label`, `icons`, `separator` | this stack's parts 5-8 (not opened yet) | - |
| 1. `button`, `input` / `badge`, `checkbox`, `form`, `skeleton`, `textarea` | DS3a-3 #16092, #16091 / DS3a-2 #16118, #16120, #16122, #16119, #16121 | - |
| 2. a prop or variant the design-system component lacks, added at today's value | #16136 | `atoms/Button/helpers.ts` `legacy-outline` (#16092's, byte for byte), `atoms/Text/helpers.ts` `body-tight` + tone `inherit` (#16134's names) |
| 2. | #16137 | `atoms/LoadingSpinner/LoadingSpinner.tsx` `variant="circle"`; `atoms/Calendar` at today's classes |
| 2. | #16139 | `atoms/Badge/Badge.tsx` chip variants (#16118's, byte for byte), `atoms/Text/helpers.ts` `small-semibold-tight` |
| 2. | #16140 | none: each caller passes the classes that keep today's look to `molecules/Popover`'s `PopoverContent` |
| 3. `atoms/Input` stops wrapping `__legacy__/ui/input` | DS3a-3 #16091 | not in this stack (`atoms/Input/Input.tsx:4` still imports it on these heads) |
| 4. delete each file once its importers are at zero | #16136, #16137, #16139, #16140 | `__legacy__/ui/{carousel,collapsible,pagination-controls}.tsx`, `{calendar,loading,scroll-area}.tsx`, `{command,multiselect}.tsx` (+ `multiselect.test.tsx`, moved), `popover.tsx` deleted; the importer grep in each PR's (d) returns nothing |
| 4. delete the folder and the `warn` override | after the last primitive (not this stack's PRs alone) | Deviations: "Warn override" |
| 5. small PRs, one primitive group each, pixel diff 0 | all four | Visual check: batch diff after merge, per Abhimanyu 25 Oct |
"""

def extra(k):
    s = [x for x in (cross(k), lint37(k), tokensearch(k), Q39 if k == 4 else "") if x]
    return "\n\n".join(s)

# --- why touched-file strict counts rise on PR 1 and PR 4 (file-level, oxlint strict at each SHA)
COUNT_NOTE = {
    1: "**Why the touched files' count rises:** +23 `no-raw-colors` in `src/components/atoms/Button/helpers.ts`, the `legacy-*` variants (#16092's file, byte for byte): their `neutral-*` and dead `dark:` classes are the legacy `button.tsx`'s, which stays in `__legacy__/ui` with its own hits until #16092 deletes it, so until then the same classes count twice. "
       "+2 `no-restyle` in `AgentsSection.tsx:83`: the `className` it passes to `CarouselContent` is the same as on base, but the rule checks design-system components and not legacy ones. Every class is listed in table 2 (identical) and rule 37(b).",
    4: "**Why the touched files' count rises:** the classes the legacy `PopoverContent` held (`border-neutral-200`, `text-neutral-950`) now sit on the four callers, which pass them to `molecules/Popover` to keep today's look, and `no-restyle` checks a design-system `PopoverContent`'s `className` where it never checked the legacy one: "
       "`BlockMenu.tsx:54` 0 → 6 `no-restyle` (+2 `no-raw-colors`), `NewSaveControl.tsx:58` 3 → 6 (+2), `DateInput.tsx:146` and `DateTimeInput.tsx:213` +2 `no-raw-colors` each. The other way to keep the look, a variant on `molecules/Popover` at today's value (SECRT-3112 How 2), would add the same classes inside the molecule; this PR keeps them at the callers, where `TODO(tokens)` marks each.",
}

PRS[4]["deviations"] = PRS[4]["deviations"] + [
    "**`data-slot` on the popover triggers:** `BlockMenu` and `NewSaveControl` now render `molecules/Popover`'s `PopoverTrigger`, which carries DS7's `data-slot=\"popover-trigger\"` on `dev` (`src/components/molecules/Popover/Popover.tsx:14`). "
    "It shows in the harness's record of where focus lands after Escape (`button aria-expanded=false` → the same button with `data-slot=popover-trigger`); the element, its position in the Tab order and every pixel are the same."]

# ===== QUALITY rule 43 (dark: classes kept, colour swaps checked against .dark) =====
def _rep(k, key, a, b):
    assert a in PRS[k][key], (k, key, a[:50]); PRS[k][key] = PRS[k][key].replace(a, b)
_rep(2, "what", "`hover/focus:text-neutral-50` → `text-primary-foreground` (#FAFAFA, a text role), dead `dark:` classes dropped.",
     "every `dark:` class kept verbatim, including the ghost day button's `dark:hover:` pair; `hover/focus:text-neutral-50` stays raw (`primary-foreground` is #FAFAFA in `:root` but #18181B in `.dark`).")
_rep(2, "parity", "drops the `dark:` thumb class (no dark theme) and", "keeps the `dark:` thumb class and drops")
_rep(3, "what", "`bg-white` → `bg-surface`, dead `dark:` classes dropped.", "`bg-white` → `bg-surface`, every `dark:` class of the parts it keeps kept verbatim.")
PRS[3]["what"] += "\n- Each chip passes the legacy secondary badge's `dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-50 dark:focus:ring-neutral-300` at the call site, so its dark colours are `dev`'s while `atoms/Badge` stays #16118's file byte for byte (QUALITY rule 41)."
PRS[4]["what"] += "\n- Each caller also passes the legacy `PopoverContent`'s `dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50`, so the popovers keep `dev`'s dark colours (QUALITY rule 43)."
PRS[2]["todos"] = [t.replace("`hover:text-neutral-900`/`text-neutral-900` #171717", "`hover:text-neutral-900`/`text-neutral-900` #171717, `hover/focus:text-neutral-50` #FAFAFA (`primary-foreground` only in `:root`, SECRT-3154)") for t in PRS[2]["todos"]]

KEPT_WHY_DARK = "kept verbatim (QUALITY rule 43: the dark colour stays `dev`'s)"
COUNT_NOTE[2] = ("**Why the touched files' count rises (150 → 159):** +4 `no-raw-colors` on `src/components/atoms/Calendar/Calendar.tsx` for the legacy ghost Button's `hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-50`, which the day button now writes out (they were `__legacy__/ui/button.tsx:22`'s, not the calendar file's); "
                 "+7 on `molecules/ScrollArea/ScrollArea.tsx`, the same hits `__legacy__/ui/scroll-area.tsx` had, now counted under the moved file's path; +2 `no-restyle` where `AgentOutputs.tsx` and `MCPToolDialog.tsx` pass a `className` to the design-system `ScrollArea` (the rule does not check legacy components); "
                 "−4 `no-restyle` the legacy calendar's `SelectTrigger`/`SelectContent` had. Every `dark:` class is kept (QUALITY rule 43).")
COUNT_NOTE[4] = ("**Why the touched files' count rises (15 → 45):** the legacy `PopoverContent`'s colour classes now sit on its four callers, light and `dark:` (QUALITY rule 43): +20 `no-raw-colors` (`border-neutral-200 text-neutral-950 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50` on `BlockMenu.tsx:54`, `NewSaveControl.tsx:58`, `DateInput.tsx:146`, `DateTimeInput.tsx:213`), "
                 "+15 `no-restyle` because the rule checks a design-system `PopoverContent`'s `className` and never checked the legacy one, −5 for `__legacy__/ui/popover.tsx`'s own hits. A `molecules/Popover` variant at today's look (SECRT-3112 How 2) would move the same classes inside the molecule; it is not added here because `molecules/Popover` is shared by every popover in the app.")

_lint37_orig = lint37
def lint37(k):
    out = _lint37_orig(k)
    out = out.replace("| Deviation: no exact role (`TODO(tokens)`, token search below) |", "| Deviation: no exact role (`TODO(tokens)`, token search below) |")
    rows = []
    for line in out.split("\n"):
        if line.startswith("| `src/") and "| `dark:" in line and "| Deviation:" in line:
            line = line.rsplit("| Deviation:", 1)[0] + f"| Kept: {KEPT_WHY_DARK} |"
        rows.append(line)
    out = "\n".join(rows)
    if k == 2:
        out = out.replace("`hover:bg-neutral-100`, `hover:text-neutral-900` come from the legacy", "`hover:bg-neutral-100`, `hover:text-neutral-900`, `dark:hover:bg-neutral-800`, `dark:hover:text-neutral-50` come from the legacy")
    if k == 3:
        out += ("\n\nStrict hits on head lines that no moved file carried: the chip's `dark:border-neutral-800`, `dark:bg-neutral-800`, `dark:text-neutral-50`, `dark:focus:ring-neutral-300` "
                "(`src/components/molecules/MultiSelect/MultiSelect.tsx`, the chip's `className`), the legacy secondary badge's own `dark:` classes (`__legacy__/ui/badge.tsx`), kept so the chip's dark colours stay `dev`'s.")
    return out

_SWAPS = {
    1: [("`bg-white`", "`bg-surface`", "`legacy-outline` (#16092's `atoms/Button/helpers.ts`), PaginationControls' two buttons", "#FEFEFE (`white` is `#fefefe` in `styles/colors.ts`)", "#FEFEFE", "not set: #FEFEFE", "`dark:bg-neutral-950` (kept on both)", "surface", "a control's fill"),
        ("`bg-red-500`, `hover:bg-red-500/90`", "`bg-error`, `hover:bg-error/90`", "`legacy-destructive` (#16092's file; no call site in this PR)", "#EF4444", "#EF4444", "not set: #EF4444", "`dark:bg-red-900` (kept on both)", "status", "a destructive action's fill")],
    2: [("`bg-white`", "`bg-surface`", "`atoms/Calendar` month/year `SelectTrigger` and `SelectContent`", "#FEFEFE", "#FEFEFE", "not set: #FEFEFE", "trigger: none (#FEFEFE in both modes on both); content: `dark:bg-neutral-950` from the select primitives (kept)", "surface", "a control's fill")],
    3: [("`bg-white`", "`bg-surface`", "`MultiSelect/components/Command.tsx` root", "#FEFEFE", "#FEFEFE", "not set: #FEFEFE", "`dark:bg-neutral-950` (kept on both)", "surface", "the option list's fill"),
        ("`focus:ring-neutral-950`", "`focus:ring-focus`", "each chip (`atoms/Badge` `chipBase`, #16118's file)", "#0A0A0A", "#0A0A0A", "not set: #0A0A0A", "`dark:focus:ring-neutral-300` (on the legacy badge; passed at the call site on head)", "focus", "the focus ring")],
    4: [("`bg-white`", "`bg-surface`", "`molecules/Popover`'s `PopoverContent` (the molecule's own class; the callers do not pass a fill)", "#FEFEFE", "#FEFEFE", "not set: #FEFEFE", "`dark:bg-neutral-950` (legacy; passed by all four callers on head)", "surface", "the popover's fill")],
}

def rule43(k):
    b, h = SH[k - 1], SH[k]
    chk = subprocess.run(["python3", "-I", f"{E}/darkcheck.py", b, h], capture_output=True, text=True).stdout.strip()
    rows = ["| old class | new token | where | old value (`:root`) | token `:root` | token `.dark` | the element's dark output, old and new | kind | meaning |", "| --- | --- | --- | --- | --- | --- | --- | --- | --- |"]
    rows += [f"| {' | '.join(r)} |" for r in _SWAPS[k]]
    extra = ""
    if k == 2:
        extra = ("\n\nNot swapped: `hover:text-neutral-50` and `focus:text-neutral-50` on the selected day stay raw. `text-primary-foreground` is #FAFAFA in `:root` but #18181B in `.dark`, so it is not the same colour; "
                 "`TODO(tokens)` at `src/components/atoms/Calendar/Calendar.tsx:120` names it (Deviation for SECRT-3154).")
    if k == 3:
        extra = ("\n\n`atoms/Badge/Badge.tsx` is #16118's file byte for byte (QUALITY rule 41). Its `solid` chip (`text-primary-foreground`: #18181B in `.dark`, where the legacy `default` badge had `dark:text-neutral-900` #171717 and `dark:bg-neutral-50`) "
                 "and its chips without the legacy `dark:` classes are not rendered by this PR; this PR's only chip is `secondary`, whose legacy `dark:` classes it passes at the call site. The shared file's rule-43 change belongs to #16118 and lands here in the same push when it does.")
    return ("#### QUALITY rule 43: dark mode\n\n"
            f"**(1) Removed `dark:` classes** ([`darkcheck.py`]({{TREE}}/tools/darkcheck.py), the `git diff {b}...{h} | grep -E '^-.*dark:'` check with each class matched on the added lines and its component looked up on the head):\n\n```\n{chk}\n```\n\n"
            "**(2) Every colour swap, with its `.dark` value** (from `src/app/globals.css` on this head: `.dark` sets only shadcn's roles, so `surface`, `error` and `focus` keep their `:root` value in both modes):\n\n" + "\n".join(rows) + extra + "\n\n"
            "**(3) Strict counts** (section 1) are taken on this head with every `dark:` class in place.\n\n"
            f"**(4) Equivalence** (table 2) runs from this head `{h}` against this PR's own base `{b}`" + (" (`dev`)." if k == 1 else f" (the head of the PR below it in the stack)."))

_extra_orig = extra
def extra(k):
    return rule43(k) + "\n\n" + _extra_orig(k)

_lint37_43 = lint37
def lint37(k):
    out = _lint37_43(k)
    if k == 4:
        out = out.replace("| Fixed: dead `dark:` class dropped (`forcedTheme=\"light\"`) |", f"| Moved, verbatim, to the four callers' `className` (QUALITY rule 43): {POPOVER_AT} |")
    return out

_tokensearch_43 = tokensearch
def tokensearch(k):
    out = _tokensearch_43(k)
    if k == 2:
        out = re.sub(r"#FAFAFA is shadcn's `background`[^.]*\.[^.]*classes\.?", "#FAFAFA is `primary-foreground` (and shadcn's `background` family) in `:root`, but `primary-foreground` is #18181B in `.dark`, so the selected day keeps the raw `text-neutral-50` (QUALITY rule 43 above).", out)
    return out

POST = [
    ("their `neutral-*` and dead `dark:` classes are the legacy `button.tsx`'s", "their `neutral-*` and `dark:` classes (kept, QUALITY rule 43) are the legacy `button.tsx`'s"),
    ("the `legacy-*` Button uses it only as `text-neutral-50` on dark fills and in dead `dark:` classes.", "the `legacy-*` Button uses it only as `text-neutral-50` on dark fills and in its `dark:` classes, all kept raw."),
    ("`focus:ring-neutral-950` → `focus:ring-focus`, dead `dark:` classes dropped.", "`focus:ring-neutral-950` → `focus:ring-focus`; the legacy badge's `dark:` classes, which the chip variants do not carry, are passed at the call site (QUALITY rule 43 above)."),
]
POST_K = {2: [("#FAFAFA is shadcn's `background` (and its `*-foreground` pairs), the page background; the `legacy-*` Button uses it only as `text-neutral-50` on dark fills and in its `dark:` classes, all kept raw.",
               "#FAFAFA is `primary-foreground` (and shadcn's `background` family) in `:root`, but `primary-foreground` is #18181B in `.dark`, so the selected day keeps the raw `text-neutral-50` (QUALITY rule 43 above).")]}
def post(k, text):
    for a, b in POST + POST_K.get(k, []): text = text.replace(a, b)
    return text

# ===== #16118's Badge 2d5cc3094 (chips carry the legacy dark: classes; run1046) =====
PRS[3]["what"] = PRS[3]["what"].replace(
    "\n- Each chip passes the legacy secondary badge's `dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-50 dark:focus:ring-neutral-300` at the call site, so its dark colours are `dev`'s while `atoms/Badge` stays #16118's file byte for byte (QUALITY rule 41).",
    "\n- `atoms/Badge/Badge.tsx` is #16118's file byte for byte (QUALITY rule 41). Its chips carry the legacy badge's `dark:` classes and keep raw fills where a token's `.dark` value differs, so the multiselect chip's dark colours are `dev`'s with no call-site override.")
_SWAPS[3][1] = ("`focus:ring-neutral-950`", "`focus:ring-focus`", "each chip (`atoms/Badge` `chipBehaviour`, #16118's file)", "#0A0A0A", "#0A0A0A", "not set: #0A0A0A", "`dark:focus:ring-neutral-300` (legacy badge; in `chipBehaviour` on head)", "focus", "the focus ring")
_rule43_b = rule43
def rule43(k):
    out = _rule43_b(k)
    if k == 3:
        a = out.index("\n\n`atoms/Badge/Badge.tsx` is #16118's file byte for byte (QUALITY rule 41). Its `solid` chip")
        b = out.index("\n\n**(3) Strict counts**")
        out = out[:a] + ("\n\n`atoms/Badge/Badge.tsx` is #16118's file byte for byte (QUALITY rule 41). Every chip keeps the legacy badge's `dark:` classes, and the `solid` and `destructive` chips keep raw `text-neutral-50` and `bg-red-500` "
                         "because `primary-foreground` (#18181B) and `destructive` (#7F1D1D) differ in `.dark`; its `TODO(tokens)` lines name both.") + out[b:]
    return out
_lint37_b = lint37
def lint37(k):
    out = _lint37_b(k)
    if k == 3:
        a = out.find("\n\nStrict hits on head lines that no moved file carried: the chip's")
        if a >= 0: out = out[:a]
    return out
POST.append(("`focus:ring-neutral-950` → `focus:ring-focus`; the legacy badge's `dark:` classes, which the chip variants do not carry, are passed at the call site (QUALITY rule 43 above).",
             "`focus:ring-neutral-950` → `focus:ring-focus`; the legacy badge's `dark:` classes are kept in the chip classes (QUALITY rule 43 above)."))
drop(3, "**Rule 31 scanner hit on `atoms/Badge`")
POST += [("`chipBase` + `chipVariants.secondary`", "`chipLayout` + `chipSizes.default` + `chipBehaviour` + `chipVariants.secondary`"),
         ("and `chipBase` + `secondary`'s are in table 2", "and the chip's (`chipLayout`, `chipSizes.default`, `chipBehaviour`, `secondary`) are in table 2")]

# ===== Cursor gate #16136 findings 4-5 (run1101) =====
def xpr(k):
    if k not in (1, 3): return ""
    pr = {1: "16136", 3: "16139"}[k]
    t = subprocess.run(["python3", "-I", f"{E}/variants_xpr.py", pr], capture_output=True, text=True).stdout.strip()
    rows = [l for l in t.split("\n")]
    body = "\n".join(rows)
    note = ("\n\nThe two exact duplicates are #16092's `legacy-default` / `legacy-icon` sizes against #16110's `compact` / `compact-icon` (and `legacy-sm` / `compact-sm` differ only by `rounded-md`). "
            "This PR carries #16092's `atoms/Button` files byte for byte (QUALITY rule 41) and adds no Button name of its own; which family stays is #16092's and #16110's to settle (QUALITY rule 44), raised with the orchestrator."
            if "h-9 w-9" in t and "OK 0 clashes" not in t else "")
    return ("#### Rules 35/44: Text, Button and Badge names across open PRs\n\n"
            f"[`variants_xpr.py`]({{TREE}}/tools/variants_xpr.py): every variant, tone and size each open PR adds or changes against its merge-base with `dev`, for `atoms/Text/helpers.ts`, `atoms/Button/helpers.ts` and `atoms/Badge/Badge.tsx`; the rows are the ones this PR defines, with every PR that defines the same name and string. "
            "A clash is one name with two strings or one string under two names.\n\n" + body + note)
_extra_x = extra
def extra(k):
    x = xpr(k)
    return _extra_x(k) + ("\n\n" + x if x else "")
POST.append(("`legacyButtonVariants` `legacy-outline` + size `default` (`h-9 px-4 py-2`)", "`legacyButtonVariants` `legacy-outline` + size `legacy-default` (`h-9 px-4 py-2`)"))

# ===== Cursor gate #16140 findings 1-2 and the rule-44 ruling (run1128) =====
PRS[4]["deviations"] = [d for d in PRS[4]["deviations"] if not d.startswith("**`data-slot` on the popover triggers:**")] + [
    "**`data-slot` from `molecules/Popover`:** `BlockMenu` and `NewSaveControl` now render the molecule's parts, which carry DS7's slots on `dev` (`src/components/molecules/Popover/Popover.tsx`): "
    "`data-slot=\"popover-trigger\"` on each trigger (`:14`) and `data-slot=\"popover-popup\"` on each `PopoverContent` (`:35`); the legacy popover rendered neither. `DateInput` and `DateTimeInput` pass their own "
    "`date-input-popup` / `date-time-input-popup` slots (DS7-1, below) and their trigger is the Button's own slot, so nothing changes there. Nothing in `src` targets `popover-trigger` or `popover-popup` "
    "(styles, tests, tutorial and Playwright selectors use `data-id`). Attributes only: the element, its classes, its Tab order and its pixels are the same."]
POST_K.setdefault(4, []).append(("the DOM change is the `data-slot` attributes under Deviations", "the DOM change is the `data-slot` attributes under Deviations (`popover-trigger` and `popover-popup` on `BlockMenu` and `NewSaveControl`)"))
POST_K[4].append(("markup is unchanged apart from the `data-slot` attributes listed under Deviations", "markup is unchanged apart from the `data-slot` attributes listed under Deviations (`popover-trigger`, `popover-popup`)"))

_xpr_a = xpr
def xpr(k):
    out = _xpr_a(k)
    lines = out.split("\n"); kept = []; resolved = 0
    for l in lines:
        if (l.startswith("string `h-9 px-4 py-2`") or l.startswith("string `h-9 w-9`")) and "compact" in l:
            resolved += 1; continue
        kept.append(l)
    out = "\n".join(kept)
    if resolved:
        out = out.replace("\n\nThe two exact duplicates are", "\n\nResolved, not open: #16092's `legacy-default` / `legacy-icon` sizes have the same strings as #16110's `compact` / `compact-icon`; the orchestrator ruled #16092's `legacy-*` family canonical (QUALITY rule 44, run1101) and #16110 is to adopt it. Recorded for reference: the two exact duplicates are")
        out = out.replace("which family stays is #16092's and #16110's to settle (QUALITY rule 44), raised with the orchestrator.", "resolved: #16110 to adopt `legacy-*`.")
        if not re.search(r"(?m)^(name|string) `", out.split("Resolved, not open")[0].split("| --- |")[-1]):
            out = out.replace("\n\nResolved, not open", "\n\nOK 0 clashes\n\nResolved, not open", 1) if "OK 0 clashes" not in out else out
    return out

# ===== #16092's helpers.ts at 520bc19e6 (run1128) =====
COUNT_NOTE[1] = COUNT_NOTE[1].replace("+23 `no-raw-colors` in `src/components/atoms/Button/helpers.ts`", "+22 `no-raw-colors` in `src/components/atoms/Button/helpers.ts`")
_SWAPS[1].insert(2, ("`text-neutral-50`", "`text-destructive-foreground`", "`legacy-destructive` (#16092's `520bc19e6`; no call site in this PR)", "#FAFAFA", "#FAFAFA", "#FAFAFA (`250 250 250`, the same)", "`dark:text-neutral-50` (kept on both)", "foreground", "text on a destructive fill"))
POST_K.setdefault(1, []).append(("#FAFAFA is shadcn's `background` (and its `*-foreground` pairs), the page background; the `legacy-*` Button uses it only as `text-neutral-50` on dark fills and in its `dark:` classes, all kept raw.",
    "#FAFAFA is `destructive-foreground` in `:root` and `.dark` alike, so `legacy-destructive` uses it; `primary-foreground` (#18181B in `.dark`) and `background` (#09090B in `.dark`) do not hold it in both modes, so `legacy-default` keeps raw `text-neutral-50` (QUALITY rule 43; SECRT-3154 pair, Deviations)."))
PRS[1]["deviations"] = PRS[1]["deviations"] + ["**Rule 13 pair for SECRT-3154:** `legacy-default`'s `text-neutral-50` #FAFAFA ↔ role `primary-foreground`, which is #FAFAFA in `:root` but #18181B in `.dark` (text on the light `.dark` primary fill), so the raw class stays; `atoms/Button/helpers.ts`'s `TODO(tokens)` says so (#16092's `520bc19e6` wording)."]
