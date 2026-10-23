# SECRT-3107 (DS5c) evidence

PR head `75e3c7778e51b32c793e881747d43acd1d107fa9`, base `447fd55be6ee25bc6a71687b607865dd66214782` (dev, DS1).

- `before/` base build, `after/` head build, `after-repeat/` head build again (determinism). Each run starts
  from the same database state (`harness/reset.sh`: visiting `/build` saves a new graph version).
- `diff-*` pixel diffs from `scripts/screenshot-pages.ts compare` (threshold 0); `compare-*.md` the tables.
- `app__*`/`story__*` from DS1's `scripts/screenshot-pages.ts`; `extra__*` from `harness/capture-extra.ts`
  (dialogs and modals the route capture cannot open; same determinism settings).
- `repeat/`, `repeat2/`: 5 and 3 captures per side of the shots that vary run to run on the same commit.
- `equivalence/`: every changed class string, old against new, every computed property (`harness/equiv.ts`).
  `equivalence-negative/`: the same harness failing on known-bad swaps.
- `ds1-check-token-equivalence/`: DS1's script against the base worktree.
- `strict/`: `oxlint -c .oxlintrc.strict.json -f unix` (DS4 1ee6580dc) on base and head.
