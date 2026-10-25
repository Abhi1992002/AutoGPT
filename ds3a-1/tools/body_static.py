import re
LEGACY_DEP = "SECRT-3112 (the DS3a parts that move `button` and `badge`)"

COMMON_DEV = [
    "**Warn override:** \"remove my directory from the warn override\" is not done here: `.oxlintrc.json`'s per-directory warn override is DS4's (#16022), held and not in dev, and `src/components/__legacy__` is not at 0 strict hits (count above). Owner: DS4 #16022 / SECRT-3153, after it lands.",
    "**Done-when not yet met (by design, part 1 of 4):** `src/components/__legacy__/ui` still exists and `grep -r '__legacy__' src` is not empty: `badge`, `button`, `checkbox`, `form`, `input`, `sheet`, `skeleton`, `tabs`, `textarea` remain for the other DS3a parts (DS3a-4 already moved `dialog`, `select` and `table`: #16085-#16087). Owner: SECRT-3112.",
    "**Docs paragraph:** none asked for by this ticket (DS9 #16025 owns `docs/engineering/design-system.md`).",
    "**Renames:** none. No token, variable or colour role added, renamed or deleted (rule 5/6 n/a).",
    "**Suppressions:** none added; no allow list or warn override widened (rule 9).",
]

PRS = {
1: dict(
 title="refactor(frontend): move collapsible, carousel and pagination-controls off __legacy__/ui (DS3a-1, 1/8)",
 branch="abhi/drop-legacy-ui-small-primitives",
 prims="`collapsible`, `carousel`, `pagination-controls`",
 why="`src/components/__legacy__/ui` holds old shadcn primitives that AGENTS.md says never to import. This PR removes the three smallest (1, 1 and 2 importers).",
 what="""- `molecules/Collapsible` imported the legacy `collapsible`, which was only three aliases of `@radix-ui/react-collapsible`; it now uses Radix directly (same components, same DOM).
- `carousel` (1 importer, the marketplace's mobile workflow strip) becomes `molecules/Carousel` with the three parts in use (`Carousel`, `CarouselContent`, `CarouselItem`), unchanged markup and keyboard handling. `CarouselPrevious`, `CarouselNext` and `CarouselIndicator` had no importer and are not carried over.
- `pagination-controls` (2 admin importers) becomes `molecules/PaginationControls` at today's markup; its `text-sm` label is `text-body leading-5` (14px/20px, same value).
- The three legacy files are deleted.""",
 importers=[
  ("`molecules/Collapsible/Collapsible.tsx`", "`__legacy__/ui/collapsible` → `@radix-ui/react-collapsible`", "stories `molecules-collapsible--*` (3), `/build` (not rendered) "),
  ("`marketplace/components/AgentsSection/AgentsSection.tsx`", "`__legacy__/ui/carousel` → `molecules/Carousel/Carousel`", "`/marketplace` at 390x844 (carousel is `md:hidden`), `/marketplace/creator/*`, `/marketplace/agent/*`"),
  ("`admin/marketplace/components/AdminAgentsDataTable.tsx`", "`__legacy__/ui/pagination-controls` → `molecules/PaginationControls/PaginationControls`", "`/admin/marketplace`"),
  ("`admin/spending/components/AdminUserGrantHistory.tsx`", "same", "`/admin/spending`"),
 ],
 parity="""| component | used props (default) | ref | DOM tag | role / aria | handlers | old → new |
| --- | --- | --- | --- | --- | --- | --- |
| Collapsible Root/Trigger/Content | open, onOpenChange, className | Radix | div / button / div | Radix `aria-expanded`, `aria-controls`, `data-state` | Radix | identical: the legacy file re-exported these very components |
| `Carousel` | className, opts `{loop:true}`; orientation (`horizontal`), setApi, plugins kept | not forwarded (no caller passes one; legacy forwarded to the root div) | div | `role="region"` `aria-roledescription="carousel"` | `onKeyDownCapture` ArrowLeft/ArrowRight → embla prev/next (`isKey`) | same tag, attributes, handler |
| `CarouselContent` | className | embla viewport ref on the outer div (as before); inner div ref not forwarded (no caller) | div.overflow-hidden > div.flex | none | none | same |
| `CarouselItem` | className, key | not forwarded (no caller) | div | `role="group"` `aria-roledescription="slide"` | none | same |
| `PaginationControls` | currentPage, totalPages, pathParam (`"page"`) | none (none before) | div > button, span, button | none | Previous/Next → `router.push(?page=n)`, disabled at the ends | same; span `text-sm` → `text-body leading-5` |
| removed: `CarouselPrevious`, `CarouselNext`, `CarouselIndicator`, `canScrollPrev/Next` state | - | - | - | - | - | 0 importers (`grep` below); the state fed only those buttons |""",
 todos=[],
 deviations=[
  f"**Legacy dependency kept inside a design-system file:** `molecules/PaginationControls` still renders the legacy `Button` (`variant=\"outline\"`): `atoms/Button` has no variant at that look, and the legacy `button` primitive is a later DS3a part. Owner: {LEGACY_DEP}.",
  "**New design-system components without a story:** `molecules/Carousel`, `molecules/PaginationControls`. A story has no base capture to diff against; follow-up when Storybook coverage for these lands (SECRT-3112).",
 ],
 improved=["Three legacy primitives gone; the marketplace carousel and admin pagination now come from `molecules/`, and `molecules/Collapsible` no longer reaches into `__legacy__`.",
           "The unused carousel buttons and indicator (and the legacy `Button` they pulled in) are gone instead of being carried forward."],
),
2: dict(
 title="refactor(frontend): move calendar, loading and scroll-area off __legacy__/ui (DS3a-1, 2/8)",
 branch="abhi/drop-legacy-ui-small-primitives-calendar-loading-scroll-area",
 prims="`calendar`, `loading`, `scroll-area`",
 why="Next three legacy primitives by importer count (2, 3 and 3).",
 what="""- `calendar` becomes `atoms/Calendar` at today's classes. The day button's classes were `cn(buttonVariants({variant:"ghost"}), ...)` from the legacy `Button`; they are written out as the exact string that call produced, so the atom no longer imports the legacy button. `text-sm` → `text-body leading-5`, `bg-white` → `bg-surface`, `hover/focus:text-neutral-50` → `text-primary-foreground` (#FAFAFA, a text role), dead `dark:` classes dropped. `atoms/DateInput` and `atoms/DateTimeInput` use it.
- `loading`: `atoms/LoadingSpinner` gains `variant="circle"`, which draws the legacy spinner's ring (lucide `loader-circle`, `M21 12a9 9 0 1 1-6.219-8.56`, round caps, stroke 2) as icon data through the `Icon` atom. The three importers use it with `aria-hidden="true"` (what lucide rendered); the reset-password Suspense fallback writes `LoadingBox`'s wrapper div inline.
- `scroll-area` becomes `molecules/ScrollArea` (identical code; `ScrollBar` is no longer exported, 0 importers).
- The three legacy files are deleted.""",
 importers=[
  ("`atoms/DateInput/DateInput.tsx`", "`__legacy__/ui/calendar` → `atoms/Calendar/Calendar`", "stories `renderers-formrenderer-primitive-fields--date-field` (+ opened calendar, keyboard)"),
  ("`atoms/DateTimeInput/DateTimeInput.tsx`", "same", "story `renderers-formrenderer-primitive-fields--date-time-field` (+ opened calendar, keyboard)"),
  ("`build/components/MCPToolDialog.tsx`", "`loading` → `atoms/LoadingSpinner` `variant=\"circle\"`; `scroll-area` → `molecules/ScrollArea`", "MCP tool dialog (needs a reachable MCP server: not capturable here, see Deviations); glyph check"),
  ("`build/.../CustomNode/components/NodeExecutionBadge.tsx`", "`loading` → `atoms/LoadingSpinner` `variant=\"circle\"`", "a running node (no executor run in the capture): glyph check"),
  ("`reset-password/page.tsx`", "`LoadingBox` → inline wrapper + `LoadingSpinner variant=\"circle\"`", "`/reset-password` (fallback shows only while the page suspends): glyph check"),
  ("`build/.../NodeOutput/components/ViewMoreData.tsx`", "`scroll-area` → `molecules/ScrollArea`", "node output dialog (needs a run): unchanged code, see parity"),
  ("`build/components/BuilderActions/components/AgentOutputs/AgentOutputs.tsx`", "same", "`/build` (button, disabled without outputs)"),
 ],
 parity="""| component | used props (default) | ref | DOM tag | role / aria | handlers | old → new |
| --- | --- | --- | --- | --- | --- | --- |
| `Calendar` | every DayPicker prop passed through; showOutsideDays (`true`), captionLayout `dropdown`, start 1900-01 / end 2100-01, `components.Chevron`, `components.Dropdown` (`atoms/Select`'s `SelectPrimitives`, where DS3a-4 moved the legacy `select`) | none (none before) | DayPicker markup | DayPicker `role="grid"`, `aria-selected`, dropdown `combobox` | DayPicker; dropdown → synthetic `change` event | same code; class strings only (table 2) |
| `LoadingSpinner variant="circle"` vs legacy `LoadingSpinner` | className (`size-4` / `size-16`) | svg (HugeiconsIcon forwardRef; legacy lucide forwardRef) | svg > path | `aria-hidden="true"` on both | none | presentation attributes move (`stroke`/`stroke-width` also on the path, `width/height="1em"` overridden by the size class, no `lucide` class names); 114 rasterised renders 0 px and 0 aria differences (glyph check) |
| `LoadingBox` (reset-password fallback) | className `h-[80vh]` | none | div > svg | none | none | same div classes (`flex h-[80vh] items-center justify-center`), spinner `size-16` |
| `ScrollArea` | className, orientation (`vertical`) | Radix root | Radix ScrollArea | Radix | Radix | identical code |""",
 todos=["`atoms/Calendar`: `text-neutral-500` #737373, `bg-neutral-100` #F5F5F5, `hover:text-neutral-900`/`text-neutral-900` #171717, `bg-neutral-900` #171717, `text-neutral-100` #F5F5F5, `bg-neutral-700` #404040: no exact role; `text-[0.8rem]`: SECRT-3152 rare size",
        "`molecules/ScrollArea`: thumb `bg-neutral-200` #E5E5E5: no exact role"],
 deviations=[
  "**Calendar dropdown on the select primitives, not the `Select` atom:** `atoms/Calendar`'s month/year dropdown renders `atoms/Select/components/SelectPrimitives` (DS3a-4 #16086 moved the legacy `select` there), as on `dev`; the `atoms/Select` atom itself looks different, so switching to it is a visible change. Owner: SECRT-3112 follow-up.",
  "**Glyphs that are not Hugeicons, kept for 0 px:** the circle spinner ring (lucide `loader-circle` path, drawn through the `Icon` atom) and `atoms/Calendar`'s `@radix-ui/react-icons` chevrons. Swapping either for a Hugeicons glyph is a visible change and a design decision. Owner: SECRT-3112 follow-up / design.",
  "**Not capturable in this sandbox (covered by the glyph check and the parity table):** the MCP tool dialog (needs a reachable MCP server), `NodeExecutionBadge`'s running state and `ViewMoreData` (need an executor run), and the reset-password Suspense fallback (shows only while the page suspends).",
  "**New design-system components without a story:** `atoms/Calendar`, `molecules/ScrollArea` (the calendar is captured open through the FormRenderer date stories).",
 ],
 improved=["The calendar, scroll area and legacy spinner now live in `atoms/` and `molecules/`; the calendar no longer reaches into the legacy `Button`.",
           "`atoms/LoadingSpinner` covers both spinner shapes, so `lucide-react`'s `LoaderCircle` is no longer imported for it."],
),
3: dict(
 title="refactor(frontend): move multiselect and command off __legacy__/ui (DS3a-1, 3/8)",
 branch="abhi/drop-legacy-ui-small-primitives-multiselect-command",
 prims="`multiselect`, `command`",
 why="`command`'s only importer was the legacy `multiselect`; both go together.",
 what="""- `multiselect` becomes `molecules/MultiSelect` (same code); its test moves with it.
- The four cmdk pieces it uses (`Command`, `CommandList`, `CommandEmpty`, `CommandItem`) move beside it as `molecules/MultiSelect/components/Command.tsx`, an implementation detail. `CommandDialog` (which pulled in the dialog primitives), `CommandInput`, `CommandGroup`, `CommandSeparator` and `CommandShortcut` had no importer and are not carried over.
- `text-sm` → `text-body leading-5`, `text-xs` → `text-caption leading-4` (same values), `bg-white` → `bg-surface`, dead `dark:` classes dropped.
- The renderer widgets and their test mocks import the molecule. The two legacy files are deleted.""",
 importers=[
  ("`renderers/InputRenderer/base/standard/widgets/SelectInput/SelectWidget.tsx`", "`__legacy__/ui/multiselect` → `molecules/MultiSelect/MultiSelect`", "FormRenderer stories (enum arrays)"),
  ("`renderers/InputRenderer/custom/MultiSelectField/MultiSelectField.tsx`", "same", "story `renderers-formrenderer-complex-schemas--multi-select-field` (+ open list, keyboard)"),
  ("`renderers/InputRenderer/__tests__/FormRenderer.test.tsx`, `.../SelectInput/__tests__/SelectWidget.test.tsx`", "`vi.mock` path", "tests"),
  ("`__legacy__/ui/multiselect.tsx` (was the only `command` importer)", "→ `./components/Command`", "-"),
 ],
 parity="""| component | used props (default) | ref | DOM tag | role / aria | handlers | old → new |
| --- | --- | --- | --- | --- | --- | --- |
| `MultiSelector` + parts | values, onValuesChange, loop (`false`), dir, className, children | forwardRef (unchanged) | cmdk `div[cmdk-root]`, badges, `input[cmdk-input]`, list | cmdk `combobox`/`listbox`/`option`, remove buttons `aria-label="Remove … option"` | Backspace/Delete, Enter, Escape, ArrowLeft/Right (`isKey`), mousedown prevent, onSelect | identical code, class strings only |
| `Command`, `CommandList`, `CommandEmpty`, `CommandItem` | className + cmdk props | forwardRef | cmdk | cmdk | cmdk | identical, class strings only |
| removed: `CommandDialog`, `CommandInput`, `CommandGroup`, `CommandSeparator`, `CommandShortcut` | - | - | - | - | - | 0 importers |""",
 todos=["`Command`: `text-neutral-950` #0A0A0A is the `focus` role (a ring colour, not a text colour): listed for SECRT-3154",
        "`CommandItem`: `data-[selected=true]:bg-neutral-100` #F5F5F5, `data-[selected=true]:text-neutral-900` #171717: no exact role"],
 deviations=[
  f"**Legacy dependency kept:** `molecules/MultiSelect` still renders the legacy `Badge` (`atoms/Badge` looks different). Owner: {LEGACY_DEP}.",
  "**Glyphs that are not Hugeicons, kept for 0 px:** lucide `X` and `Check` in the multiselect. Owner: SECRT-3112 follow-up / design.",
  "**Rule 13 pair for SECRT-3154:** `text-neutral-950` #0A0A0A ↔ role `focus` (ring kind).",
 ],
 improved=["The multiselect is a molecule and the legacy `command` primitive is gone, with it five unused cmdk wrappers and a dependency on the dialog primitives.",
           "The multiselect's test now lives with the molecule it tests."],
),
4: dict(
 title="refactor(frontend): move popover importers onto molecules/Popover (DS3a-1, 4/8)",
 branch="abhi/drop-legacy-ui-small-primitives-popover",
 prims="`popover`",
 why="`molecules/Popover` already exists; the legacy one had 4 importers left.",
 what="""- The four callers import `molecules/Popover`. Its `PopoverContent` differs from the legacy one in three values (corner `rounded-lg` 8px vs `rounded-medium` 12px, border `border-base` #DADADC vs `neutral-200` #E5E5E5, text `foreground-strong` #2C2C30 vs `neutral-950` #0A0A0A), so each caller passes the classes that keep what it renders today; the merged class strings compute identically (table 2).
- `BlockMenu` passed `rounded-[1rem]`, but the legacy popover's own `rounded-medium` came later in the CSS and won, so the menu rendered 12px: it now passes `rounded-medium`. It also passes `border-neutral-200` so even the hidden border (`border-none`) computes the same colour.
- The legacy file is deleted.""",
 importers=[
  ("`build/.../NewBlockMenu/BlockMenu/BlockMenu.tsx`", "`__legacy__/ui/popover` → `molecules/Popover/Popover`; className keeps radius/border/text", "`/build` + block menu open (mouse and keyboard)"),
  ("`build/.../NewSaveControl/NewSaveControl.tsx`", "same", "`/build` + save popover open (mouse and keyboard)"),
  ("`atoms/DateInput/DateInput.tsx`", "same", "date story + calendar open"),
  ("`atoms/DateTimeInput/DateTimeInput.tsx`", "same", "date-time story + calendar open"),
 ],
 parity="""| component | used props (default) | ref | DOM tag | role / aria | handlers | old → new |
| --- | --- | --- | --- | --- | --- | --- |
| `Popover` / `PopoverTrigger` | open, onOpenChange / asChild, className | Radix | Radix | Radix `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls` | Radix | the same Radix exports |
| `PopoverContent` | side, align (`center`), sideOffset (`4`), className, data-id | forwardRef | Portal > div | Radix `role="dialog"` | Radix (Esc, outside click, focus return) | same props/defaults/portal; base classes differ, compensated per call site (merged strings identical, table 2) |""",
 todos=["`BlockMenu`, `NewSaveControl`, `DateInput`, `DateTimeInput`: `border-neutral-200` #E5E5E5 no exact role; `text-neutral-950` #0A0A0A is the `focus` role (ring kind), SECRT-3154"],
 deviations=["**Rule 13 pair for SECRT-3154:** `text-neutral-950` #0A0A0A ↔ role `focus` (ring kind).",
             "**Radius names and tailwind-merge (SECRT-3155):** the call sites rely on `rounded-medium`/`rounded-xlarge` (unregistered in tailwind-merge) coming after `rounded-lg` in the CSS, which Tailwind emits in theme order (checked). When SECRT-3155 registers the names, tailwind-merge will drop `rounded-lg` instead, with the same result."],
 improved=["One popover in the codebase: the four remaining callers use `molecules/Popover`.",
           "Each call site now states the look it renders, including the block menu's 12px corner that the old CSS order silently produced."],
),
5: dict(
 title="refactor(frontend): move card importers onto atoms/Card (DS3a-1, 5/8)",
 branch="abhi/drop-legacy-ui-small-primitives-card",
 prims="`card`",
 why="`atoms/Card` exists but lacked the legacy card's outlined look and its header/title/description/content/footer parts, so 8 files still imported the legacy card (3 of them mixed the atom with legacy parts).",
 what="""- `atoms/Card` gains `variant="outlined"` at the legacy card's classes (`agpt-card text-neutral-950`) and the five parts at their current classes. `CardDescription` is a `<p>` with `text-body leading-5` (was `text-sm`): not `<Text>`, because the description inherits font family and weight and `Text` sets both.
- Callers that used the legacy `Card` pass `variant="outlined"`; the three admin diagnostics files that already used the atom import the parts from it too. The legacy file is deleted.""",
 importers=[
  ("`profile/(user)/settings/.../TimezoneForm/TimezoneForm.tsx`", "→ `atoms/Card` (`variant=\"outlined\"`, parts)", "`/profile/settings`"),
  ("`components/auth/AuthFeedback.tsx`", "→ `atoms/Card` `variant=\"outlined\"`", "`/login` after a failed sign-in"),
  ("`build/.../NewSaveControl/NewSaveControl.tsx`", "same", "`/build` save popover open"),
  ("`admin/diagnostics/components/DiagnosticsContent.tsx`, `ExecutionsTable.tsx`, `SchedulesTable.tsx`", "parts from `atoms/Card`", "`/admin/diagnostics`"),
  ("`profile/(user)/api-keys/page.tsx`", "→ `atoms/Card`", "`/profile/api-keys` redirects to `/settings/api-keys` on mount: not capturable (Deviations)"),
  ("`(no-navbar)/share/[token]/page.tsx`", "→ `atoms/Card`", "needs a shared run: not capturable (Deviations)"),
 ],
 parity="""| component | used props (default) | ref | DOM tag | role / aria | handlers | old → new |
| --- | --- | --- | --- | --- | --- | --- |
| `Card` | className, children; `variant` (`default`, `outlined` for legacy callers) | not forwarded (legacy forwarded; no caller passes a ref) | div | none | none | same tag and merged classes (table 2) |
| `CardHeader` / `CardContent` / `CardFooter` | className, children, HTML attrs | not forwarded (no caller passes one) | div | none | none | same classes |
| `CardTitle` | className, children | not forwarded | h3 | none | none | same classes |
| `CardDescription` | children | not forwarded | p | none | none | `text-sm` → `text-body leading-5` |""",
 todos=["`atoms/Card` `outlined`: `text-neutral-950` #0A0A0A is the `focus` role (ring kind), SECRT-3154", "`CardDescription`: `text-neutral-500` #737373 no exact role"],
 deviations=["**Not capturable:** `/profile/api-keys` (redirects to `/settings/api-keys` on mount, `useNewSettingsRedirect`) and `/share/[token]` (needs a shared run). Their cards use the same `variant=\"outlined\"` and parts as the captured pages.",
             "**Rule 13 pair for SECRT-3154:** `text-neutral-950` #0A0A0A ↔ role `focus` (ring kind).",
             "**Strict count:** `no-restyle` rises because the callers' existing `className` overrides now sit on a design-system component (the strict config does not check legacy imports). No class value changed; moving those overrides into variants is DS2a-style follow-up work (SECRT-3112 follow-up)."],
 improved=["One card: every caller uses `atoms/Card`, and the admin diagnostics no longer mix the atom with legacy parts.",
           "The outlined look and the card parts are named in the atom, so a theme changes them in one place."],
),
6: dict(
 title="refactor(frontend): move label off __legacy__/ui into atoms/Label (DS3a-1, 6/8)",
 branch="abhi/drop-legacy-ui-small-primitives-label",
 prims="`label`",
 why="8 files (including the legacy `form`) imported the legacy label.",
 what="""- The Radix label becomes `atoms/Label` at today's classes: `text-sm font-medium leading-none` → `text-body font-medium leading-none` (14px, line-height 1, same values; every caller override merges the same, table 2). Not `<Text>`: the label inherits its colour, which `Text` would set.
- All importers move over, the legacy `form` included. The legacy file is deleted.""",
 importers=[
  ("`admin/execution-analytics/components/ExecutionAnalyticsForm.tsx`", "→ `atoms/Label/Label`", "`/admin/execution-analytics`"),
  ("`admin/marketplace/components/ApproveRejectButton.tsx`", "same", "`/admin/marketplace` + Approve dialog"),
  ("`admin/spending/components/AddMoneyButton.tsx`", "same", "`/admin/spending` + Add Dollars dialog"),
  ("`build/.../AgentOutputs/AgentOutputs.tsx`", "same", "`/build` outputs sheet (disabled without outputs)"),
  ("`build/components/MCPToolDialog.tsx`", "same", "not capturable (needs an MCP server)"),
  ("`profile/(user)/api-keys/components/APIKeysModals/APIKeysModals.tsx`", "same", "`/profile/api-keys` redirects: not capturable"),
  ("`contextual/CronScheduler/cron-scheduler.tsx`", "same", "schedule dialog (needs a saved workflow)"),
  ("`__legacy__/ui/form.tsx` (`FormLabel`)", "same, ref passed through", "every legacy `Form` field (e.g. `/build` save popover, admin dialogs)"),
 ],
 parity="""| component | used props (default) | ref | DOM tag | role / aria | handlers | old → new |
| --- | --- | --- | --- | --- | --- | --- |
| `Label` | htmlFor, className, children, `id` (FormLabel) | Radix Label root; `FormLabel`'s ref still reaches it (React 19 ref as a prop) | label | Radix Label (none extra) | Radix mousedown (no text selection on double click) | same; `text-sm` → `text-body` (with `leading-none` kept) |""",
 todos=[],
 deviations=["**Not capturable:** MCP tool dialog, `/profile/api-keys` modals (redirect), the cron scheduler dialog (needs a saved, schedulable workflow). Covered by the merged-class rows for every caller `className`.",
             "**Strict count:** `no-restyle` rises because callers' existing `className` overrides now sit on a design-system component. No value changed. Owner: SECRT-3112 follow-up."],
 improved=["One label primitive, in `atoms/`; the legacy `form` uses it too.", "Its type is a role class, so the label size moves with the type scale."],
),
7: dict(
 title="refactor(frontend): draw the legacy icons through the Icon atom (DS3a-1, 7/8)",
 branch="abhi/drop-legacy-ui-small-primitives-icons",
 prims="`icons`",
 why="The legacy `icons` file held five hand-written SVGs and the Navbar's `IconType` enum. Hugeicons has no glyph identical to any of them, so swapping glyphs would change pixels.",
 what="""- The five SVGs (circle alert, star, filled star, vertical dots, dashboard layout) become icon data in `atoms/Icon/drawnIcons.ts` and render through the `Icon` atom with their old viewBox and stroke widths. Each call site passes `aria-label="Icon"`, which the old wrapper put on every SVG (it keeps, e.g., the accessible name of the dashboard card's "more" button).
- `IconType` moves into `layout/Navbar/helpers.tsx`, where it is used.
- The legacy file is deleted.""",
 importers=[
  ("`marketplace/components/StoreCard/StoreCard.tsx`", "`StarRatingIcons` → 5 `Icon`s (`StarFilledGlyph`/`StarGlyph`)", "`/marketplace`, `/marketplace/creator/*`, `/marketplace/agent/*`, marketplace stories"),
  ("`library/.../SelectedRunView/components/RunSummary.tsx`", "`IconCircleAlert` → `Icon` `CircleAlertGlyph`", "a run with an AI summary (none in the capture data): glyph check"),
  ("`profile/(user)/dashboard/components/AgentTableCard/AgentTableCard.tsx`", "`IconMore`, `IconStarFilled` → `Icon`", "`/profile/dashboard` redirects on mount: glyph check"),
  ("`app/error.tsx`", "`IconCircleAlert` → `Icon`", "the app error boundary (needs a crash): glyph check"),
  ("`components/__legacy__/Sidebar.tsx`", "`IconDashboardLayout` → `Icon`", "`/profile/settings` (profile layout sidebar)"),
  ("`layout/Navbar/helpers.tsx`, `AccountMenu/helpers.tsx`, `AccountMenu.stories.tsx`, 2 tests", "`IconType` from `layout/Navbar/helpers`", "story `layout-navbar-accountmenu--*`, every signed-in page's account menu"),
 ],
 parity="""| icon | props used | ref | DOM | aria | old → new |
| --- | --- | --- | --- | --- | --- |
| all five | className (size, colour) | svg (both forwardRef) | svg > circle/line/polygon/path | `aria-label="Icon"` on both | presentation attributes move (stroke on each child, `width/height="1em"` overridden by the size class); legacy default `size-4` merged with the caller is written out: `size-4`+`size-10` → `size-10`, `size-4`+`h-5 w-5` → `h-5 w-5` (h/w come after `size` in the CSS, checked) |
| `IconType` | enum members and order unchanged | - | - | - | moved, same numeric values |""",
 todos=[],
 deviations=["**Glyphs that are not Hugeicons, kept for 0 px:** `drawnIcons.ts` holds glyph data that does not come from `@hugeicons/core-free-icons` (AGENTS.md: Hugeicons only). Replacing them with Hugeicons glyphs is a visible change and a design decision. Owner: SECRT-3112 follow-up / design.",
             "**`aria-label=\"Icon\"` kept on purpose:** a poor label, but removing it changes accessible names (rule 17e). Fixing the labels is a separate a11y change.",
             "**Not capturable:** `RunSummary`'s alert (needs a run with an AI summary), `/profile/dashboard` (redirects), `app/error.tsx` (needs a crash): covered by the glyph check, which renders the exact call-site elements old vs new."],
 improved=["No hand-written SVG components left in `__legacy__/ui`; every icon renders through the `Icon` atom.", "`IconType` lives with the Navbar code that uses it."],
),
8: dict(
 title="refactor(frontend): move separator off __legacy__/ui into atoms/Separator (DS3a-1, 8/8)",
 branch="abhi/drop-legacy-ui-small-primitives-separator",
 prims="`separator`",
 why="9 importers left on the legacy separator.",
 what="""- The Radix separator becomes `atoms/Separator` at today's classes (`h-[1px]`/`w-[1px]` → `h-px`/`w-px`, the same 1px; dead `dark:` class dropped). Importers move over and the legacy file is deleted.""",
 importers=[
  ("`build/.../NewBlockMenu/BlockMenuContent/BlockMenuContent.tsx`, `BlockMenuDefault.tsx`, `AllBlocksContent.tsx`", "→ `atoms/Separator/Separator`", "`/build` + block menu open"),
  ("`build/.../NewBlockMenu/FilterSheet/FilterSheet.tsx`", "same", "block menu filter sheet"),
  ("`build/components/NewControlPanel/UndoRedoButtons.tsx`", "same", "`/build`"),
  ("`marketplace/components/MainAgentPage/MainAgentPage.tsx`", "same", "`/marketplace/agent/*`"),
  ("`profile/(user)/settings/components/SettingsForm/SettingsForm.tsx`, `settings/loading.tsx`", "same", "`/profile/settings` (loading: transient)"),
  ("`profile/(user)/dashboard/components/MainDashboardPage/MainDashboardPage.tsx`", "same", "`/profile/dashboard` redirects: not capturable"),
 ],
 parity="""| component | used props (default) | ref | DOM tag | role / aria | handlers | old → new |
| --- | --- | --- | --- | --- | --- | --- |
| `Separator` | className, orientation (`horizontal`), decorative (`true`) | Radix root (ref as a prop) | div | `role="none"` (decorative), `data-orientation` | none | same; `h-[1px]` → `h-px` (1px) |""",
 todos=["`atoms/Separator`: `bg-neutral-200` #E5E5E5 no exact role"],
 deviations=["**Not capturable:** `/profile/dashboard` (redirects on mount), `settings/loading.tsx` (transient). Same component and merged classes as the captured call sites."],
 improved=["One separator, in `atoms/`.", "The 1px rule is written `h-px`, a scale value instead of an arbitrary one."],
),
}


# DS7 data-slot contract: slots this PR's new or rebased design-system files carry.
DATASLOT = {
 1: "**`data-slot` on the new molecules (DS7-2 contract, not in the ticket):** `dev` gained DS7-2 (#16084) after this stack was cut, so every element a molecule renders carries `data-slot`. The new `molecules/Carousel` (`carousel`, `carousel-viewport`, `carousel-content`, `carousel-item`) and `molecules/PaginationControls` (`pagination-controls`, `-previous`, `-next`, `-label`) get one on every element, placed before `{...props}` as DS7 does. `molecules/Collapsible` keeps all six of DS7-2's slots on the Radix parts it now renders directly. Attributes only: no class, markup or behaviour change, and no selector in `src` targets these names.",
 2: "**`data-slot` on the new atom and molecule (DS7 contract, not in the ticket):** `atoms/Calendar` slots every part DayPicker renders (`calendar`, `calendar-months`, `calendar-month`, `calendar-month-caption`, `calendar-dropdowns`, `calendar-caption-label`, `calendar-nav`, `calendar-previous`, `calendar-next`, `calendar-month-grid`, `calendar-weekdays`, `calendar-weekday`, `calendar-weeks`, `calendar-week`, `calendar-day`, `calendar-day-button`, `calendar-footer`) by wrapping react-day-picker's own default components (same DOM), plus `calendar-chevron` and `calendar-dropdown-{trigger,value,popup,item}` passed to the Select parts. `molecules/ScrollArea` gets `scroll-area`, `-viewport`, `-scrollbar`, `-thumb`, `-corner`. `atoms/LoadingSpinner` keeps DS7-1's `loading-spinner` / `loading-spinner-cover`; the `circle` variant renders them too. No selector in `src` targets these names.",
 3: "**`data-slot` on the new molecule (DS7-2 contract, not in the ticket):** `molecules/MultiSelect` (`multi-select`, `-trigger`, `-badge-label`, `-remove`, `-remove-label`, `-remove-icon`, `-input`, `-content`, `-list`, `-empty`, `-empty-text`, `-item`, `-item-check`) and its `components/Command` (`command`, `command-list`, `command-empty`, `command-item`, which MultiSelect overrides with its own names). One element is not slotted: each selected value's chip, which is the legacy `Badge` (a `div`); it gets its slot when the DS3a part that moves `badge` replaces it. cmdk's internal sr-only `<label>` is not ours to slot. No selector in `src` targets these names.",
 4: "**DS7 slots kept:** `DateInput` / `DateTimeInput` keep DS7-1's `date-input-popup`, `date-time-input-popup` and `date-time-input-popup-body` on the molecule `PopoverContent`. Since #16108 registered the radius names in tailwind-merge, the explicit `rounded-medium` now replaces the molecule's `rounded-lg` in `cn()` instead of winning on stylesheet order; table 2 merges both sides with the new config and renders 12px either way. BlockMenu: #16108 dropped its `rounded-[1rem]` on `dev`, so its comment no longer refers to it.",
 5: "**`data-slot` on the new Card parts (DS7-1 contract, not in the ticket):** `card` (kept from DS7-1), `card-header`, `card-title`, `card-description`, `card-content`, `card-footer`, before `{...props}`. No selector in `src` targets these names.",
 6: "**`data-slot` on the new atom (DS7-1 contract, not in the ticket):** `atoms/Label` renders `data-slot=\"label\"` before `{...props}`. No selector in `src` targets it.",
 7: "",
 8: "**`data-slot` on the new atom (DS7-1 contract, not in the ticket):** `atoms/Separator` renders `data-slot=\"separator\"` before `{...props}`. No selector in `src` targets it.",
}
for _k, _v in DATASLOT.items():
    if _v:
        PRS[_k]["deviations"] = PRS[_k]["deviations"] + [_v]

PRS[1]["what"] = PRS[1]["what"] + "\n- Every element the two new molecules render carries a DS7-2 `data-slot`, and `molecules/Collapsible` keeps its six (see Deviations)."

PRS[2]["what"] = PRS[2]["what"] + "\n- The new atom and molecule carry DS7 `data-slot`s on every element they render, and `LoadingSpinner` keeps DS7-1's (see Deviations)."

PRS[3]["what"] = PRS[3]["what"] + "\n- Every element `molecules/MultiSelect` and its `Command` parts render carries a DS7-2 `data-slot` (see Deviations)."

PRS[4]["what"] = PRS[4]["what"] + "\n- `DateInput` / `DateTimeInput` keep DS7-1's popup slots; BlockMenu's comment no longer mentions the `rounded-[1rem]` that #16108 removed on `dev` (see Deviations)."

_w = PRS[4]["what"].split("\n")
_w[1] = "- `BlockMenu` renders the legacy popover's 12px corner (`rounded-medium`; #16108 removed the `rounded-[1rem]` it used to pass), so it now passes `rounded-medium` to the molecule. It also passes `border-neutral-200` so even the hidden border (`border-none`) computes the same colour."
_w[3] = "- `DateInput` / `DateTimeInput` keep DS7-1's popup slots (see Deviations)."
PRS[4]["what"] = "\n".join(_w)
PRS[4]["deviations"] = [d for d in PRS[4]["deviations"] if not d.startswith("**Radius names and tailwind-merge (SECRT-3155):**")]


# ---- every changed call site names its captures (QUALITY 24/25). `*` = both viewports (`__desktop`, `__mobile`).
EV = "story__evidence-"
B390 = "at 390px the builder hides its control panel on every commit, which `app__build__mobile` shows identically on both sides"
CAPTURED = {
 1: [
  "`story__molecules-collapsible--default__*`, `--default-open__*`, `--multiple-collapsibles__*`, `interact__kb-story-collapsible-{focus-visible,hover,kb-open,after-esc}__*`: these stories render this molecule itself (the only file that changed) closed, open and stacked, and opened by keyboard; every app caller renders this same molecule",
  "`app__marketplace__mobile`, `interact__kb-marketplace-carousel-{focus-visible,hover,keys,kb-open,after-esc}__*` (the strip is `md:hidden`: `app__marketplace__desktop` shows it absent on both sides), `app__marketplace_creator_autogpt__*`, `app__marketplace_agent_autogpt_personalized-morning-coffee-newsletter__*`",
  "`app__admin_marketplace__*`, `interact__admin-marketplace-approve__*`",
  "`app__admin_spending__*`, `interact__admin-spending-adddollars__*`",
 ],
 2: [
  "`story__renderers-formrenderer-primitive-fields--date-field__*`, `interact__story-datefield-open__*`, `interact__kb-story-datefield-{focus-visible,hover,kb-open,keys,after-esc}__*`",
  "`story__renderers-formrenderer-primitive-fields--date-time-field__*`, `interact__story-datetimefield-open__*`, `interact__kb-story-datetimefield-{focus-visible,hover,kb-open,keys,after-esc}__*`",
  f"`{EV}mcptooldialog--connecting__*` (the circle spinner in \"Connecting...\"), `--tools__*`, `--tools-scrolled__*`, `--tool-hovered__*` (the `ScrollArea` of tools, scrolled to the end), `--url-step__*`, `--error-state__*`, `--manual-credential__*`: the real dialog with the MCP discovery and OAuth endpoints stubbed",
  f"`{EV}noderun--badge-running__*` (the circle spinner), `--badge-queued__*`: the real badge for a node seeded in the builder's node store",
  f"`{EV}resetpasswordfallback--fallback__*`: the Suspense fallback element exactly as `page.tsx` writes it at each commit (the page renders it only while it suspends); `app__reset-password__*` for the page itself",
  f"`{EV}noderun--view-more-open__*`, `--view-more-scrolled__*`: the real output dialog for a node seeded with three long results, its `ScrollArea` unscrolled and scrolled",
  f"`{EV}noderun--outputs-sheet__*`, `--outputs-sheet-scrolled__*` (the real sheet opened, output node seeded), `interact__build-agentoutputs-open__desktop`, `app__build__*`",
 ],
 3: [
  "`story__renderers-formrenderer-array-fields--list-of-enums__*`",
  "`story__renderers-formrenderer-complex-schemas--multi-select-field__*`, `interact__story-multiselect-open__*`, `interact__kb-story-multiselect-{focus-visible,hover,kb-open,keys,after-esc}__*`",
  "the unit tests (`FormRenderer.test.tsx`, `SelectWidget.test.tsx`) in the full `vitest` run",
  "deleted; its replacement is the `MultiSelect` row above",
 ],
 4: [
  f"`interact__build-blockmenu-open__desktop`, `interact__kb-build-blockmenu-{{focus-visible,hover,kb-open,after-esc}}__desktop`; {B390}",
  f"`interact__build-savecontrol-open__desktop`, `interact__kb-build-savecontrol-{{focus-visible,hover,kb-open,after-esc}}__desktop`; {B390}",
  "`interact__story-datefield-open__*`, `interact__kb-story-datefield-{kb-open,keys,after-esc}__*`",
  "`interact__story-datetimefield-open__*`, `interact__kb-story-datetimefield-{kb-open,keys,after-esc}__*`",
 ],
 5: [
  "`app__profile_settings__*`",
  "`interact__login-error-help__*`",
  f"`interact__build-savecontrol-open__desktop`; {B390}",
  "`app__admin_diagnostics__*`, `interact__admin-diagnostics__*`",
  f"`{EV}pages--profile-api-keys__*`, `--profile-api-keys-create-open__*`: the page component itself with the key list stubbed (in the app `/profile/api-keys` redirects to `/settings/api-keys` on mount; Storybook's router does not navigate)",
  f"`{EV}pages--share-loaded__*`, `--share-not-found__*`: the real page with the shared-run endpoint stubbed (a run with outputs, and an unknown token)",
 ],
 6: [
  "`app__admin_execution-analytics__*`",
  "`interact__admin-marketplace-approve__*`",
  "`interact__admin-spending-adddollars__*`",
  f"`{EV}noderun--outputs-sheet__*`, `--outputs-sheet-scrolled__*` (each output's name and description is a `Label`), `interact__build-agentoutputs-open__desktop`",
  f"`{EV}mcptooldialog--url-step__*` (\"Server URL\"), `--manual-credential__*` (the token label), plus the other `mcptooldialog` states",
  f"`{EV}pages--profile-api-keys-create-open__*`: the create-key dialog opened on the real page",
  f"`{EV}pages--cron-daily__*`, `--cron-weekly__*`, `--cron-monthly__*`, `--cron-custom__*`: the real scheduler in each repeat mode (each shows its own labels)",
  "`interact__build-savecontrol-open__desktop`, `interact__admin-spending-adddollars__*`, `interact__admin-marketplace-approve__*` (legacy `Form` fields)",
 ],
 7: [
  "`app__marketplace__*`, `app__marketplace_creator_autogpt__*`, `app__marketplace_agent_autogpt_personalized-morning-coffee-newsletter__*`, `app__marketplace_search_searchTerm_newsletter__*`",
  f"`{EV}pages--run-summary-high__*`, `--run-summary-mid__*`, `--run-summary-low__*`, `--run-summary-icon-hover__*`: the real summary for a run with an AI activity summary, its alert icon hovered",
  f"`{EV}pages--dashboard-agent-table__*`, `--dashboard-agent-menu-hover__*`: the real table and cards with three submissions (approved, pending, rejected)",
  f"`{EV}pages--app-error-page__*`: the real error boundary page",
  "`app__profile_settings__*` (the profile layout's sidebar)",
  f"`{EV}accountmenu--user-open__*`, `--admin-open__*`, `--admin-open-item-hover__*`: the real menu opened with the repo's own AccountMenu story args at each commit (that story folder is outside Storybook's globs); every signed-in `app__*` capture shows the navbar",
 ],
 8: [
  f"`interact__build-blockmenu-open__desktop`, `interact__kb-build-blockmenu-kb-open__desktop`; {B390}",
  f"`{EV}pages--block-menu-filter-sheet__*`: the real filter sheet opened (the app's filter step times out reaching it, on base and head)",
  f"`app__build__desktop`; {B390}",
  "`app__marketplace_agent_autogpt_personalized-morning-coffee-newsletter__*`",
  f"`app__profile_settings__*`, `{EV}pages--settings-loading-skeleton__*` (the real `loading.tsx`)",
  f"`{EV}pages--dashboard-page__*`: the real dashboard page (in the app `/profile/dashboard` redirects on mount)",
 ],
}
for _k, _rows in CAPTURED.items():
    _imp = PRS[_k]["importers"]
    assert len(_imp) == len(_rows), (_k, len(_imp), len(_rows))
    PRS[_k]["importers"] = [(f, c, w) for (f, c, _), w in zip(_imp, _rows)]
for _k in PRS:
    PRS[_k]["deviations"] = [d for d in PRS[_k]["deviations"] if not re.match(r"\*\*Not capturable", d)]


# ---- parity corrections after Astra's review (2026-10-24) ----
def _fix(k, old, new):
    assert PRS[k]["parity"].count(old) == 1, (k, old[:60])
    PRS[k]["parity"] = PRS[k]["parity"].replace(old, new)
_p1 = PRS[1]["parity"]
for _old, _new in [
    ("| not forwarded (no caller passes one; legacy forwarded to the root div) |", "| forwarded to the region div, as legacy (`ref` is a prop in React 19; typed via `React.ComponentProps<\"div\">`) |"),
    ("| embla viewport ref on the outer div (as before); inner div ref not forwarded (no caller) |", "| embla viewport ref on the outer div; the caller's ref on the inner slide track, as legacy |"),
    ("| not forwarded (no caller) |", "| forwarded to the slide div, as legacy |"),
]:
    _fix(1, _old, _new)
_fix(2, "| every DayPicker prop passed through; showOutsideDays (`true`), captionLayout `dropdown`, start 1900-01 / end 2100-01, `components.Chevron`, `components.Dropdown` (`atoms/Select`'s `SelectPrimitives`, where DS3a-4 moved the legacy `select`) | none (none before) |",
        "| used by the callers: `mode`, `selected`, `onSelect`, `modifiersClassNames`; every other DayPicker prop passed through; showOutsideDays (`true`), captionLayout `dropdown`, start 1900-01 / end 2100-01, `components.Chevron`, `components.Dropdown` (`atoms/Select`'s `SelectPrimitives`, where DS3a-4 moved the legacy `select`); `data-slot` on every part (DS7) | none (none before) |")
_fix(2, "| className (`size-4` / `size-16`) | svg (HugeiconsIcon forwardRef; legacy lucide forwardRef) |",
        "| className (`size-4` / `size-16`); the default size differs (atom `medium` = 24px, legacy 64px) but every caller passes its size, so none renders at a default | none: neither the legacy spinner nor the atom forwards a ref |")
_fix(2, "| `ScrollArea` | className, orientation (`vertical`) | Radix root | Radix ScrollArea | Radix | Radix | identical code |",
        "| `ScrollArea` | children, className, orientation (`vertical`) | Radix root ref | Radix ScrollArea | Radix | Radix | same code and Radix structure; adds `data-slot`s (DS7); drops the `dark:` thumb class (no dark theme) and the unused `ScrollBar` export (0 importers) |")
_fix(3, "| values, onValuesChange, loop (`false`), dir, className, children |",
        "| `MultiSelector`: values, onValuesChange, loop (`false`), dir, label, className, children; `MultiSelectorInput`: placeholder, aria-label, aria-describedby; `MultiSelectorItem`: value, title, disabled, children |")
_fix(4, "| Radix `aria-haspopup=\"dialog\"`, `aria-expanded`, `aria-controls` | Radix | the same Radix exports |",
        "| Radix `aria-haspopup=\"dialog\"`, `aria-expanded`, `aria-controls` | Radix | Root is the same Radix export; the molecule's `PopoverTrigger` is a `forwardRef` wrapper (DS7-2) that adds `data-slot=\"popover-trigger\"` and passes everything else through, ref included |")


# ---- call-site rows name the harness captures (QUALITY 24/25/27). `*` = `__desktop` and `__mobile`.
CAPTURED2 = {
 1: [
  "`pr1-collapsible-{default,default-open,multiple-collapsibles}--{rest,hover,focus-visible,keyboard-toggled}__*` and `--clicked-open__*` / `--clicked-closed__*`: the stories render this molecule itself (the only file changed) closed, open and stacked; Enter, Space and a click each toggle it, asserted",
  "`pr1-carousel-{creator,agent}--{rest,hover,focus-visible,arrow-right}__mobile` (the real strip on `/marketplace/creator/autogpt` and the agent page; Tab into a card, ArrowRight moves the slides, ArrowLeft back, asserted) and `--desktop-hidden__desktop` (the strip is `md:hidden`, asserted hidden at 1440)",
  "`pr1-pagination-admin-marketplace--{first-page,next-hover,next-focus-visible,page-2,last-page}__*`: 33 real pages; Previous disabled on page 1, Tab to Next + Enter goes to page 2, Previous goes back, Next disabled on page 33, asserted",
  "`pr1-pagination-admin-spending--{first-page,next-hover,next-focus-visible,page-2,last-page}__*`: 7 real pages, the same steps asserted",
 ],
 2: [
  "`pr2-date-field--{rest,hover,focus-visible,open,day-focused,day-arrow-right,picked,open-with-selection,month-dropdown}__*` and `pr2-date-{filled,disabled,read-only,error}--*__*`: Tab to the trigger, Enter opens the Calendar, Tab to today's day, ArrowRight to the 16th, Escape closes with focus back on the trigger, Enter picks the day, the month dropdown opens; disabled/read-only asserted not to open",
  "`pr2-date-time-field--{rest,hover,focus-visible,open,day-focused,day-arrow-right,picked,open-with-selection,month-dropdown}__*` and `pr2-date-time-{filled,disabled,read-only,error}--*__*`: the same steps asserted",
  "`pr2-mcp-{url-step,connecting,tools,error-state,manual-credential}--*__*`: the real dialog with the MCP endpoints stubbed: the circle spinner in \"Connecting...\" (`--state`), the tool `ScrollArea` at the top, hovered and scrolled to the last tool (`pr2-mcp-tools--{top,tool-hover,scrolled}`), Escape closes it",
  "`pr2-node-badge-{running,queued}--rest__*`: the real badge for a node seeded RUNNING (circle spinner asserted visible) and QUEUED",
  "`pr2-reset-password-suspended--fallback__*`: the real page with its Suspense boundary suspended (in production it never suspends); `pr2-reset-password-app--rest__*` for the page itself",
  "`pr2-view-more--{closed,trigger-focus-visible,open,scrolled}__*`: Tab to View More, Enter opens the output dialog, its content scrolled, Escape closes it",
  "`pr2-outputs-sheet--{closed,trigger-focus-visible,open,scrolled}__*`: Tab to the outputs button, Enter opens the sheet, scrolled, Escape closes it",
 ],
 3: [
  "`pr3-selectwidget-multi--*__*` and `pr3-selectwidget-multi-empty--*__*`: SelectWidget's multi-select branch (an array of enum values with `uniqueItems`) through the real FormRenderer, with and without values: open on focus, ArrowDown highlights, Enter toggles, the empty result, Backspace removes the last chip, Escape closes",
  "`pr3-multiselect-field--{rest,open,option-highlighted,after-enter,empty,closed}__*`: the same steps asserted",
  "the unit tests (`FormRenderer.test.tsx`, `SelectWidget.test.tsx`) in the full `vitest` run",
  "deleted; its replacement is the `MultiSelect` molecule, also captured with a disabled option (`pr3-multiselect-disabled-option--{open,disabled-option-hover}__*`, asserted `aria-disabled`)",
 ],
 4: [
  "`pr4-blockmenu-app--{closed,trigger-hover,trigger-focus-visible,open,open-mouse}__desktop` (the builder hides its control panel at 390 on every commit) and `pr4-blockmenu-story--*__*` (the real menu mounted at both widths): Tab to the trigger, Enter opens, Escape closes with focus back on the trigger, a click opens",
  "`pr4-savecontrol-app--*__desktop` and `pr4-savecontrol-story--*__*`: the same steps asserted",
  "`pr2-date-field--{open,open-with-selection,month-dropdown}__*` (the PopoverContent holding the Calendar)",
  "`pr2-date-time-field--{open,open-with-selection,month-dropdown}__*`",
 ],
}
for _k, _rows in CAPTURED2.items():
    _imp = PRS[_k]["importers"]
    assert len(_imp) == len(_rows), (_k, len(_imp), len(_rows))
    PRS[_k]["importers"] = [(f, c, w) for (f, c, _), w in zip(_imp, _rows)]


# ---- rule 32 (2026-10-25): Text classNames hold no typography; the variants carry it
PRS[1]["what"] = PRS[1]["what"].replace(
    "- `pagination-controls` (2 admin importers) becomes `molecules/PaginationControls` at today's markup; its `text-sm` label is `text-body leading-5` (14px/20px, same value).",
    "- `pagination-controls` (2 admin importers) becomes `molecules/PaginationControls` at today's markup. Its `text-sm` label is `<Text variant=\"body-tight\" tone=\"inherit\" as=\"span\">` (14px/20px, the inherited colour): `atoms/Text` gains the `body-tight` variant (`text-body leading-5`) and the `inherit` tone, with the names and strings DS7-1 #16134 uses.")
PRS[1]["what"] += "\n- Carousel, CarouselContent and CarouselItem take a `ref` on the elements the legacy versions forwarded it to. Tests cover the three molecules."
PRS[3]["what"] = PRS[3]["what"].replace(
    "- `text-sm` → `text-body leading-5`, `text-xs` → `text-caption leading-4` (same values), `bg-white` → `bg-surface`, dead `dark:` classes dropped.",
    "- `text-sm` → `text-body leading-5` on the trigger container, `bg-white` → `bg-surface`, dead `dark:` classes dropped. Each chip label is `<Text variant=\"small-semibold-tight\" tone=\"inherit\" as=\"span\">`: `atoms/Text` gains `small-semibold-tight` (`text-caption leading-4` at 600, the badge's weight; no role holds that pair, so a `TODO(tokens)` line).")
PRS[3]["what"] += "\n- Tests cover the option list: open/close, picking and un-picking, the remove button, the empty result, disabled options and removing the highlighted chip."
PRS[3]["deviations"] = PRS[3]["deviations"] + [
    "**Rule 31, one hit kept:** `MultiSelect.tsx` `MultiSelectorTrigger`'s `<div>` carries `text-body leading-5` (was `text-sm`). It is the flex container of the chips and the cmdk input, not text: the class sets the 14px/20px the input inherits, and `<Text>` would render a `p` around a form control. Owner: SECRT-3112 follow-up (the input's own size, once the Input atom covers cmdk)."]
