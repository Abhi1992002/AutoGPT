# Evidence for Significant-Gravitas/AutoGPT#16081 (DS7-1, data-slot on atoms)

Evidence only. Nothing here is merged anywhere.

- base (dev): `6e55790861139274e3853a400602742620007902`
- head: `7e5c06bb51ccf49c8de9a4d359b6dbdf871eaecc`
- harness: `autogpt_platform/frontend/scripts/screenshot-pages.ts` (DS1, unmodified), production builds with `NEXT_PUBLIC_PW_TEST=true`, 1440x900 and 390x844, pixel diff at threshold 0
- environment: `agpt.co` (216.150.0.0/16) rejected for both SHAs, so `/api/changelog` returns 502 and the timing-dependent "What's new" popup never renders (see the PR body)

| folder | what |
|---|---|
| `pages/app-before*`, `pages/app-after*` | 14 harness default routes, 2 runs per SHA |
| `pages/extra-*` | `/artifacts`, `/settings/billing`, `/settings/bots`, `/settings/memory`, `/settings/creator-dashboard`, 2 runs per SHA |
| `pages/diff-*` | diff images (red = changed pixel) |
| `stories/sb-before`, `stories/sb-after` | all 410 capturable stories (`atoms-progress--live` is the standing skip) |
| `stories/sbx-*`, `stories/art-*` | extra runs of the story groups that vary on the same commit |
| `interactive/ix-*` | QUALITY 17 (b) states: one PNG per step plus a JSON of the DOM state (focused element, open popups, body HTML with data-slot and generated ids stripped) |
| `reports/min-pair-*.md` | per shot: the smallest dev/head diff over every run pair, plus the diffs between runs of the same commit |
| `reports/compare-*.md` | harness `compare` output per run pair |
| `scripts/` | `min-pair.ts`, `interactive.ts`, `capture-stories.sh` |
