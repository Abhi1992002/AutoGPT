# DS2b (SECRT-3103) evidence — molecules read only role tokens

Evidence only; never merged. PR head 544f72da375ccbb3bcbed1d4230eb02fafa82aa6, base dev 447fd55be6ee25bc6a71687b607865dd66214782.

- `screenshots/before` (dev), `before-2` (dev again, determinism), `after` (head): `scripts/screenshot-pages.ts capture` against the running app (NEXT_PUBLIC_PW_TEST build + docker backend, signed in) and static Storybook. `diff/`, `diff-determinism/`: per-image diff PNGs. `compare-*.md`: compare output.
- `screenshots/interact-*`: supplementary captures of states that need a click or hover (toasts, menus, dialogs, tooltips, hover), `harness/interact-shots.ts`.
- `equivalence/`: DS1 `scripts/check-token-equivalence.ts` output, and the full per-class-string table from `harness/check-molecules.ts`.
- `counts/`: `oxlint -c .oxlintrc.strict.json -f unix src/components/molecules`, strict config from DS4 1ee6580dc.
