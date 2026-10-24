# Evidence for SECRT-3108 (DS5d): team and marketplace onto colour and text tokens (#16056)

Evidence-only branch. Never merged; not part of the PR's branch. This commit replaces the files of `fc9bb0a` (evidence against the first base `447fd55be`, still reachable in this branch's history).

- Base: `dev` at `f0ae7dfd4ad6d9761f3cca848e385e84d35ee781`, merged into the PR before it entered the queue.
- Head: `1f412f9a9` (the PR's final head; squash-merged to dev as `995df0dee`).
- Post-merge: `cbb2ebd2b` (dev with DS2a, just before #16056) vs `995df0dee`, class strings only (`equivalence/postmerge-ds2a-*`).

| path | what |
| --- | --- |
| `counts/` | strict lint (`| wc -l`, `-f unix`) for base and head, overlay config from DS4 `1ee6580dc` (never committed) |
| `equivalence/ds1-check-token-equivalence.txt` | DS1's script at head with `--base` = dev `f0ae7dfd4` (its 2 sidebar HSL pairs fail identically on dev) |
| `equivalence/pr-equivalence.md` / `-merged.md` | every class string the PR writes; the `cn()`-merged string on the real element (rule 14) |
| `equivalence/token-equivalence.md` | per old→new token |
| `equivalence/style-equivalence.md` | inline-style value changes x every category colour |
| `equivalence/negative-control.md` | 4 wrong swaps caught |
| `equivalence/postmerge-ds2a-*.md` | the same class strings merged into DS2a's new `Text` variants (cbb2ebd2b vs 995df0dee) |
| `screenshots/base-run{1..4}`, `head-run{1..3}` | DS1's `screenshot-pages.ts capture`, 128 captures each (29 routes + 35 stories x 1440x900/390x844) |
| `screenshots/compare/` | DS1's `compare` (threshold 0), all 12 base x head pairs and every same-commit pair |
| `screenshots/cross-matrix.md` | exact RGBA diff per capture per base x head pair |
| `screenshots/diff-base-run4-vs-head-run1/` | diff images of the closest pair |
| `screenshots/sidebar-race.png` | the app sidebar entrance landing blurred or sharp at random, same commit |
| `logs/expertchatdrawer-shard3/` | `vitest run --coverage --shard=3/4` x3 on the merged head and on plain dev `f0ae7dfd4`: the merge-group timeout reproduces on dev |
| `tools/` | the scripts behind all of the above |
