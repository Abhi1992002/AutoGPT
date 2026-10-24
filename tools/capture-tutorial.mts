// Every builder tutorial step, rendered the way Shepherd renders it, inside the
// running app's /build page (so the app's real CSS: Tailwind, shepherd.css,
// tutorial.css, fonts). Step titles, HTML text and buttons come from the
// commit's own createTutorialSteps() (dump_steps.mts). Same determinism as
// DS1's scripts/screenshot-pages.ts: its Chromium flags, 1440x900 and 390x844
// at scale 1, fixed clock, reduced motion, animations off, retake until three
// identical shots.
//
//   SCREENSHOT_EMAIL=… SCREENSHOT_PASSWORD=… npx tsx capture-tutorial.mts <steps.json> <out dir>
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
const req = createRequire(join(process.cwd(), "package.json"));
const { chromium } = req("@playwright/test");

const BASE = "http://localhost:3000";
const [stepsFile, outDir] = process.argv.slice(2);
const steps = JSON.parse(readFileSync(stepsFile, "utf8")) as { id: string; title: string; text: string; buttons: { text: string; classes: string }[] }[];
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];
const ARGS = ["--disable-gpu", "--disable-gpu-rasterization", "--disable-partial-raster", "--num-raster-threads=1", "--disable-skia-runtime-opts", "--force-color-profile=srgb", "--font-render-hinting=none", "--disable-lcd-text"];

function markup(s: (typeof steps)[number]) {
  const buttons = s.buttons.map((b) => `<button class="shepherd-button ${b.classes}">${b.text}</button>`).join("");
  return `<div id="tour-probe" style="position:fixed;top:16px;left:16px;z-index:2147483647;width:min(420px,calc(100vw - 32px))">
  <div class="shepherd-element new-builder-tour shepherd-enabled shepherd-element-attached-top" data-popper-placement="bottom" role="dialog" style="position:relative;margin-top:0">
    <div class="shepherd-content">
      <header class="shepherd-header"><h3 class="shepherd-title">${s.title}</h3><button class="shepherd-cancel-icon" aria-label="Close Tour"><span aria-hidden="true">×</span></button></header>
      <div class="shepherd-text">${s.text}</div>
      ${buttons ? `<footer class="shepherd-footer">${buttons}</footer>` : ""}
    </div>
  </div>
</div>`;
}

async function stable(page: any) {
  const o = { fullPage: true, animations: "disabled", caret: "hide", scale: "css" } as const;
  const deadline = Date.now() + 45_000;
  let prev = await page.screenshot(o);
  let n = 1;
  while (Date.now() < deadline) {
    await page.waitForTimeout(500);
    const next = await page.screenshot(o);
    n = next.equals(prev) ? n + 1 : 1;
    prev = next;
    if (n >= 3) return { image: next, ok: true };
  }
  return { image: prev, ok: false };
}

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ARGS });
const log: string[] = [];
try {
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, reducedMotion: "reduce", colorScheme: "light", locale: "en-US", timezoneId: "UTC" });
    const r = await ctx.request.post(`${BASE}/api/auth/sign-in/email`, { data: { email: process.env.SCREENSHOT_EMAIL, password: process.env.SCREENSHOT_PASSWORD }, headers: { "Content-Type": "application/json" } });
    if (!r.ok()) throw new Error(`sign-in ${r.status()}`);
    const page = await ctx.newPage();
    await page.clock.setFixedTime(new Date("2026-01-15T12:00:00.000Z"));
    await page.goto(`${BASE}/build`, { waitUntil: "load", timeout: 60_000 });
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await page.evaluate(async () => { await document.fonts.ready; });
    await page.waitForTimeout(1500);
    for (const s of steps) {
      await page.evaluate((html: string) => {
        document.getElementById("tour-probe")?.remove();
        document.body.insertAdjacentHTML("beforeend", html);
      }, markup(s));
      await page.evaluate(async () => { await document.fonts.ready; });
      const { image, ok } = await stable(page);
      writeFileSync(join(outDir, `tutorial__${s.id}__${vp.name}.png`), image);
      log.push(`${s.id} ${vp.name}: ${ok ? "stable" : "NOT STABLE"}`);
    }
    await ctx.close();
  }
} finally {
  await browser.close();
}
writeFileSync(join(outDir, "tutorial-log.txt"), log.join("\n") + "\n");
console.log(`${log.length} tutorial captures; ${log.filter((l) => l.includes("NOT")).length} unstable`);
