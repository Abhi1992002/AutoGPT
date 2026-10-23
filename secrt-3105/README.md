# SECRT-3105 (DS5a) evidence

Base: dev `ea02ff739cf38fd6f16dd3008725d5594daedd3a` (merge-base). Head: `c08f06dda`.

- `counts/`: strict-lint unix output (DS4 `1ee6580dc` config) for the four directories, base and head
- `equivalence/`: per written string (`pr-equivalence.md`), per class (`pr-equivalence-words.md`), cn()-merged with the host component (`pr-equivalence-merged.md`), run logs including the negative control
- `ds1-equivalence/`: DS1's `scripts/check-token-equivalence.ts --base <dev worktree>` output and swatches
- `shots/`: app pages, DS1 harness (`app__*`) + frozen-clock companion (`frozen__*`); `before/`, `after/`, `after-repeat/`, `diff-before-after/`, `diff-determinism/`, `compare-*.md`
- `stories/`: `Copilot/ApprovalQueue` stories (render home's AttentionRow / HeldReviewDialog), same layout
- `tools/`: the companion scripts used (not part of the PR)

A diff image with no red pixels means no difference.
