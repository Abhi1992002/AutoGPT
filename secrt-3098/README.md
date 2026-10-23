# SECRT-3098 (DS9) screenshot evidence

Evidence for Significant-Gravitas/AutoGPT PR "docs(frontend): add the design-system rules doc and a Taste block". The PR changes only Markdown, so nothing rendered may change.

Harness: `autogpt_platform/frontend/scripts/screenshot-pages.ts` (DS1), `capture` then `compare` (pixelmatch, threshold 0, anti-aliased pixels counted). Viewports 1440x900 and 390x844. Production builds with `NEXT_PUBLIC_PW_TEST=true` (`pnpm build && pnpm start`), backend in docker, one signed-in test user, 17 marketplace listings from `load-store-agents`. Storybook from `pnpm build-storybook` of each checkout. Same database and harness for every run.

- base = `origin/ds/w1-base` 2ab504f25 (a `git worktree`); head = `ds/w1-secrt-3098-ds9-rules-doc` e808abecf.
- `before/` base run 1, `before-repeat/` base run 2, `after/` head run 1, `after-repeat/` head run 2. 94 screenshots each: 13 app routes and 34 stories, at both viewports.
- `compare-before-repeat-vs-after.md`: base to head, 0 changed pixels on all 94.
- `compare-after-vs-after-repeat.md`: head to head, 0 on all 94.
- `compare-before-vs-before-repeat.md`: base to base, 2 differ (`app__marketplace__desktop` 100276 px, `app__library__desktop` 432 px). Base run 1 was the servers' first, cold run: the "What's new" changelog popup, which fetches agpt.co and appears after a delay, had not shown yet on /marketplace, and the sidebar logo was not in its hover state. `compare-before-vs-after.md` shows the same two, by the same counts. Code is identical in all four runs.
- `diff-*/` hold a diff PNG per screenshot; no red pixels means no difference.
