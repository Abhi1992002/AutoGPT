The screenshots were captured from the production build of `09c453a3c`. `3d0a2fd82` adds two test files only.
Both builds hashed (`.next/static` and `.next/server` `.js/.css/.html/.rsc`, build ID masked):
- all 622 `static/` files (every client JS and CSS chunk): identical;
- `server/`: the only differing files are the 86 `*_client-reference-manifest.js`, `server-reference-manifest.js` and the prerendered `pages/500.html`, which carry per-build values; no page or component module differs.
