# Evidence for SECRT-3113 DS3b part 2 (stack of 7 PRs)

Never merged; nothing here is in the PR branches.

Stack SHAs (base dev first): 995df0dee → cfc0bde3b (accordion) → e07df3d27 (collapsible) → d2b1b0746 (scroll-area) → 345297fa7 (sheet) → a9c2fec4d (sidebar) → a8483db66 (input-group) → 13978761a (effects).

- `counts/<sha>-<dir>.unix.txt`: `pnpm exec oxlint -c .oxlintrc.strict.json -f unix <dir>` with DS4 `1ee6580dc`'s strict config overlaid in a throwaway worktree.
- `equivalence/`: input-group class strings as rendered (`harness/eq/render.tsx`) and the computed-style comparison (`harness/eq/compare.ts`): 71 pairs, 426 cases, 0 failing.
- `shots/run1-<sha>/`: DS1 `scripts/screenshot-pages.ts` route and story captures plus `harness/interact.ts` interaction captures and keyboard logs. `shots/run2-995df0dee/` is the determinism run. `shots/diff-prN/` holds the diff images.
- `compare/compare-prN.md`: DS1 `compare` output per PR (base = the PR below it).
