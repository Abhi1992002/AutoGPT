// Companion to DS1's scripts/screenshot-pages.ts for routes that never hold
// still or differ between two runs of the same commit (/raise animated
// backdrop, /copilot and /profile/settings avatars). Math.random is seeded. Same Chromium flags, viewports,
// context options and sign-in as DS1's harness; additionally installs
// Playwright's fake clock (Date, timers, requestAnimationFrame) at the same
// fixed time, paused before navigation, waits for the network, advances it
// exactly 30s in 1s steps (waiting for the network after each), and takes the shot once three in a row are identical. Used identically for before and after.
//   npx tsx capture-frozen.ts <outDir> <baseUrl> <route>...
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "../../autogpt_platform/frontend/node_modules/@playwright/test";

const ARGS = ["--disable-gpu", "--disable-gpu-rasterization", "--disable-partial-raster", "--num-raster-threads=1", "--disable-skia-runtime-opts", "--force-color-profile=srgb", "--font-render-hinting=none", "--disable-lcd-text"];
const VIEWPORTS = [{ name: "desktop", width: 1440, height: 900 }, { name: "mobile", width: 390, height: 844 }];
const FIXED_TIME = new Date("2026-01-15T12:00:00.000Z");
const [outDir, baseUrl, ...routes] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
(async () => {
  const browser = await chromium.launch({ args: ARGS });
  let unstable = 0;
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, reducedMotion: "reduce", colorScheme: "light", locale: "en-US", timezoneId: "UTC" });
    const r = await ctx.request.post(`${baseUrl}/api/auth/sign-in/email`, { data: { email: process.env.SCREENSHOT_EMAIL, password: process.env.SCREENSHOT_PASSWORD }, headers: { "Content-Type": "application/json" } });
    if (!r.ok()) throw new Error(`sign-in ${r.status()}`);
    for (const route of routes) {
      const page = await ctx.newPage();
      // Seeded Math.random (mulberry32), identical in every run.
      await page.addInitScript(`(() => { let a = 0x2f6b1d3; Math.random = function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })()`);
      await page.clock.install({ time: FIXED_TIME });
      // Paused from the start: everything mounts at the same fake instant.
      await page.clock.pauseAt(new Date(FIXED_TIME.getTime() + 1000));
      await page.goto(`${baseUrl}${route}`, { waitUntil: "load", timeout: 60_000 });
      const opts = { fullPage: true, animations: "disabled", caret: "hide", scale: "css" } as const;
      await page.waitForLoadState("networkidle").catch(() => undefined);
      await page.waitForTimeout(2000);
      // Advance exactly 30s (fires due timers: typing, reveals), then hold still.
      // In 1s steps with a network wait after each, so anything mounted by a
      // late response snaps to the same step boundary in every run.
      for (let k = 0; k < 30; k++) {
        await page.clock.runFor(1000);
        await page.waitForLoadState("networkidle").catch(() => undefined);
        await page.waitForTimeout(300);
      }
      // Full-page shots of a page taller than the viewport resize it during the
      // capture, which re-lays out the app rail. Size the viewport to the page
      // first, so nothing resizes while the shot is taken.
      const fullHeight = Number(await page.evaluate("document.documentElement.scrollHeight"));
      if (fullHeight > vp.height) await page.setViewportSize({ width: vp.width, height: fullHeight });
      // Settle late responses in fixed steps (always 10 x 100ms of fake time,
      // so the total time, and any animation frame, is the same every run).
      for (let k = 0; k < 10; k++) {
        await page.waitForLoadState("networkidle").catch(() => undefined);
        await page.waitForTimeout(300);
        await page.clock.runFor(100);
      }
      let prev: Buffer | null = null, matches = 0, shot: Buffer | null = null;
      for (let i = 0; i < 60 && matches < 3; i++) {
        await page.waitForLoadState("networkidle").catch(() => undefined);
        await page.evaluate("document.fonts.ready");
        await page.waitForTimeout(300);
        shot = await page.screenshot(opts);
        matches = prev && shot.equals(prev) ? matches + 1 : 1;
        prev = shot;
      }
      const slug = route.replace(/^\//, "").replace(/[^a-zA-Z0-9-]+/g, "_") || "root";
      writeFileSync(join(outDir, `frozen__${slug}__${vp.name}.png`), shot!);
      if (matches < 3) { unstable++; console.error(`not stable: ${route} ${vp.name}`); }
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
  console.log(`${routes.length * 2} frozen-clock screenshot(s) written to ${outDir}, ${unstable} unstable`);
  process.exitCode = unstable ? 1 : 0;
})();
