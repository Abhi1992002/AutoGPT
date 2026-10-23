# SECRT-3110 (DS5f) evidence — not code

Base dev `447fd55be6ee25bc6a71687b607865dd66214782`, head `3d0a2fd82be374bee99835a467128e123a08b931` (screenshots from the byte-identical build of `09c453a3c`, see `build-identity/`) (`abhi/tokenise-admin`).

- `before/` — production build of dev (git worktree), `after/` and `after-repeat/` — production build of the head, captured twice. DS1's `scripts/screenshot-pages.ts capture`, unchanged, run through `scripts/capture.sh` (batches of 5 routes, fresh sign-in each; preload `scripts/freeze-server-timestamps.cjs` pins the diagnostics `timestamp` field). Routes: `scripts/routes.txt`.
- `diff/`, `compare-before-after.md` — before vs after, threshold 0: 66 screenshots, 0 with differences.
- `diff-repeat/`, `compare-determinism.md` — after vs after-repeat (same commit twice): 66 screenshots, 0 with differences.
- `equivalence/equivalence-exact.md` — every exact class string the PR writes (97), every computed property compared (`scripts/eq-admin.ts`); `equivalence-exact-condensed.md` is the PR-body view. `ds1-*` — DS1's `check-token-equivalence.ts --base <dev>` on the head, and the same script on untouched dev (same 2 Sidebar failures).
- `lint/` — `pnpm exec oxlint -c .oxlintrc.strict.json -f unix "src/app/(platform)/admin"` with DS4 1ee6580dc's strict config overlay, base and head; `restyle-hits.txt` lists the 206 `no-restyle` hits that wait for DS2a.
- `todo-tokens.txt` — every `TODO(tokens)` note in the directory on the head.
- `codemod-output.txt` — the codemod's dry-run output (191 replacements, 0 skipped).
