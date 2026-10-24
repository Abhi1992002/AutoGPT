import { createRequire } from "node:module";
const req = createRequire("/home/vercel-sandbox/autogpt/autogpt_platform/frontend/package.json");
const { chromium } = req("@playwright/test");
(async () => {
  const browser = await chromium.launch({ args: ["--disable-gpu","--disable-gpu-rasterization","--disable-partial-raster","--num-raster-threads=1","--disable-skia-runtime-opts","--force-color-profile=srgb","--font-render-hinting=none","--disable-lcd-text"] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: "reduce", colorScheme: "light", locale: "en-US", timezoneId: "UTC" });
  await ctx.request.post("http://localhost:3000/api/auth/sign-in/email", { data: { email: process.env.E, password: process.env.P }, headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" } });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on("console", (m: any) => { if (m.type() === "error") errors.push(m.text().slice(0, 160)); });
  page.on("pageerror", (e: any) => errors.push("PAGEERROR " + String(e).slice(0, 160)));
  if (process.env.FIXED) await page.clock.setFixedTime(new Date("2026-01-15T12:00:00.000Z"));
  await page.goto("http://localhost:3000/build", { waitUntil: "load" });
  for (const t of [1000, 4000]) {
    await page.waitForTimeout(t);
    const s = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('[data-sidebar="content"] > div > div')).slice(0, 3);
      return { rm: matchMedia("(prefers-reduced-motion: reduce)").matches, items: items.map((el) => { const cs = getComputedStyle(el as Element); return `${cs.opacity}|${cs.filter}|${(el as HTMLElement).style.cssText}`; }) };
    });
    console.log(t, JSON.stringify(s));
  }
  console.log("errors", JSON.stringify(errors.slice(0, 8)));
  await browser.close();
})();
