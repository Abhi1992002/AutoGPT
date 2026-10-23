# SECRT-3111 (DS5g part 1, copilot/components) evidence

Not part of the repository. Evidence for the PR's description.

- Base: `dev` @ 447fd55be6ee25bc6a71687b607865dd66214782 (a `git worktree`).
- Head: 0fd57e0d0. Builds and captures ran at 0af5418d7. 0fd57e0d0 changes only one code comment (TaskProgressBar.tsx:90).
- `before/`, `after/`, `after-repeat/`: production builds (`NEXT_PUBLIC_PW_TEST=true pnpm build && pnpm start`) plus `build-storybook`, the same backend and database, 1440x900 and 390x844.
- `diff-*/`: pixelmatch diff images (threshold 0). `compare-*.md`: per-screenshot changed-pixel counts.
- `variants/`: `copilot-artifactpanel--mobile` loaded 10 times per side, both viewports. See the PR's screenshot section.
- `equivalence/`: `equivalence-pr.md` (every exact class string the PR writes), `loaders.md` (CSS modules to classes), `ds1/` (DS1's `scripts/check-token-equivalence.ts` output).
- `harness/`: the scripts used. `screenshot-pages-ds5g.diff` is the exact change against DS1's `scripts/screenshot-pages.ts`.
- `counts/`: `oxlint -f unix` output with DS4's `.oxlintrc.strict.json` from 1ee6580dc (never committed).
