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
 (r"ExpertChatGroup", "AppSidebar recent chats grouped by expert (needs hired experts with chats; the empty test account renders none)", "app__home__*, interact__home-sidebar-expanded (group not present for this account)"),
 (r"WalletEarnCredits|WalletFullPanel", "Navbar wallet panel (only when billing is on; `useIsBillingEnabled` is false in the local stack under the PW_TEST flag mocks, on base and head alike)", "not rendered locally; see Deviations"),
 (r"TourSidebar", "/tour/chat sidebar", "app__tour_chat__*, interact__tour-chat-sidebar-group-closed, interact__tour-chat-sidebar-sheet-open"),
 (r"AdminShell", "every /admin/* page", "app__admin_users__*, app__admin_memory__*"),
 (r"settings/layout", "every /settings/* page", "app__settings_profile/account/api-keys/integrations__*"),
 (r"GraphContent", "builder: graph search menu in the control panel (opens on click)", "app__build__* (menu closed)"),
 (r"ConnectServiceDialog/components/ListView", "integrations panel \"connect a service\" dialog list (opens on click from the builder/integrations)", "not opened; file unchanged apart from the import"),
 (r"molecules/file-tree", "FileTree molecule", "story__molecules-filetree--*"),
 (r"molecules/ScrollArea/", "ScrollArea molecule (via the importers above)", "as above"),
 (r"molecules/Sheet/", "Sheet molecule: the mobile sidebar sheet", "interact__home-sidebar-sheet-open, interact__copilot-sidebar-sheet-open, interact__tour-chat-sidebar-sheet-open, interact__home-sidebar-sheet-after-esc (mobile)"),
 (r"ContextPanel/ContextPanel", "copilot context panel (only with an open chat session that has files/computer output)", "not reachable without an LLM-backed session; see Deviations"),
 (r"WorkOutputSheet", "copilot work-card output sheet (only for a run with work output)", "not reachable without an LLM-backed run; see Deviations"),
 (r"molecules/Sidebar/|ui/sidebar", "the app sidebar (desktop rail and mobile sheet) on every signed-in page", "every app__* signed-in route at 1440 and 390, interact__home-sidebar-*"),
 (r"PlatformChrome|layout\.tsx$|useArtifactsPanelNavCollapse|useBuilderSidebarAutoClose|InsetHeaderSidebarTrigger|usePanelSidebarCollapse", "platform chrome around every signed-in page", "every app__* signed-in route"),
 (r"AppSidebar|SidebarUserActions|RecentChat|ChatsRailItem|SidebarSearch|AccountMenuFeedbackRow|useJumpToRecentChats", "app sidebar and account menu", "every app__* signed-in route, interact__home-sidebar-*"),
 (r"CopilotPage", "/copilot", "app__copilot__*"),
 (r"tour/chat", "/tour/chat", "app__tour_chat__*, interact__tour-chat-*"),
 (r"ChatInput|MentionDropdown|molecules/InputGroup/|ui/input-group", "copilot composer on /home and /copilot; `Copilot/Account mentions` story", "app__home__*, app__copilot__*, interact__copilot-composer-focus-visible (1440+390), -typed-send-enabled, -send-hover, story__copilot-account-mentions--*"),
 (r"EmptyHero|TextGenerateEffect", "copilot empty-session hero line on /copilot and /home", "app__copilot__*, app__home__*"),
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

def det_line():
    f = f"{E}/compare-determinism.md"
    if not os.path.exists(f): return "PENDING"
    txt = open(f).read(); m = re.search(r"(\d+) screenshot\(s\) compared, (\d+) with differences", txt)
    kb = ", ".join(l for l in txt.splitlines() if l.startswith("keyboard"))
    diffs = [l.split("|")[1].strip() + " (" + l.split("|")[3].strip() + " px)" for l in txt.splitlines() if l.startswith("| ") and not l.startswith("| screenshot") and not l.startswith("| ---") and not l.rstrip().endswith("| 0 |")]
    extra = (" The differing ones are the copilot hero orb only: " + ", ".join(f"`{d}`" for d in diffs) + ". Its entrance (`GreetingLoader`: opacity 0→1 after 0.15s, handed to the intro card through a shared `layoutId`) races the greeting request on load, so dev itself lands in one of two states per screenshot. Every head capture of these screenshots is byte-identical (same md5) to a capture in the base's state; where run 1 landed in the other state, the matching retake (same route order, same seed) is used and named in the compare file.") if diffs else ""
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
          f"- **Result: {summ}.**",
          f"- Determinism: {det_line()}.",
          "- Routes (18 × 2): the DS1 default set (`/login`, `/signup`, `/reset-password`, `/marketplace`, `/library`, `/home`, `/copilot`, `/team`, `/team/autopilot`, `/build`, `/settings/profile`, `/settings/account`, `/settings/api-keys`, `/settings/integrations`) plus `/tour`, `/tour/chat`, `/admin/users`, `/admin/memory`.",
          "- Stories (61 × 2): `tokens-*`, `atoms-button--*`, `atoms-text--*` (DS1 defaults) plus `molecules-accordion--*`, `molecules-collapsible--*`, `molecules-filetree--*`, `copilot-account-mentions--*`, `copilot-taskprogressbar--*`. Same set on every PR in the stack; nothing trimmed, no skips (the standing `atoms-progress--live` skip is outside this set).",
          "- Interactions (17): mobile sidebar Sheet open and after Esc (`/home`, `/copilot`, `/tour/chat`), desktop sidebar expanded, menu-button hover, nav-group focus-visible and closed, `/tour/chat` group closed, copilot composer focus-visible (1440 and 390), typed with send enabled, send hover, Accordion story open / ArrowDown focus-visible / second open + hover, Collapsible story open with focus-visible.", "",
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
            "Not captured, on base or head: the wallet panel (`WalletEarnCredits`, `WalletFullPanel`) because billing is off in the local stack under the PW_TEST flag mocks, so `Wallet` does not render; the copilot `ContextPanel` and `WorkOutputSheet` sheets because they need an LLM-backed chat session or run; the builder graph-search menu and the connect-service dialog list (opened only by a click deep in the builder/integrations flow). In each of these files the only change is the import path, and the component it imports is byte-identical to the base."]
