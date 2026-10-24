# Evidence for SECRT-3118 (DS5h): the flow editor (`build/**`) onto colour and text tokens

Evidence-only branch. Never merged; not part of any PR branch.

- Base: `dev` at `995df0deeed4c6e17184344c47188312b536c35f` (the stack's merge base).
- PR 1 head `cbb6ef5b2` (`abhi/tokenise-flow-editor`), PR 2 head `23035dac0` (`abhi/tokenise-flow-editor-canvas`).

| path | what |
| --- | --- |
| `counts/` | `pnpm exec oxlint -c .oxlintrc.strict.json "src/app/(platform)/build"` (`| wc -l` and `-f unix`) at base and each head, strict config from DS4 `1ee6580dc` overlaid in a throwaway worktree |
| `equivalence/ds1-check-token-equivalence-pr1.txt` | DS1's `scripts/check-token-equivalence.ts` at PR 1's head against dev; `ds1-check-on-dev-995df0dee.txt` is the same script on untouched dev (same 2 sidebar failures) |
| `equivalence/pr1-equivalence.md`, `pr2-equivalence.md` | every exact class string each PR writes, incl. the `cn()`-merged `<Text>` rows, rendered at a 16px root in `leading-[30px]`/`leading-[1.5]` parents, plain and in the profile-tabs panel, 1440/390, 6 states, as written and through `cn()` |
| `equivalence/pr1-badge-merged.md` | rule 14: the `cn()`-merged legacy `Badge` rows for the three `leading-inherit` strings |
| `equivalence/css-equivalence-p2.md` | `flow.css` + `tutorial.css` compiled base vs head with Tailwind, every computed property of a mock canvas and tour in default/hover/active, plus the pulse keyframes |
| `equivalence/negative-control.md`, `css-negative-control.md` | deliberately wrong swaps, all caught |
| `equivalence/same-output-pr1.txt`, `same-output-pr2.txt` | every changed file compiled with TypeScript (comments dropped) at base and head: the only differences are class strings, `<Text>` moves and removed dark-only `className`s |
| `equivalence/todo-audit.txt` | every raw colour left in scope carries a `TODO(tokens)` |
| `screenshots/<commit>-run<n>/` | DS1's `scripts/screenshot-pages.ts capture` (15 routes x 2 viewports) plus `tools/capture-extra.mts` (7 builder interaction states x 2 viewports), 3 runs per commit |
| `screenshots/sb<commit>-run<n>/` | DS1's harness on Storybook (`tokens-`, `atoms-button--`, `atoms-text--`, 36 stories x 2 viewports), 2 runs per commit |
| `screenshots/cross-*.md` | exact RGBA diff of every capture for every before-run x after-run pair, min per capture |
| `screenshots/diff-*` | DS1 `compare` diff images |
| `screenshots/p1b-run*`, `sbp1b-run1` | #16099's head recaptured after the sandbox VM restarted, the "before" of part 2 |
| `screenshots/p2-run*`, `sbp2-run*` | part 2's head |
| `screenshots/b2-run*`, `q1-run*`, `q2-run*` | second session (after the VM restart): base `995df0dee`, #16099 `0d59f5c2d`, #16103 `0a3a2b585` |
| `screenshots/tb-run*`, `tq1-run*`, `tq2-run*` | all 20 tutorial steps x 2 viewports, base / #16099 / #16103 (`tools/capture-tutorial.mts`) |
| `rule15-pr1.txt`, `rule15-pr2.txt` | the rule-15 grep over every file each PR touches |
| `tools/` | every script that produced the above |
