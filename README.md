# Evidence for SECRT-3118 (DS5h): the flow editor (`build/**`) onto colour and text tokens

Evidence-only branch. Never merged; not part of any PR branch.

Current set, captured on the merged heads in one session:
- `f0`/`tf0`/`sf0`/`sbf0`: dev `0d5ac323f` (base of #16099)
- `f1`/`tf1`/`sf1`/`sbf1`: #16099 `d36d8655a`
- `f2`/`tf2`/`sf2`: #16103 `1d2382531`

| path | what |
| --- | --- |
| `counts/` | `pnpm exec oxlint -c .oxlintrc.strict.json "src/app/(platform)/build"` (`| wc -l`, `-f unix`) per SHA, strict config from DS4 `1ee6580dc` overlaid in a throwaway worktree |
| `equivalence/` | DS1's `check-token-equivalence.ts`, every exact class string per PR (`pr1-equivalence.md`, `pr2-equivalence.md`), `cn()`-merged rows on the real Text/Button/Badge/Label/Sheet (`pr1-*-merged.md`), `flow.css`/`tutorial.css` computed styles, negative controls, compiled-output checks |
| `manifest-p1.md`, `manifest-p2.md` | every changed file -> the capture(s) that render it (rule 20) |
| `rule15-pr*.txt` | the rule-15 grep over every file each PR touches |
| `screenshots/f*-run*` | DS1's `screenshot-pages.ts` (15 routes x 2 viewports) + `tools/capture-extra.mts` (7 builder states), 3 runs per commit; `lib-f*-run*` extra `/library`-only runs |
| `screenshots/tf*-run*` | all 20 tutorial steps x 2 viewports (`tools/capture-tutorial.mts`), 3 runs |
| `screenshots/sf*-run*` | 41 call-site scenes (`tools/capture-sites.mts`), 3 runs |
| `screenshots/sbf*-run*` | DS1's harness on Storybook (`tokens-`, `atoms-button--`, `atoms-text--`), 2 runs |
| `screenshots/cross-*.md`, `compare/`, `diff-*` | exact RGBA matrices, DS1 compare tables, diff images |
| `tools/` | every script used |

Earlier sets (on `995df0dee`/`cbb6ef5b2`/`0d59f5c2d`) are in this branch's history.
