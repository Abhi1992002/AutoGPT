import { chromium } from "@playwright/test";
(async () => {
  const b = await chromium.launch();
  for (let run = 0; run < 3; run++)
    for (const port of [6007, 6008]) {
      const ctx = await b.newContext({
        viewport: { width: 390, height: 844 },
        reducedMotion: "reduce",
      });
      const p = await ctx.newPage();
      await p.goto(
        `http://localhost:${port}/iframe.html?id=ai-elements-message--with-table&viewMode=story`,
        { waitUntil: "load" },
      );
      const early = await p.evaluate(() => document.fonts.status);
      await p
        .locator("table:visible tbody tr")
        .first()
        .waitFor({ state: "visible" });
      await p.locator("table:visible tbody tr").nth(2).hover();
      const r = await p.evaluate(() => {
        const t = [...document.querySelectorAll("table")].find(
          (x) => x.offsetParent,
        )!;
        return {
          scrollLeft: (t.parentElement as HTMLElement).scrollLeft,
          fonts: document.fonts.status,
        };
      });
      console.log(run, port, early, JSON.stringify(r));
      await ctx.close();
    }
  await b.close();
})();
