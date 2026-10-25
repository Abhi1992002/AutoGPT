# DS7-1 evidence, deterministic run (det.cjs)

- `pr2a/`: #16131 at `d87acdfc43fc06ea26e668032217613e866c5893` vs dev `0d5ac323f`: pages (app-dev 1–4, app-2a 1–2), Storybook (sb-dev, sb-dev2, sb-2a, sb-2a2), external-link dialog (lm-*; asserts.json).
- `pr2b/`: #16134 at `7b25bf83aa011df1bee6aa8f4d5cacfaa31a2336` vs dev `0d5ac323f`: pages (app-dev 1–4, app-2b 1–4), team states (ts-dev, ts-dev2, ts-2b, ts-2b2; per-state png, computed-style json, asserts.json), Storybook (sb-2b, sb-2b2; dev runs under pr2a), DesktopStreamPreview on a dev build with the same story file (ds-*), atom interactive harness (ix-*), equivalence (eq/old.json, eq/new.json, element shots), compare-*.md and min-pair-*.md, diff-* (only shots that differ), CALLSITES.md.
- `scripts/`: the harnesses (det.cjs is the shared deterministic setup) and the pill-edge reproductions (edgetest*.cjs, edgew.cjs).
