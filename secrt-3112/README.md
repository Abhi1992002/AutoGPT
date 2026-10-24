# SECRT-3112 (DS3a part 3: input and button) evidence

Stack: #16091 (input, head `6b5a42e36`, base dev `995df0dee`) → #16092 (button, head `6f67fa0e2`). Evidence only, not code.
All runs are production builds (`NEXT_PUBLIC_PW_TEST=true pnpm build && pnpm start`) of `git worktree`s of each SHA against one local backend, signed in as one admin test user, with the same seeded data (one 500-credit grant, one pending store submission "Evidence workflow", one API key). Storybook: `pnpm build-storybook` per SHA, served statically.

| folder | what |
| --- | --- |
| `stories/` | DS1 `scripts/screenshot-pages.ts` story captures: `tokens-,atoms-,molecules-dialog` (`dev-run1`, `pr1-run1-stories`, `pr1-run2`, `pr2-run1`, `pr2-run2`) and `molecules-,organisms-,renderers-` (`*-ext`) |
| `routes/` | DS1 route captures (18 routes × 2 viewports): `dev-c`, `dev-d` (clean dev build), `pr1-a`, `pr1-b`, `pr2-a`, `pr2-b`; `flaky/` 3 more samples of `/copilot,/home,/team` per SHA; `dev-a` is the first dev build, which was broken (see below) |
| `interactions/` | `harness/interactions.ts` runs: `*-int` (67 scenarios), `*-b2*` (13 builder scenarios), `twin-legacy` vs `pr2-legacy-*` (37 legacy-variant scenarios against a base twin story using the old `__legacy__/ui/button`); each has PNGs and `facts.json` |
| `diffs/` | diff PNGs for every comparison that had any |
| `reports/` | every compare report (`compare-*` DS1 compare, `cmp-*` interactions, `match-*` DS2a match-sets, `noise-*` noise boxes), capture logs |
| `equivalence/` | DS2a render harness output (`pr1/`, `pr2/`), DS1 equivalence script logs, negative check |
| `strict/` | DS4 1ee6580dc strict oxlint output per SHA (`995df0dee`, `6b5a42e36`, `15a14198a`, `6f67fa0e2`) |
| `harness/` | collectors, compare scripts, run scripts |

The first dev build (`routes/dev-a`, `interactions/dev-a-int`, `dev-b2`) reused a `.next` cache left by an OOM-killed build and threw during SSR (`Cannot read properties of undefined (reading 'ENABLE_PLATFORM_PAYMENT')`, `(reading 'oauth2')`), so its pages were client-rendered and the sidebar's entrance animation finished; a clean rebuild (`rm -rf .next`) has no SSR errors and matches the PR builds (`reports/app-runs2.log` probes). Comparisons use the clean build (`dev-c`, `dev-d`).
