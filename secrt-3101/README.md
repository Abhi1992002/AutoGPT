# SECRT-3101 (DS2a) evidence: atoms on design tokens

Head `f33773884` of `abhi/move-atoms-onto-design-tokens`, base `dev` `447fd55be` (DS1 #16023). Evidence only; not code.

## Screenshots (DS1 `scripts/screenshot-pages.ts`, unchanged)

Production builds (`NEXT_PUBLIC_PW_TEST=true pnpm build && pnpm start`) of a `git worktree` of the dev SHA and of the head, against the same local backend and signed-in user. Storybook from `pnpm build-storybook` of each. Default routes, `--stories tokens-,atoms-`, at 1440x900 and 390x844 (the standing skip `atoms-progress--live` is the only one left out).

| folder | what |
| --- | --- |
| `before-dev-run1/`, `before-dev-run2/` | dev SHA, two captures |
| `after-head-run1/`, `after-head-run2/` | head, two captures |
| `diff-dev-run2-vs-head-run1/` | the comparison in the PR (`compare-dev-run2-vs-head-run1.md`) |
| `diff-head-run1-vs-head-run2/` | head determinism (`compare-head-run1-vs-head-run2.md`) |
| `diff-dev-run1-vs-dev-run2/` | dev determinism (`compare-dev-run1-vs-dev-run2.md`) |
| `compare-dev-run1-vs-head-run1.md` | the first dev run against head, for completeness |
| `overflowtext-probes/` | 5 more OverflowText captures per side (`p6006` dev, `p6007` head), ellipsis crops; `overflowtext-match.md` |

## Value equivalence (`equivalence/`)

- `ds1-check-token-equivalence-head-vs-dev.log`: DS1's script, head with `--base` the dev worktree. `…-dev-vs-dev.log`: the same script, dev against itself (the 2 sidebar rows fail there too).
- `harness/collect.ts` server-renders 1,954 atom cases from a checkout; `harness/compare.ts` compares the dev and head sets: A on every computed property of every element, B on every changed class string per variant scope. `final/` is its output on the head: `summary.txt`, `atomic-table.md` (the table in the PR), `compact-table.md`, `scope-table.md` (all 842 changed strings).
- `negative-check-*.log`: the same harness with a deliberate colour and line-height change, failing as it should.

## Strict lint

`strict-atoms-base-447fd55be.txt` and `strict-atoms-head-f33773884.txt`: `pnpm exec oxlint -c .oxlintrc.strict.json -f unix src/components/atoms`, with DS4's `1ee6580dc` config overlaid in throwaway worktrees.
