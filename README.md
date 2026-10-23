# Evidence for SECRT-3108 (DS5d): team and marketplace onto colour and text tokens

Evidence-only branch. Never merged; not part of the PR's branch.

- Base: `dev` at `447fd55be6ee25bc6a71687b607865dd66214782` (DS1 #16023), the PR's merge base.
- Head: `e0f05a266` on `abhi/tokenise-team-and-marketplace`.

## Contents

| path | what |
| --- | --- |
| `counts/` | strict lint, `pnpm exec oxlint -c .oxlintrc.strict.json <dir>` (`| wc -l` and `-f unix`), base and head, with the overlay config taken from DS4 `1ee6580dc` (never committed) |
| `equivalence/ds1-check-token-equivalence.txt` | DS1's `scripts/check-token-equivalence.ts` at head (the 2 sidebar HSL failures are DS1's own pairs and fail identically on untouched dev) |
| `equivalence/pr-equivalence.md` | every exact class string this PR writes (old/new), rendered at a 16px root in parents at `leading-[30px]` and `leading-[1.5]`, plain and inside the profile-tabs panel, at 1440 and 390, in 6 states, as written and through `cn()` |
| `equivalence/pr-equivalence-merged.md` | rule 14: the `cn()`-merged class string on the real element (`<Text variant>`, `<CategoryTag>`, `<TabsLineTrigger>`, incl. dev's new TabsLine base `8a6b5b40a`) |
| `equivalence/token-equivalence.md` | the same per old→new token |
| `equivalence/style-equivalence.md` | the inline-style value changes (`color-mix` bases, gloss gradient) for every category colour, computed values and pixels |
| `equivalence/negative-control.md` | 4 deliberately wrong swaps, all caught; the right one passes |
| `screenshots/base-run{1,2,3}`, `head-run{1,2,3}` | DS1's `scripts/screenshot-pages.ts capture`, 3 runs per commit, 128 captures each (58 app = 29 routes x 1440x900/390x844, 70 stories) |
| `screenshots/compare/` | DS1's `screenshot-pages.ts compare` (threshold 0) for all 9 base x head pairs and head/base determinism |
| `screenshots/diff-base-run3-vs-head-run2/` | diff images of the all-zero pair |
| `screenshots/diff-base-run1-vs-head-run1/` | diff images of the first runs (2 non-zero, both the sidebar race) |
| `screenshots/cross-matrix.md` | exact RGBA diff of every capture for every base x head pair |
| `screenshots/sidebar-race.png` | the app sidebar's entrance landing blurred or sharp at random on the same commit |
| `tools/` | the scripts that produced all of the above |
| `logs/` | head run 1, first attempt: DS1's harness timed out dismissing a first-visit drawer on /build at 390px; the run was retaken in full |
