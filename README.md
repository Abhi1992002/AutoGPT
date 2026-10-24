# Evidence for SECRT-3114 (DS8) — AttentionCard

PR head `d3c00d5434b939cbe9447e474fd7351d3358362c`, base dev `995df0deeed4c6e17184344c47188312b536c35f`. Evidence only; never merged anywhere.

- `routes/pages-before`, `pages-before2`: base app (production build, `NEXT_PUBLIC_PW_TEST=true`), two full runs of 16 routes x 2 viewports.
- `routes/pages-head-1..3`: head app, three full runs. `routes/diff-*`: pixel diffs for every pair (DS1 `screenshot-pages.ts compare`, threshold 0).
- `stories/sb-before`: dev Storybook (+ `AttentionCardConsumers.stories.tsx` copied in). `sb-after`, `sb-after2`: head Storybook, two runs. `sb-diff` / `diff-*`: diffs. `aq-*`: re-takes of `copilot-approvalqueue--named-team-change` (base x2, head x2).
- `interact/`: rule 17 (b) — before/after/diff per interactive state, `aria__*.yml` (head ARIA snapshot; a `__BASE` file would exist only if it differed), `interact.md` table.
- `equivalence/`: `equivalence.md` (34 class strings, 49 comparisons, 0 failing), the pair list and the runner (DS1's method), `stress.ts` (why muted/caution icons keep flex-shrink 1), `bbox.ts` (changed-pixel boxes).
- `harness/`: interaction harness, story error-screen probe, data-slot class cross-check, strict-count script.
