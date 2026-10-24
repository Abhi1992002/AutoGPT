# Evidence for SECRT-3113 DS3b part 2 (stack of 7 PRs)

Never merged; nothing here is in the PR branches.

Stack SHAs (base dev first, after merging dev 0d5ac323f): 0d5ac323f → 9bf3e4240 (accordion) → 3be8ded01 (collapsible) → ea7601a36 (scroll-area) → 52af88a46 (sheet) → 74b35c2b7 (sidebar) → 795a2dfac (input-group) → ac42a30d1 (effects). Earlier heads (995df0dee …) are kept in git history of this branch.

- `counts/<sha>-<dir>.unix.txt`: `pnpm exec oxlint -c .oxlintrc.strict.json -f unix <dir>` with DS4 `1ee6580dc`'s strict config overlaid in a throwaway worktree.
- `equivalence/`: input-group class strings as rendered (`harness/eq/render.tsx`) and the computed-style comparison (`harness/eq/compare.ts`): 71 pairs, 426 cases, 0 failing.
- `shots/run1-<sha>/`: DS1 `scripts/screenshot-pages.ts` route and story captures plus `harness/interact.ts` interaction captures and keyboard logs. `shots/run2-995df0dee/` is the determinism run. `shots/diff-prN/` holds the diff images.
- `compare/compare-prN.md`: DS1 `compare` output per PR (base = the PR below it).
