# #16134 changed call sites → captures that render them

State names are `team-states.cjs` states (`<page>__<tab>__<state>`), at 1440x900 and 390x844.
Every state asserts the listed text or selector visible before its shot (`<state>.asserts.json`).

| file | changed element(s) | rendered (and asserted) in |
|---|---|---|
| team/[expertId]/components/ProfileEntry.tsx | `dd` → Text body-md | autopilot__basics__default, james__soul__default, anika__soul__default |
| team/autopilot/components/AutopilotSkillsSection.tsx | ToolbarSearch textSize; "No skills match" / "No skills yet" Text body-md | autopilot__skills__default (seeded skills), autopilot__skills__no-match, autopilot__skills__search-focus |
| team/[expertId]/components/ExpertSchedulesSection.tsx | Create schedule Buttons (header + empty state); ToolbarSearch; PillFilterMenu; "No schedules match"; GraphScheduleListItem textSize | james__schedules__default / no-match / filter-open / filter-arrow / filter-esc, anika__schedules__default (empty state), autopilot__schedules__default / no-match |
| contextual/SchedulesPanel/…/GraphScheduleListItem.tsx | title Text (textSize); kind badge Text small; dialog mono `<dd>` role pair | james__schedules__default, autopilot__schedules__default (title, badge); stories copilot schedules panel (default branch). The View dialog's mono `<dd>` is not opened by the team harness (see Deviations) |
| team/[expertId]/components/ExpertWorkflowsSection.tsx | Install workflow Buttons; ToolbarSearch; PillFilterMenu; "No workflows match" | james__workflows__default / grid / no-match / search-focus, anika__workflows__default, autopilot__workflows__default / no-match |
| team/[expertId]/components/ExpertWorkflowListItem.tsx | title, description, meta row (Text div), run count | james__workflows__default, autopilot__workflows__default |
| team/[expertId]/components/ExpertWorkflowCard.tsx | description, run count (grid view) | james__workflows__grid |
| team/[expertId]/components/ExpertWorkflowRunButton.tsx | Run Button textSize | james__workflows__default / run-focus, autopilot__workflows__default |
| team/[expertId]/components/ExpertSkillsSection.tsx | Add skill Buttons; ToolbarSearch; "No skills match" | james__skills__default / no-match, anika__skills__default |
| team/[expertId]/components/ExpertSkillListItem.tsx | name Text; trigger pills + "+N" Text small | james__skills__default, autopilot__skills__default (seeded skills with triggers) |
| team/[expertId]/components/ExpertFilesSection/ExpertFilesSection.tsx | ToolbarSearch; PillFilterMenu; ErrorCard; "No files match"; empty state | james__files__default / populated / no-match / error / filter-open, anika__files__default |
| team/[expertId]/components/ExpertFilesSection/ExpertFileRow.tsx | file name Text | james__files__populated, james__basics__populated (latest outputs) |
| team/[expertId]/components/ExpertComputerSection/ExpertComputerSection.tsx | screen Text; Buttons; ErrorCard; status pill Text; volume path `<code>` / name Text; DesktopStreamPreview | james__computer__default / running / stream / error, anika__computer__default |
| contextual/OutputRenderers/renderers/DesktopStreamRenderer.tsx | header Text; provider badge; fullscreen button / new-tab link role pair; owner-only notice Text; footer Text | james__computer__stream (profile size); stories copilot-desktopstreampreview--default / --owner-only (default size, dev vs head) |
| team/[expertId]/components/ExpertIntegrationsSection/ExpertIntegrationsSection.tsx | Use existing / Add integration Buttons; ToolbarSearch; ErrorCard; "No integrations match"; empty state | james__integrations__default / no-match / error, anika__integrations__default |
| team/[expertId]/components/ExpertIntegrationsSection/ExpertIntegrationGroups.tsx | group name / count Text; Accordion trigger + content textSize | james__integrations__default / accordion-closed / accordion-keyboard |
| team/[expertId]/components/ExpertOverview/* (ExpertOverview, OverviewCard, CardError, RecentConversations, LatestOutputs), ExpertSummaryCard | card titles, empty states, Start a chat Button, CardError text + Retry, session titles, day streak | james__basics__default / populated / error, anika__basics__default |
| team/[expertId]/components/ExpertModeSection/ExpertModeSection.tsx | option label Text body-md-medium; description Text small | james__settings__mode-default / mode-focus / mode-confirm / mode-confirm-esc (COPILOT_AUTO_MODE on) |
| team/[expertId]/components/ExpertSettingsSection.tsx | intro + consequence Text; Fire Button; pause pills; "+N more"; consequence tag; Retry link | james__settings__default / preview-error, anika__settings__default |
| team/components/ToolbarSearch.tsx, PillFilterMenu.tsx, SectionEmptyState.tsx | textSize | every search/filter/empty-state row above; /team toolbar (default size) in pages `/team` |
| copilot/…/PanelEmptyState.tsx | description Text (textSize) | team empty states above; copilot side panel (default size) in pages `/copilot` and copilot stories |
| molecules/ErrorCard (ErrorCard, ErrorMessage, ActionButtons) | textSize | james__files__error, james__integrations__error, james__computer__error; molecules-errorcard stories (default) |
| molecules/Accordion/Accordion.tsx | textSize | james__integrations__*; molecules-accordion stories (default) |
| atoms/Button, atoms/Input | textSize | every Button/search row above; atoms-button / atoms-input stories (default) + interactive harness |
| atoms/Text/helpers.ts | variants body-md, body-md-medium | every Text body-md row above; atoms-text stories |
