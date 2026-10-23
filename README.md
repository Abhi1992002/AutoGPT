# Evidence for SECRT-3104 (DS2c, organisms on DS1 tokens)

Evidence only; never merged. Base dev 447fd55be6ee25bc6a71687b607865dd66214782, head ac9235c6f3581e8b651cad6283f504d6f89fb47a.

- `shots/before` (dev), `shots/after` (head), `shots/diff` (before vs after, 150 at 0 px), `compare-before2-after.md`
- `shots/after-determinism`, `shots/diff-determinism`, `compare-determinism.md` (head twice, 150 at 0 px)
- `shots/before-first-session`, `shots/diff-first-session`, `compare-first-session.md`: the first dev capture on a fresh account (3 app-chrome differences, reproduced dev against dev)
- `equivalence-organisms.md`: every class string the PR writes, every resolved property (`tools/check-class-strings.ts`)
- `equivalence-ds1/`: DS1's `scripts/check-token-equivalence.ts --base <dev>` output, run unchanged
