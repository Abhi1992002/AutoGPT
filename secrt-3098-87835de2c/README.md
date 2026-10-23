# SECRT-3098 (DS9) screenshot evidence, refreshed against ds/w1-base 87835de2c

PR head ee3606200 (this branch merged ds/w1-base 87835de2c in b6705f6db; the diff against the base is 3 Markdown files). Base: a `git worktree` of 87835de2c. `src/` (with the generated API client) is byte-identical in the two checkouts.

Harness: DS1's `autogpt_platform/frontend/scripts/screenshot-pages.ts` as committed on the base, unmodified. `capture` then `compare` (pixelmatch, threshold 0, anti-aliased pixels counted), 1440x900 and 390x844. Production builds with `NEXT_PUBLIC_PW_TEST=true`, the backend in docker rebuilt from 87835de2c, one signed-in user, 17 marketplace listings. Storybook from `pnpm build-storybook` of each checkout, built one at a time. 96 screenshots per set: 13 app routes and 35 stories, each at both viewports.

Sets: `warmup-base/` then `before/` and `before-repeat/` (base), `warmup-head/` then `after/` and `after-repeat/` (head). The warm-up runs absorb the servers' first, cold requests.

| comparison | screenshots with differences |
| --- | --- |
| before-repeat -> after (base -> head) | **0 of 96** |
| before -> after-repeat (base -> head) | 1 (`app__team__desktop`, 6308 px) |
| before -> after (base -> head) | 2 (`app__marketplace__desktop` 6014 px, `app__team__desktop` 6308 px) |
| before-repeat -> after-repeat (base -> head) | 1 (`app__marketplace__desktop`, 6014 px) |
| before -> before-repeat (base -> base) | 2 (the same two, the same counts) |
| after -> after-repeat (head -> head) | 1 (`app__marketplace__desktop`, 6014 px) |

Every head capture is pixel-identical to one of the two base captures of the same screenshot. The only two screenshots that ever differ do so between two runs of the same build, by the same counts: the desktop sidebar's nav icons are either crisp or blurred (`sidebar-states-*.png`, columns before / before-repeat / after / after-repeat).

Cause (an app bug, on base and head alike, not in this PR): the harness emulates `prefers-reduced-motion: reduce`. AppSidebar's items are server-rendered with the full-motion `hidden` variant (`opacity 0, translateY(8px), blur(4px)`); on the client `useReducedMotion()` is true, so the reduced `show` variant animates opacity only and the SSR `filter` and `transform` stay inline. Whether a load hits it depends on hydration timing. `reduce` cannot be dropped for these captures: the integrations and API-key empty-state marquees stop only under it.
