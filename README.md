# Evidence for SECRT-3114 (DS8) — AttentionCard

PR head `d3c00d5434b939cbe9447e474fd7351d3358362c`, base dev `995df0deeed4c6e17184344c47188312b536c35f`. Evidence only; never merged anywhere.

- `routes/pages-before`, `pages-before2`: base app (production build, `NEXT_PUBLIC_PW_TEST=true`), two full runs of 16 routes x 2 viewports.
- `routes/pages-head-1..3`: head app, three full runs. `routes/diff-*`: pixel diffs for every pair (DS1 `screenshot-pages.ts compare`, threshold 0).
- `stories/sb-before`: dev Storybook (+ `AttentionCardConsumers.stories.tsx` copied in). `sb-after`, `sb-after2`: head Storybook, two runs. `sb-diff` / `diff-*`: diffs. `aq-*`: re-takes of `copilot-approvalqueue--named-team-change` (base x2, head x2).
- `interact/`: rule 17 (b) — before/after/diff per interactive state, `aria__*.yml` (head ARIA snapshot; a `__BASE` file would exist only if it differed), `interact.md` table.
- `equivalence/`: `equivalence.md` (34 class strings, 49 comparisons, 0 failing), the pair list and the runner (DS1's method), `stress.ts` (why muted/caution icons keep flex-shrink 1), `bbox.ts` (changed-pixel boxes).
- `harness/`: interaction harness, story error-screen probe, data-slot class cross-check, strict-count script.

- `interact-2872787/`, `stories-2872787/` (AttentionCard + consumer stories, base once, head twice), `harness/slots-*.txt` (rendered data-slot class strings on both heads, identical): re-run on head `2872787`.

## Head 54b93af (merge of dev f040a0c) — current evidence
- `routes/m-pages-base` (dev f040a0c, `next build --no-lint`), `routes/m-pages-head-1`, `m-pages-head-2` (head 54b93af); `routes/compare-*.md` + `routes/diff-m-*`.
- `stories/m-sb-before` (dev f040a0c Storybook + consumer stories), `stories/m-sb-after`, `m-sb-after2` (head); `stories/compare-m-*.md` + `stories/diff-m-*`.
- `interact-54b93af/`: rule 17 (b) states, ARIA snapshots, Tab order.
- `equivalence/equivalence-54b93af-vs-f040a0c.md` (pairs in `pairs.ts`; the pre-merge pairs against 995df0d in `pairs-995df0d.ts`).

## Head 9ed333b / d1040b3 (merge of dev 0d5ac32) — current evidence
- `routes/n-pages-base` (dev 0d5ac32), `routes/n-pages-head-1`, `-2` (head d1040b3; 9ed333b is whitespace-only on top), `routes/diff-n-*`.
- `stories/n-sb-before` (dev 0d5ac32 + consumer stories), `stories/n-sb-after`, `-2` (head), `stories/diff-n-*`; `stories/naq-*`: approval-queue re-takes (base x2, head x2), 0 px.
- `interact-d1040b3/`: rule 17 (b), 82 states + 11 keyboard/aria checks, 0 differing.
- `equivalence/equivalence-d1040b3-vs-0d5ac32.md` (33 strings, 48 comparisons, 0 failing); `classcheck.ts` (all 40 "new" strings rendered verbatim in the head DOM).
