/** Re-capture of the with-table row-hover state with the hover's
 *  scroll-into-view race removed (scrollLeft reset to 0 after hover). */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
const ARGS = [
  "--disable-gpu",
  "--disable-gpu-rasterization",
  "--disable-partial-raster",
  "--num-raster-threads=1",
  "--disable-skia-runtime-opts",
  "--force-color-profile=srgb",
  "--font-render-hinting=none",
  "--disable-lcd-text",
];
const [port, out] = process.argv.slice(2);
(async () => {
  mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ARGS });
  for (const vp of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    const ctx = await b.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
      colorScheme: "light",
      locale: "en-US",
      timezoneId: "UTC",
    });
    const p = await ctx.newPage();
    await p.goto(
      `http://localhost:${port}/iframe.html?id=ai-elements-message--with-table&viewMode=story`,
      { waitUntil: "load" },
    );
    await p.evaluate(() => document.fonts.ready);
    const row = p.locator("table:visible tbody tr").nth(2);
    await row.waitFor({ state: "visible" });
    await row.hover();
    await p.evaluate(() => {
      const t = [...document.querySelectorAll("table")].find(
        (x) => x.offsetParent,
      )!;
      (t.parentElement as HTMLElement).scrollLeft = 0;
    });
    await p.waitForFunction(() =>
      document.getAnimations().every((a) => a.playState !== "running"),
    );
    let prev = await p.screenshot({ caret: "hide", scale: "css" });
    for (let i = 0, same = 1; i < 40 && same < 3; i++) {
      await p.waitForTimeout(400);
      const n = await p.screenshot({ caret: "hide", scale: "css" });
      same = n.equals(prev) ? same + 1 : 1;
      prev = n;
    }
    writeFileSync(
      join(out, `story-with-table-row-hover__${vp.name}.png`),
      prev,
    );
    await ctx.close();
  }
  await b.close();
})();
