// Builder states DS1's route list cannot reach by URL: a selected node, the
// node context menu, the block menu, the graph search and save popovers, and
// the tutorial's first steps. Same determinism as DS1's
// scripts/screenshot-pages.ts (its Chromium flags, viewports, fixed clock,
// reduced motion, animations off, retake until three identical shots).
//
//   SCREENSHOT_EMAIL=… SCREENSHOT_PASSWORD=… npx tsx capture-extra.mts <out dir> <flowID>
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
const req = createRequire(join(process.cwd(), "package.json"));
const { chromium } = req("@playwright/test");

const BASE = "http://localhost:3000";
const [outDir, flowID] = process.argv.slice(2);
const FIXED_TIME = new Date("2026-01-15T12:00:00.000Z");
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];
const ARGS = ["--disable-gpu", "--disable-gpu-rasterization", "--disable-partial-raster", "--num-raster-threads=1", "--disable-skia-runtime-opts", "--force-color-profile=srgb", "--font-render-hinting=none", "--disable-lcd-text"];

async function settle(page: any) {
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.evaluate(() => new Promise((d) => requestAnimationFrame(() => requestAnimationFrame(d))));
}
async function stable(page: any) {
  const o = { fullPage: true, animations: "disabled", caret: "hide", scale: "css" } as const;
  const deadline = Date.now() + 45_000;
  let prev = await page.screenshot(o);
  let n = 1;
  while (Date.now() < deadline) {
    await page.waitForTimeout(750);
    await settle(page);
    const next = await page.screenshot(o);
    n = next.equals(prev) ? n + 1 : 1;
    prev = next;
    if (n >= 3) return { image: next, ok: true };
  }
  return { image: prev, ok: false };
}

const flow = `${BASE}/build?flowID=${flowID}`;
const firstNode = (page: any) => page.locator('[data-id^="custom-node-"]').first();
const SCENES: { name: string; url: string; act: (page: any) => Promise<void> }[] = [
  { name: "flow-node-selected", url: flow, act: async (p) => { await firstNode(p).click({ position: { x: 60, y: 18 } }); await p.mouse.move(5, 5); } },
  { name: "flow-node-context-menu", url: flow, act: async (p) => { await firstNode(p).click({ button: "right", position: { x: 60, y: 18 } }); } },
  { name: "flow-block-menu", url: flow, act: async (p) => { await p.locator('[data-testid="blocks-control-blocks-button"]').click(); } },
  { name: "flow-graph-search", url: flow, act: async (p) => { await p.locator('[data-testid="graph-search-control-button"]').click(); } },
  { name: "flow-save-popover", url: flow, act: async (p) => { await p.locator('[data-testid="save-control-save-button"]').click(); } },
  { name: "tutorial-welcome", url: `${BASE}/build`, act: async (p) => { await p.locator('[data-id="tutorial-button"]').click(); await p.locator(".shepherd-element").first().waitFor({ state: "visible", timeout: 20_000 }); } },
  { name: "tutorial-step-2", url: `${BASE}/build`, act: async (p) => { await p.locator('[data-id="tutorial-button"]').click(); await p.locator(".shepherd-element").first().waitFor({ state: "visible", timeout: 20_000 }); await p.locator(".shepherd-element .shepherd-button:not(.shepherd-button-secondary)").first().click(); await p.waitForTimeout(1500); } },
];

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ARGS });
const log: string[] = [];
try {
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, reducedMotion: "reduce", colorScheme: "light", locale: "en-US", timezoneId: "UTC" });
    const r = await ctx.request.post(`${BASE}/api/auth/sign-in/email`, { data: { email: process.env.SCREENSHOT_EMAIL, password: process.env.SCREENSHOT_PASSWORD }, headers: { "Content-Type": "application/json" } });
    if (!r.ok()) throw new Error(`sign-in ${r.status()}`);
    for (const s of SCENES) {
      const page = await ctx.newPage();
      await page.clock.setFixedTime(FIXED_TIME);
      await page.goto(s.url, { waitUntil: "load", timeout: 60_000 });
      await settle(page);
      await page.waitForTimeout(1500);
      let note = "";
      try { await s.act(page); } catch (e) { note = ` (interaction failed: ${String(e).split("\n")[0].slice(0, 120)})`; }
      await settle(page);
      const { image, ok } = await stable(page);
      writeFileSync(join(outDir, `extra__${s.name}__${vp.name}.png`), image);
      log.push(`${s.name} ${vp.name}: ${ok ? "stable" : "NOT STABLE"}${note}`);
      await page.close();
    }
    await ctx.close();
  }
} finally {
  await browser.close();
}
writeFileSync(join(outDir, "extra-log.txt"), log.join("\n") + "\n");
console.log(log.join("\n"));
