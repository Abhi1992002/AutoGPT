// Preload for DS1's screenshot-pages.ts (loaded with NODE_OPTIONS=--require,
// the script itself is unchanged). The admin diagnostics cards print
// "Last updated: <timestamp>" from the backend's own clock, which differs on
// every run. Every page this harness opens gets a route that sets that one
// field to the harness's pinned time, so the same commit renders the same
// pixels twice. Applied identically to the before and after runs.
const path = require("path");
const { createRequire } = require("module");
const fe = "/home/vercel-sandbox/autogpt/autogpt_platform/frontend";
const fromFe = createRequire(path.join(fe, "package.json"));
const fromTest = createRequire(fromFe.resolve("@playwright/test/package.json"));
const fromPw = createRequire(fromTest.resolve("playwright/package.json"));
const core = path.dirname(fromPw.resolve("playwright-core/package.json"));
const { BrowserContext } = require(path.join(core, "lib/client/browserContext.js"));
const FIXED = "2026-01-15T12:00:00.000Z";
const original = BrowserContext.prototype.newPage;
BrowserContext.prototype.newPage = async function (...args) {
  const page = await original.apply(this, args);
  await page.route("**/admin/diagnostics/**", async (route) => {
    const response = await route.fetch();
    let body = await response.text();
    try {
      const json = JSON.parse(body);
      if (json && typeof json === "object" && "timestamp" in json) {
        json.timestamp = FIXED;
        body = JSON.stringify(json);
      }
    } catch {}
    await route.fulfill({ response, body });
  });
  return page;
};
