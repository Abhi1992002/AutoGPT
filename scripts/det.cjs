// Shared determinism for every #16131 / #16134 evidence script, the same on
// base and head: software raster flags, a seeded Math.random, a fixed clock
// (page.clock.install + setFixedTime), reduced motion, and settle waits on
// network idle plus fonts, images and body of the page and every iframe.
// Shots are full page, animations disabled, caret hidden; nothing is hidden,
// cropped or masked.
const req = require("node:module").createRequire(
  "/home/vercel-sandbox/autogpt/autogpt_platform/frontend/package.json",
);
const { chromium } = req("@playwright/test");

const ARGS = ["--disable-gpu", "--disable-gpu-rasterization", "--disable-partial-raster", "--num-raster-threads=1", "--disable-skia-runtime-opts", "--force-color-profile=srgb", "--font-render-hinting=none", "--disable-lcd-text"];
const VIEWPORTS = [{ name: "desktop", width: 1440, height: 900 }, { name: "mobile", width: 390, height: 844 }];
const FIXED = new Date("2026-01-15T12:00:00.000Z");
const SEED_SCRIPT = `(() => {
  let s = 0x2f6b9a1d >>> 0;
  Math.random = function () {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
})();`;

function slug(id) { return id.replace(/^\//, "").replace(/[^a-zA-Z0-9-]+/g, "_") || "root"; }

// Fonts and images of one document, main page or iframe. A lazy image
// outside the viewport never loads in a full-page shot, so it is not waited
// for; the whole wait is capped at 15s so one stuck image cannot hang a run.
const DOC_READY = `Promise.race([
  Promise.all([
    document.fonts ? document.fonts.ready : null,
    ...[...document.images].filter((i) => !i.complete && i.loading !== "lazy")
      .map((i) => new Promise((r) => { i.addEventListener("load", r); i.addEventListener("error", r); })),
  ]).then(() => true),
  new Promise((r) => setTimeout(() => r("timeout"), 15000)),
])`;

async function settle(page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(DOC_READY);
  for (const frame of page.frames()) {
    if (frame === page.mainFrame()) continue;
    await frame.waitForLoadState("load").catch(() => {});
    await frame.locator("body").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
    await frame.evaluate(DOC_READY).catch(() => {});
  }
  await page.evaluate("new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))");
}

async function stableShot(page) {
  const opts = { fullPage: true, animations: "disabled", caret: "hide", scale: "css" };
  let prev = await page.screenshot(opts), same = 1;
  const end = Date.now() + 45000;
  while (same < 3 && Date.now() < end) {
    await page.waitForTimeout(750);
    await settle(page);
    const next = await page.screenshot(opts);
    same = next.equals(prev) ? same + 1 : 1;
    prev = next;
  }
  return { image: prev, stable: same >= 3 };
}

async function newPage(ctx) {
  const page = await ctx.newPage();
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
  await page.addInitScript(SEED_SCRIPT);
  await page.clock.install({ time: FIXED });
  // DET_CLOCK=flow: Date starts at FIXED on every run and then runs, so a
  // finite animation (a 0.25s fade) reaches its end state before the shot
  // instead of being caught mid-way; infinite ones are off (reduced motion).
  if (process.env.DET_CLOCK !== "flow") await page.clock.setFixedTime(FIXED);
  return page;
}

module.exports = { chromium, ARGS, VIEWPORTS, FIXED, SEED_SCRIPT, DOC_READY, slug, settle, stableShot, newPage };
