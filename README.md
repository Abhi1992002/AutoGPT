# Evidence for SECRT-3112 (DS3a part 2 of 4: form controls)

Evidence-only branch. Never merged; not part of any PR's branch. One stacked PR per legacy primitive:

| layer | PR branch | commit | its base |
| --- | --- | --- | --- |
| badge | `abhi/drop-legacy-ui-form-controls` | `h1` | `dev` (`base`) |
| skeleton | `abhi/drop-legacy-ui-form-controls-skeleton` | `h2` | `h1` |
| checkbox | `abhi/drop-legacy-ui-form-controls-checkbox` | `h3` | `h2` |
| textarea | `abhi/drop-legacy-ui-form-controls-textarea` | `h4` | `h3` |
| form | `abhi/drop-legacy-ui-form-controls-form` | `h5` | `h4` |

`base` is `dev` at `6e5579086`. SHAs of h1..h5 are in each PR body and in `shots/SHAS.txt`.

## Contents

| path | what |
| --- | --- |
| `counts/` | strict lint (`pnpm exec oxlint -c .oxlintrc.strict.json`, `\| wc -l` and `-f unix`) of `src/components/__legacy__/ui` and of each layer's touched files, base and head, with DS4's config from `1ee6580dc` overlaid in a throwaway worktree (never committed) |
| `<layer>/pairs.mts`, `pairs.json` | every class string the layer writes, as the merged `cn()` result on the real element, old and new |
| `<layer>/equivalence.md` | `tools/pr-string-equivalence.mts` (DS5d's tool, extended with box/interaction properties and an inherited-parent context) on those pairs |
| `<layer>/negative-control.md` | deliberately wrong swaps, all caught |
| `ds1-check-token-equivalence*.txt` | DS1's `scripts/check-token-equivalence.ts` at the top of the stack, and on untouched dev |
| `<layer>/screens/cross-*.md` | exact RGBA pixel diff of every capture for every before-run x after-run pair, the minimum, and the same-commit diffs (`tools/cross.py`) |
| `<layer>/screens/dom-*.md` | run 1 vs run 1: pixel diff, DOM without class attributes (ids/port/attribute order normalised), focused element after the steps (`tools/capture-states.mts compare`) |
| `shots/<commit>-run1-{app,live,stories,stories-ds1}/` | the captures of run 1 of each commit: PNG, `.dom`, `.cls` (class attribute of every element), `.focus` |
| `shots/diff-*` | diff images of the non-zero pairs |
| `tools/harness-stories/` | the temporary Storybook stories that render every importer (copied into each checkout before `build-storybook`, never committed) |
| `specs/` | the live-app states, the story states and the extra runs of the captures that move between runs of one commit |

## How the captures were made

- App: `NEXT_PUBLIC_PW_TEST=true pnpm build && pnpm start` of each commit on :3000, backend in docker, an admin test user with 2 API keys, a 3-node workflow and an approved marketplace listing.
  - `app` = DS1 `scripts/screenshot-pages.ts capture` on DS1's default routes plus `/profile/settings`, `/profile/dashboard`, `/admin/{marketplace,execution-analytics,users,diagnostics,spending}`, `/build?flowID=…`.
  - `live` = `tools/capture-states.mts` (same determinism settings as DS1's harness) running each interaction state from a fresh page: errors, Tab focus, select open and Esc, row expand, checkbox toggle/hover/focus-visible, textarea focus and typing.
- Storybook: `pnpm build-storybook` of each commit with `tools/harness-stories/` copied in, served statically.
  - `stories` = the 238 harness states x 1440x900 and 390x844.
  - `stories-ds1` = DS1's harness on `tokens-`, `atoms-button--`, `atoms-text--`, `atoms-{badge,skeleton,checkbox,textarea}--`.
