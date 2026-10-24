# SECRT-3111 (DS5g part 1, copilot/components) evidence

Not part of the repository. Evidence for the PR's description.

- Base: `dev` @ 39307828bab (a `git worktree`). Head: 7ca1dab38.
- `before/`, `after/`, `after-repeat/`: production builds (`NEXT_PUBLIC_PW_TEST=true pnpm build && pnpm start`) plus `build-storybook`, the same backend, database and user, 1440x900 and 390x844, captured with `harness/screenshot-pages-ds5g.ts` (DS1's script plus the fixes in `harness/screenshot-pages-ds5g.diff`).
- The 14 app routes were recaptured in all three runs after the test user's greeting was marked done through the API (`POST /api/onboarding/brain-dump/intro/complete`). The intro card otherwise races. `route-recapture/` shows the first run's flake: head vs head on the same commit.
- `diff-*/`: pixelmatch diff images (threshold 0). `compare-*.md`: per-screenshot changed-pixel counts.
- `variants/`: `copilot-artifactpanel--mobile`, 25 fresh loads per side, both viewports.
- `equivalence/`: every exact class string the PR writes (`equivalence-pr.md`), the loaders (`loaders.md`), DS1's script (`ds1/`).
- `counts/`: `oxlint -f unix` output with DS4's `.oxlintrc.strict.json` from 1ee6580dc (never committed).
