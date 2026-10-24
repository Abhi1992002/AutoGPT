# SECRT-3111 (DS5g part 1, copilot/components) evidence

Not part of the repository. Evidence for the PR's description.

- Base: `dev` @ 6e5579086 (a `git worktree`). Head: 831b5f603 (dev merged into the branch).
- `before/`, `after/`, `after-repeat/`: production builds (`NEXT_PUBLIC_PW_TEST=true pnpm build && pnpm start`) plus `build-storybook`, the same backend (built from that dev), database and user, 1440x900 and 390x844, captured with `harness/screenshot-pages-ds5g.ts` (DS1's script plus the fixes in `harness/screenshot-pages-ds5g.diff`).
- The test user's greeting is marked done through the API (`POST /api/onboarding/brain-dump/intro/complete`) before all three runs. Without it the intro card races: `route-recapture/` shows an earlier head-vs-head run of one commit, where `/copilot` and `/home` differed.
- `diff-*/`: pixelmatch diff images (threshold 0). `compare-*.md`: per-screenshot changed-pixel counts.
- `variants/`: `copilot-artifactpanel--mobile`, 25 fresh loads per side, both viewports.
- `equivalence/`: every exact class string the PR writes (`equivalence-pr.md`), the loaders (`loaders.md`), DS1's script (`ds1/`).
- `counts/`: `oxlint -f unix` output with DS4's `.oxlintrc.strict.json` from 1ee6580dc (never committed).
