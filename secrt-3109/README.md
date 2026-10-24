Evidence for Significant-Gravitas/AutoGPT PR "DS5e: library, artifacts and (platform)/components onto design tokens" (SECRT-3109). Not code. Nothing here is on the PR branch.

Base: dev 447fd55be (DS1 #16023). Head: 86b10f672 (all captures, both equivalence runs and the strict counts are at this SHA).

App: production builds (`NEXT_PUBLIC_PW_TEST=true pnpm build && pnpm start`) of each side against the same local backend (docker compose) and the same seeded data:

- 2 workflows with 3 completed runs and a schedule
- 1 library folder
- 2 workspace files and a workspace folder

Four test users:

- main (seeded)
- intro (fresh, so the tab intro cards open)
- moved (createdAt 2026-06-01, so the "Your agents have moved" notice opens)
- empty (no workflows and no files, so both empty-state illustrations render)

Before every run each user's first-visit state (`UserOnboarding.completedSteps`) is reset to the same value, so every run starts from the same state.

Folders (`before/` = base, `after/` = head, `after-repeat/` = a second capture of the head):

- `main/`, `intro/`, `moved/`, `empty/`: DS1 `scripts/screenshot-pages.ts capture`, unchanged, at 1440x900 and 390x844.
- `states/`: `capture-states.mts` (in this folder), the same viewports, Chromium flags and pinned clock as DS1's harness. Each capture is viewport-only, with motion not reduced, and taken once every finite animation has finished. It reaches what DS1's harness can't:
  - its reduced-motion emulation leaves /artifacts at `blur(8px)` (pre-existing app bug);
  - its full-page resize restarts framer-motion entrances.
- `stories/`: DS1 harness against `storybook build` of each side, with DS1's default story set (tokens-, atoms-button--, atoms-text--) and the standing skip `atoms-progress--live`.
- `diff-before-after/`, `diff-after-repeat/`: pixelmatch diff images (threshold 0, anti-aliasing included). No red pixel means no difference.
- `compare-*.md`: changed-pixel counts per screenshot.
- `equivalence/`: DS1 `scripts/check-token-equivalence.ts` output (`equivalence.md`, swatches).
- `diff-equivalence/`: `diff-equivalence.mts` output. It covers every class string the PR changed, as written, through `cn()` and merged into `<Text>`, with all states switched on. It also covers the SVG paint pairs and the SitrepItem spinner frames.
