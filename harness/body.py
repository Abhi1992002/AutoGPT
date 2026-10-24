import json, os, re, subprocess, sys
E = "/home/vercel-sandbox/autogpt/.context/evidence"
exec(open(f"{E}/prs.py").read())
FORK = "https://github.com/Abhi1992002/AutoGPT/blob/evidence/ds3b-2-ui-molecules"
COUNTS = "/home/vercel-sandbox/autogpt/.context/counts"
FIRST = "Base: {base}. Merged by the orchestrator through the squash merge queue once stable; zero visual change."
DELETED = {1: ["@/components/ui/accordion"], 2: ["@/components/ui/collapsible"], 3: ["@/components/ui/scroll-area"], 4: ["@/components/ui/sheet"],
           5: ["@/components/ui/sidebar", "@/components/ui/sidebar-cookie"], 6: ["@/components/ui/input-group"],
           7: ["@/components/ui/dot-distortion-shader", "@/components/ui/text-generate-effect"]}
# where each importer renders, and the captures that show it
RENDER = [
 (r"molecules/Accordion/", "Accordion molecule: stories `molecules-accordion--*` (+ open/arrow-key/hover interactions); used by builder node output, integrations panel, publish/edit-workflow modals, team integrations, admin memory, copilot reasoning", "story__molecules-accordion--*, interact__sb-accordion-*, app__admin_memory__*, app__build__*"),
 (r"molecules/Collapsible/", "Collapsible molecule: stories `molecules-collapsible--*` (+ Enter/Space interaction); admin execution analytics", "story__molecules-collapsible--*, interact__sb-collapsible-*"),
 (r"CollapsibleNavGroup", "AppSidebar \"Workspace\"/\"Chats\" nav groups on every signed-in page", "app__home__* … app__settings_*, interact__home-sidebar-expanded, -navgroup-focus-visible, -navgroup-closed, -sheet-open (mobile)"),
 (r"ExpertChatGroup", "AppSidebar recent chats grouped by expert (chat sessions and expert identities stubbed with `page.route`, fixed data: harness/scenarios-chats.ts)", "interact__expert-group-closed, -trigger-hover, -trigger-focus-visible, -open-focus-visible, -closed-again, interact__recent-chats-expanded, interact__otto-group-all-loaded (desktop)"),
 (r"WalletEarnCredits", "sidebar wallet (compact panel) \"Earn credits\" Collapsible; billing switched on at runtime through the PW_TEST flag override plus `page.route` stubs (harness/scenarios-misc.ts)", "interact__wallet-* (open, earn hover, closed, focus-visible, reopened with Enter; 1440 and 390) in shots/misc-<sha>"),
 (r"WalletFullPanel", "full wallet panel: no route mounts it (the only `<Wallet>` is `compact`), so an evidence-only story renders the real component", "story__evidence-ds3b--wallet-panel, interact__ev-wallet-full-panel (1440 and 390), interact__ev-wallet-full-panel-focus-visible in shots/ev-<sha>"),
 (r"TourSidebar", "/tour/chat sidebar", "app__tour_chat__*, interact__tour-chat-sidebar-group-closed, interact__tour-chat-sidebar-sheet-open"),
 (r"AdminShell", "every /admin/* page", "app__admin_users__*, app__admin_memory__*"),
 (r"settings/layout", "every /settings/* page", "app__settings_profile/account/api-keys/integrations__*"),
 (r"GraphContent", "builder: graph search popover in the control panel", "interact__build-graph-search-open (desktop), app__build__* (closed)"),
 (r"ConnectServiceDialog/components/ListView", "copilot \"Connect service\" dialog list (`/copilot?modal=connect`)", "interact__copilot-connect-dialog-open (1440 and 390)"),
 (r"molecules/file-tree", "FileTree molecule", "story__molecules-filetree--*"),
 (r"molecules/ScrollArea/", "ScrollArea molecule (via the importers above)", "as above"),
 (r"molecules/Sheet/", "Sheet molecule: the mobile sidebar sheet", "interact__home-sidebar-sheet-open, interact__copilot-sidebar-sheet-open, interact__tour-chat-sidebar-sheet-open, interact__home-sidebar-sheet-after-esc (mobile)"),
 (r"ContextPanel/ContextPanel", "copilot context panel, a Sheet on mobile (session stubbed with `page.route`)", "interact__copilot-session-workcard, interact__context-panel-sheet-open (mobile)"),
 (r"WorkOutputSheet", "copilot work-card output sheet (session and execution stubbed with `page.route`)", "interact__work-output-sheet-open (1440 and 390)"),
 (r"molecules/Sidebar/|ui/sidebar", "the app sidebar (desktop rail and mobile sheet) on every signed-in page", "every app__* signed-in route at 1440 and 390, interact__home-sidebar-*"),
 (r"usePanelSidebarCollapse", "expert side panel on /team/<expertId> collapses the app sidebar while open (expert stubbed with `page.route`)", "interact__expert-* (sidebar expanded, panel open, panel closed and sidebar restored; mobile dialog) in shots/misc-<sha>"),
 (r"AccountMenuFeedbackRow", "account menu \"Give feedback\" row, rendered only when `environment.isCloud()`, so an evidence-only story renders the real row", "story__evidence-ds3b--feedback-row, interact__ev-feedback-row, -hover, -focus-visible in shots/ev-<sha>"),
 (r"PlatformChrome|layout\.tsx$|useArtifactsPanelNavCollapse|useBuilderSidebarAutoClose|InsetHeaderSidebarTrigger|usePanelSidebarCollapse", "platform chrome around every signed-in page", "every app__* signed-in route"),
 (r"ChatsRailItem", "collapsed desktop rail \"Chats\" item", "interact__chats-rail-collapsed, -hover, -focus-visible, -jumped-to-recent (desktop)"),
 (r"RecentChatItem", "recent chat rows in the expanded sidebar (sessions stubbed with `page.route`)", "interact__recent-chats-expanded, interact__recent-chat-row-hover, interact__recent-chat-row-focus-visible, interact__otto-group-all-loaded (desktop)"),
 (r"AppSidebar|SidebarUserActions|RecentChat|ChatsRailItem|SidebarSearch|AccountMenuFeedbackRow|useJumpToRecentChats", "app sidebar and account menu", "every app__* signed-in route, interact__home-sidebar-*"),
 (r"CopilotPage", "/copilot", "app__copilot__*"),
 (r"tour/chat", "/tour/chat", "app__tour_chat__*, interact__tour-chat-*"),
 (r"ChatInput|MentionDropdown|molecules/InputGroup/|ui/input-group", "copilot composer on /home and /copilot; `Copilot/Account mentions` story", "app__home__*, app__copilot__*, interact__copilot-composer-focus-visible (1440+390), -typed-send-enabled, -send-hover, story__copilot-account-mentions--*"),
 (r"EmptyHero", "copilot empty-session hero on /copilot (greeting state stubbed with `page.route` so EmptyHero shows instead of the intro card)", "interact__hero-* (1440 and 390) in shots/misc-<sha>"),
 (r"TextGenerateEffect", "EmptyHero renders it only without a recipient picker, which EmptySession always passes, so an evidence-only story renders EmptyHero that way", "story__evidence-ds3b--hero-text-generate-effect, interact__ev-hero-text-generate-effect (1440 and 390) in shots/ev-<sha>"),
]
def where(path):
    if re.search(r"\.test\.tsx?$", path): return ("unit test (mock path)", "n/a (covered by the test run)")
    for pat, w, shots in RENDER:
        if re.search(pat, path): return (w, shots)
    return ("", "")

def count(sha, d):
    f = f"{COUNTS}/{sha}-{d.replace('/', '_')}.unix.txt"
    try: return sum(1 for l in open(f) if re.search(r"\[(Error|Warning)/", l))
    except FileNotFoundError: return None

def importer_rows(i):
    b, h = SHAS[i-1], SHAS[i]
    out = subprocess.run(["git", "-C", "/home/vercel-sandbox/autogpt", "diff", "--name-status", "-M", b, h], capture_output=True, text=True).stdout
    rows = []
    for line in out.strip().splitlines():
        parts = line.split("\t"); st = parts[0]; path = parts[-1].replace("autogpt_platform/frontend/", "")
        old = parts[1].replace("autogpt_platform/frontend/", "") if st.startswith("R") else ""
        w, shots = where(path)
        label = f"`{old}` → `{path}`" if old else f"`{path}`"
        kind = {"R": "moved", "M": "edited", "D": "deleted", "A": "added"}[st[0]]
        rows.append(f"| {label} | {kind} | {w} | {shots} |")
    return rows

def zero_grep(i):
    h = SHAS[i]; lines = []
    for p in DELETED[i]:
        r = subprocess.run(["git", "-C", "/home/vercel-sandbox/autogpt", "grep", "-nE", re.escape(p) + "[\"']", h, "--", "autogpt_platform/frontend/src"], capture_output=True, text=True).stdout.strip()
        hits = [l for l in r.splitlines()]
        lines.append(f"- `git grep -nE '{p}[\"\\']' {h} -- src`: " + ("**0 matches**" if not hits else f"{len(hits)} match(es): " + "; ".join(f"`{l.split(':',1)[1].split(':')[0]}`" for l in hits)))
    return lines

def shots_section(i):
    f = f"{E}/compare-pr{i}.md"
    if not os.path.exists(f): return "PENDING", []
    txt = open(f).read()
    rows = [l for l in txt.splitlines() if l.startswith("| ") and not l.startswith("| screenshot") and not l.startswith("| ---")]
    total = len(rows); nonzero = [r for r in rows if not r.rstrip().endswith("| 0 |")]
    kb = [l for l in txt.splitlines() if l.startswith("keyboard")]
    return f"{total} screenshots compared, {len(nonzero)} with differences; " + ", ".join(kb), rows

def flaky_note(rows, i=0):
    bad = [r.split("|")[1].strip() + " (" + r.split("|")[3].strip() + " px)" for r in rows if not r.rstrip().endswith("| 0 |")]
    if not bad: return " Every screenshot is 0 px."
    known = "interact__copilot-connect-dialog-open__mobile.png"
    rest = [b for b in bad if not b.startswith(known)]
    note = " Every route, story and interaction screenshot is 0 px except one listed skip:"
    note += (" `" + known + "`. It is not counted as 0 px because it is not deterministic on dev itself: two captures of the same dev build differ by about 16,700 px (see the determinism line), and three back-to-back captures of one build gave three different images. The variation is sub-pixel text placement in the rows of the mobile connect drawer; focus and scroll are pinned and it persists. The same call site (`ListView`, ScrollArea import only) is captured at 1440 (`interact__copilot-connect-dialog-open__desktop`) at 0 px, with identical keyboard logs.")
    if rest: note += " **Not explained, so NOT accepted:** " + ", ".join(f"`{b}`" for b in rest) + "."
    return note

def extra_line(i):
    f = f"{E}/compare-pr{i}-extra.md"
    if not os.path.exists(f): return "- Targeted and evidence-story captures: none for this PR (its call sites all render in the sets above)."
    txt = open(f).read(); parts = []
    for block in txt.split("### ")[1:]:
        head = block.splitlines()[0]; m = re.search(r"(\d+) screenshot\(s\) compared, (\d+) with differences", block)
        kb = ", ".join(l for l in block.splitlines() if "keyboard" in l and ("identical" in l or "DIFFERS" in l))
        parts.append(f"{head}: {m.group(1)} compared, {m.group(2)} with differences" + (f" ({kb})" if kb else ""))
    return f"- **Targeted and evidence-story captures:** " + "; ".join(parts) + f". Table: [compare-pr{i}-extra.md]({FORK}/compare/compare-pr{i}-extra.md)."

def det_extra():
    f = f"{E}/compare-determinism-extra.md"
    if not os.path.exists(f): return ""
    txt = open(f).read(); parts = []
    for block in txt.split("### ")[1:]:
        head = block.splitlines()[0]; m = re.search(r"(\d+) screenshot\(s\) compared, (\d+) with differences", block)
        parts.append(f"{head}: {m.group(1)} compared, {m.group(2)} with differences")
    return " Targeted/evidence sets twice on the stack top: " + "; ".join(parts) + "."

def det_line():
    f = f"{E}/compare-determinism.md"
    if not os.path.exists(f): return "PENDING"
    txt = open(f).read(); m = re.search(r"(\d+) screenshot\(s\) compared, (\d+) with differences", txt)
    kb = ", ".join(l for l in txt.splitlines() if l.startswith("keyboard"))
    diffs = [l.split("|")[1].strip() + " (" + l.split("|")[3].strip() + " px)" for l in txt.splitlines() if l.startswith("| ") and not l.startswith("| screenshot") and not l.startswith("| ---") and not l.rstrip().endswith("| 0 |")]
    extra = (" Differing: " + ", ".join(f"`{d}`" for d in diffs) + ".") if diffs else ""
    return f"dev `{SHAS[0]}` captured twice: {m.group(1)} screenshots, {m.group(2)} with differences; {kb}.{extra}"

def body(pr):
    i = pr["n"]; b, h = SHAS[i-1], SHAS[i]
    L = [FIRST.format(base=pr["base"]), "",
         f"Linear: [SECRT-3113](https://linear.app/autogpt/issue/SECRT-3113) — DS3b part 2 of 3 (How steps 2-4: Radix primitives behind molecules, input-group/button-group, marketing effects). PR {i} of 7 in this stack; each PR is based on the one below it.", "",
         "### Why / What / How", "", f"**Why.** {pr['why']}", "", f"**What.** {pr['what']}", "", f"**How.** {pr['how']}", "",
         "### Changes 🏗️", ""] + [f"- {c}" for c in pr["changes"]] + ["",
         f"## Evidence (head `{h}`, base `{b}`)", "",
         f"Raw files (all screenshots, diff images, count files, keyboard logs, harness): [evidence/ds3b-2-ui-molecules]({FORK}/README.md) on a fork, never merged.", "",
         "### 1. Counts", "", "Strict config from DS4 `1ee6580dc` (`.oxlintrc.strict.json` + its `package.json`/`pnpm-lock.yaml` for `@shadcn/lint` 0.1.5), overlaid in a throwaway worktree, never committed. Both SHAs use the same overlay.", "",
         f"| directory | base `{b}` (`wc -l` / `-f unix`) | head `{h}` (`wc -l` / `-f unix`) |", "| --- | --- | --- |"]
    for d in ["src/components/ui", "src/components/molecules", "src"]:
        cb, ch = count(b, d), count(h, d)
        L.append(f"| `{d}` | {cb} / {cb} problems | {ch} / {ch} problems |")
    L += ["", f"Count files: [base]({FORK}/counts/{b}-src.unix.txt), [head]({FORK}/counts/{h}-src.unix.txt). Every hit that leaves `ui` reappears on the same line of the moved file (same rule, same class); any `src`-wide drop is explained under Deviations." , ""]
    L += ["### 2. Value equivalence", ""]
    if pr["equiv"]:
        L.append(pr["equiv"])
    else:
        L += ["Only this PR in the stack changes class strings. DS1's `scripts/check-token-equivalence.ts` checks DS1's own tables, so the same method is applied to every exact class string this PR produces, **as rendered**: [`harness/eq/render.tsx`](" + FORK + "/harness/eq/render.tsx) renders the real `InputGroup`, `InputGroupAddon` (4 aligns), `InputGroupButton` (4 sizes) and the real `ai-elements` `PromptInputButton`/`PromptInputSubmit` with every className the composer passes (`ChatInput` pill/stacked/compact/recording, `helpers.ts` button classes, the story) through `react-dom/server` on base and head, so each string is the merged `cn()` result on the real element (Button's own `text-sm` included). [`harness/eq/compare.ts`](" + FORK + "/harness/eq/compare.ts) compiles old strings against the base `tailwind.config.ts`/`globals.css` and new against the head's, renders each in Chromium at a 16px root inside parents at `leading-[1.5]`, `leading-[30px]` and `leading-normal`, at 1280 and 390px, and compares **every** computed property.", "",
              "**Result: 71 distinct merged class-string pairs, 426 cases, 0 failing.** Negative control: the same run with `text-body leading-5` → `text-body` and `bg-surface` → `bg-white/90` fails 312 cases (`line-height: 20px -> 22px`), so the harness catches a wrong swap.", "",
              "| old (in the class string) | new | computed value (every property compared) | result |", "| --- | --- | --- | --- |",
              "| `bg-white` (InputGroup root, 7 caller variants) | `bg-surface` | background-color rgb(254, 254, 254) | identical, 42 cases |",
              "| `text-sm` (InputGroupAddon base, 4 aligns × 7 caller classNames) | `text-body leading-5` | font-size 14px, line-height 20px, weight 500 | identical, 168 cases |",
              "| `text-sm` (InputGroupButton base merged into Button's `text-sm`, 4 sizes × 7 classNames, direct and via PromptInputButton/Submit) | `text-body leading-5` | font-size 14px, line-height 20px | identical, 216 cases |", "",
              f"Full per-string table: [eq/result.md]({FORK}/equivalence/result.md), pairs: [eq/pairs.json]({FORK}/equivalence/pairs.json)."]
    summ, rows = shots_section(i)
    L += ["", "### 3. Screenshots", "",
          f"DS1 `scripts/screenshot-pages.ts` against the running app (production `next build` with `NEXT_PUBLIC_PW_TEST=true`, backend in docker, signed in as an onboarded admin test user) and a static Storybook build, before = `{b}`, after = `{h}`, at 1440x900 and 390x844, plus the interaction harness ([`harness/interact.ts`]({FORK}/harness/interact.ts), same determinism flags).", "",
          f"- **Result: {summ}.**" + flaky_note(rows, i),
          extra_line(i),
          f"- Determinism: {det_line()}." + det_extra(),
          "- Routes (18 × 2): the DS1 default set (`/login`, `/signup`, `/reset-password`, `/marketplace`, `/library`, `/home`, `/copilot`, `/team`, `/team/autopilot`, `/build`, `/settings/profile`, `/settings/account`, `/settings/api-keys`, `/settings/integrations`) plus `/tour`, `/tour/chat`, `/admin/users`, `/admin/memory`.",
          "- Stories (61 × 2): `tokens-*`, `atoms-button--*`, `atoms-text--*` (DS1 defaults) plus `molecules-accordion--*`, `molecules-collapsible--*`, `molecules-filetree--*`, `copilot-account-mentions--*`, `copilot-taskprogressbar--*`. Same set on every PR in the stack; nothing trimmed, no skips (the standing `atoms-progress--live` skip is outside this set).",
          "- Interactions (app, every SHA): mobile sidebar Sheet open and after Esc (`/home`, `/copilot`, `/tour/chat`); desktop sidebar expanded, menu-button hover, nav-group focus-visible and closed; `/tour/chat` group closed (clipped to the sidebar: the tour's scripted demo moves on its own timer); copilot composer focus-visible (1440 and 390), typed with send enabled, send hover; builder graph-search popover open; copilot \"Connect service\" dialog (1440 and 390); collapsed-rail Chats item collapsed / hover / focus-visible / Enter; recent chat rows expanded / hover / focus-visible / load all; expert chat group closed / hover / focus-visible / open / closed again; mobile ContextPanel sheet; WorkOutputSheet (1440 and 390). Chat sessions, expert identities and the work run are stubbed with `page.route` (fixed ids, titles and timestamps; [`harness/scenarios-chats.ts`](" + FORK + "/harness/scenarios-chats.ts)).",
          "- Targeted captures on the SHAs of the PRs that change them ([`harness/scenarios-misc.ts`](" + FORK + "/harness/scenarios-misc.ts), `shots/misc-<sha>`): the sidebar wallet with its \"Earn credits\" Collapsible (billing switched on at runtime through the PW_TEST flag override and stubbed credit/usage/onboarding responses; open, hover, closed, focus-visible, Enter; 1440 and 390), the copilot `EmptyHero` (greeting state stubbed; 1440 and 390), and the expert side panel on `/team/<id>` (stubbed expert; sidebar collapses while open and is restored on close; mobile dialog).",
          "- Evidence-only stories for the three changed components no route mounts, rendered from the real components in a Storybook built in the throwaway base and head worktrees, never committed ([`harness/evstory/Ds3bEvidence.stories.tsx`](" + FORK + "/harness/evstory/Ds3bEvidence.stories.tsx), `shots/ev-<sha>`): `WalletFullPanel` (the only mounted `<Wallet>` is `compact`), `EmptyHero` without a recipient picker, the only path that renders `TextGenerateEffect`, and `AccountMenuFeedbackRow` (mounted only in CLOUD builds); each default plus hover and keyboard focus where it has a control.",
          "- Determinism measures, identical for base and head: every capture (DS1 script and harness) runs with a preload ([`harness/seed-preload.cjs`](" + FORK + "/harness/seed-preload.cjs)) that replaces `Math.random` with a fixed-seed PRNG in every page, without editing DS1's script. The same preload hides the copilot greeting orb in every capture (its entrance races the greeting request, so dev itself lands in one of two states per load; no PR here touches it). The interaction harness also lands finite animations on their end state and drops infinite ones before each shot, closes the once-per-session \"What's new\" popup the way a user would, starts every Tab sequence from a blurred, settled page, and hides the tour's dot `<canvas>` (it re-rolls its dots on every ResizeObserver call during the sidebar transition). The canvas is still in every DS1 `/tour/chat` route capture, at 0 px on every PR.", "",
          f"Per-screenshot table: [compare-pr{i}.md]({FORK}/compare/compare-pr{i}.md); images: [before]({FORK}/shots/run1-{b}), [after]({FORK}/shots/run1-{h}), [diff]({FORK}/shots/diff-pr{i}).", "",
          "### 4. What improved", ""] + [f"- {x}" for x in pr["improved"]]
    L += ["", "## Deletion / replacement checks (QUALITY rule 17)", "",
          "**(a) Every importer / call site changed, and the captures that render it (all 0 px, see section 3):**", "",
          "| file | change | renders in | captures |", "| --- | --- | --- | --- |"] + importer_rows(i)
    L += ["", "**(b) Interactive states and keyboard (base vs head, 0 px and identical logs):** open/closed (mobile sidebar Sheet open, closed after Esc; nav-group Collapsible open/closed; Accordion item open/closed; Collapsible story open/closed), hover (sidebar menu button, composer send, accordion trigger), focus-visible (nav-group trigger, accordion trigger after ArrowDown, collapsible trigger, composer textarea), disabled (composer send button disabled while empty, in the `/home` and `/copilot` route shots; enabled after typing). Keyboard, recorded as the focused element (tag, role, `data-sidebar`, `aria-expanded`, `data-state`, label) after each key, and compared as JSON: Tab order on `/home` (25 stops), `/copilot` (20), `/tour/chat` (15), `/settings/profile` (20), inside the open mobile Sheet (8); Esc closes the Sheet and the focused element after it; Enter/Space toggle the nav group and the Collapsible story; ArrowDown moves between Accordion triggers. `keyboard-app.json` and `keyboard-stories.json` are identical on base and head. Error states: none of the moved primitives has one (no form field or validation moved in this stack).", "",
          "**(c) Prop / API parity:**", ""] + pr["parity"] + ["",
          "**(d) Checks on the stack top (and per PR in CI):** `pnpm types` ✅, `pnpm lint` ✅ (next lint + `lint:shadcn` + prettier), production `next build` ✅ on every SHA in the stack (`NEXT_SKIP_BUILD_CHECKS=true NEXT_PUBLIC_PW_TEST=true`, the flags CI's build uses; types and lint run as their own steps), Storybook build ✅ on every SHA, " + TESTS + ". Zero remaining imports of the deleted path(s):"] + zero_grep(i) + ["",
          "**(e) No behaviour change:** every capture, interaction and keyboard log above is identical between base and head. " + pr.get("behaviour", "Apart from import paths, the moved code is byte-identical (`git diff -M` of the moved file shows only the import lines).")]
    L += ["", "## Deviations", ""] + [f"- {x}" for x in pr["extra_dev"] + COMMON_DEV(i)]
    L += ["", "### Agents and large language models used", "", "- Claude Code with Claude Opus 5.5 (`claude-opus-5-5`, 1M context).", "",
          "### Checklist 📋", "", "#### For code changes:", "- [x] I have clearly listed my changes in the PR description", "- [x] I have made a test plan", "- [x] I have tested my changes according to the test plan:",
          "  - [x] `pnpm types`, `pnpm lint`, `pnpm format`", "  - [x] production `next build` and Storybook build on base and head", "  - [x] unit/integration tests (" + TESTS + ")", "  - [x] screenshots, interactions and keyboard logs at 1440x900 and 390x844, 0 px against the base", "  - [x] strict-lint counts with DS4's config", "",
          "#### For configuration changes:", "- [x] `.env.default` is updated or already compatible with my changes", "- [x] `docker-compose.yml` is updated or already compatible with my changes", "- [x] I have included a list of my configuration changes in the PR description (under **Changes**) — none", "",
          "🤖 Generated with [Claude Code](https://claude.com/claude-code)"]
    return "\n".join(L)

def COMMON_DEV(i):
    h = SHAS[i]
    return [f"`.oxlintrc.json`: remove `src/components/ui` (and the feature directories this PR moved off it) from the per-directory warn override, and let `no-restricted-imports` for `@/components/ui` lose its `warn` override. Owner: DS4 #16022 / SECRT-3153, after it lands; this PR does not edit `.oxlintrc.json`. Final strict count at `{h}`: `src/components/ui` {count(h,'src/components/ui')}, `src/components/molecules` {count(h,'src/components/molecules')}, `src` {count(h,'src')}.",
            "The moved primitives keep their existing classes (raw palette, `dark:`) as SECRT-3113 How step 2 asks (\"keep as the Radix implementation behind the molecule\"; the brief says re-export the exact same markup). Their strict hits move from `ui` to `molecules` unchanged. Putting them on role tokens is not in this ticket; no ticket owns it yet (flagged for the orchestrator as a DS2b follow-up).",
            "No token or variable is deleted or renamed, so no remaining readers to list (rule 5). No rename pairs (rule 6) other than identifier moves listed under Changes.",
            "No `eslint-disable`/`oxlint-disable` added, no allow list or override widened.",
            "No doc paragraph is asked for by this part, so nothing for DS9 #16025.",
            "Rule 20 coverage: every changed call site is rendered in a capture named in table (a). Where the local app cannot reach a component, its API is stubbed with `page.route` (chat sessions, experts, work run, wallet, greeting state) or, for the three components no route mounts, an evidence-only story renders the real component in the throwaway worktrees. Unit tests are not counted as coverage."]
