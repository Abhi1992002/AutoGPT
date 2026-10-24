# Evidence for Significant-Gravitas/AutoGPT#16131 and #16134 (DS7-1 PR 2a / 2b)

Evidence only, never merged.

| PR | head | base for comparison |
|---|---|---|
| #16131 (`pr2a/`) | `d87acdfc43fc06ea26e668032217613e866c5893` | dev `0d5ac323f6c55b20f4996790f7f5539318eca5c3` |
| #16134 (`pr2b/`) | `dd9fc7551fd4bd0a31ce09df68bb63916094d266` | dev `0d5ac323f6c55b20f4996790f7f5539318eca5c3` (stack merge-base) |

Setup:
- Production builds with `NEXT_PUBLIC_PW_TEST=true` of each SHA, served one at a time on :3000 against the same backend and signed-in admin user.
- Storybook static builds of each SHA.
- 1440x900 and 390x844, pixel diff at threshold 0.
- `agpt.co` (216.150.0.0/16) is rejected for every run, so the timing-dependent "What's new" popup never renders.

| folder | what |
|---|---|
| `pr2a/lm-*` | the app's external-link dialog opened from a chat message: closed, open, Tab ×4, Esc; `asserts.json` holds every keyboard assertion |
| `pr2a/app-*`, `pr2b/app-*` | DS1 `screenshot-pages.ts` pages, two runs per SHA |
| `pr2a/sb-*`, `pr2b/sb-*`, `sbx-*` | all stories (`atoms-progress--live` is the standing skip); `sbx-*` are extra runs of the groups that vary run to run |
| `pr2b/ts-*` | `team-states.cjs`: every profile tab and state; per state a PNG, computed typography + box of every panel element (`.json`) and its assertions (`.asserts.json`) |
| `pr2b/ds-*` | `Copilot/DesktopStreamPreview` stories; `ds-before` is a throwaway dev Storybook build with only that story file added |
| `pr2b/ix-*` | atom-story interactive harness (hover / focus / open / Esc / arrows) with DOM state per step |
| `pr2b/equiv-*` | every class string 2b writes, old (dev) vs new (head), measured in the running apps |
| `*/compare-*.md`, `*/min-pair-*.md` | reports: per shot, the smallest dev/head diff over every run pair and the diffs between runs of the same commit |
| `pr2b/CALLSITES.md` | every changed call site and the states that render it |
| `scripts/` | all harnesses |
