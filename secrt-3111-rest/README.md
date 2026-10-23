# SECRT-3111 DS5g part 3 (copilot rest): evidence, not code

PR branch `abhi/tokenise-copilot-rest`, head `507d46a68fa77de0ca8b545bca7f85169319c518`,
base dev `ea02ff739cf38fd6f16dd3008725d5594daedd3a`.

- `before/`: dev SHA, `after/`: head SHA, `before-rerun/`: dev SHA again (determinism).
  Production builds with `NEXT_PUBLIC_PW_TEST=true NEXT_PUBLIC_FORCE_FLAG_COPILOT_VOICE_MODE=true`,
  served with `pnpm start` on :3000 against the same local backend and test user.
- `app__*`: DS1's `scripts/screenshot-pages.ts capture` (1440x900 and 390x844).
  `state__share-dialog__*`: `harness/extra-states.ts` (same Chromium args, viewports,
  clock, reduced motion and 3-identical-shots rule), the Share dialog opened from the sidebar.
- `diff/`, `diff-determinism/`: `screenshot-pages.ts compare` diff PNGs; totals in the two
  `compare-*.txt` files (36 screenshots each, 0 with differences).
- `equivalence/`: DS1's `check-token-equivalence.ts --base <dev worktree>` output and its
  table (`equivalence.md`, swatches), the same script on dev against itself, and the
  per-string harness output (`per-string-equivalence.md`, cell screenshots).
- `counts/`: `oxlint -c .oxlintrc.strict.json -f unix` over the 206 in-scope files, strict
  config from DS4 1ee6580dc, on the base and head SHAs.
- `harness/`: the throwaway scripts used (never committed to the PR branch).
