import { chromium } from "@playwright/test";
(async () => {
  const b = await chromium.launch();
  for (const port of [6007, 6008]) {
    for (const width of [390, 1440]) {
      const p = await b.newPage({ viewport: { width, height: 844 } });
      await p.goto(
        `http://localhost:${port}/iframe.html?id=ai-elements-message--with-table&viewMode=story`,
        { waitUntil: "load" },
      );
      await p.locator("table:visible").first().waitFor();
      await p.waitForTimeout(1500);
      const r = await p.evaluate(() => {
        const t = [...document.querySelectorAll("table")].find(
          (x) => x.offsetParent,
        ) as HTMLTableElement;
        const wrap = t.parentElement as HTMLElement;
        const ths = [...t.querySelectorAll("th")].map(
          (th) => Math.round(th.getBoundingClientRect().width * 100) / 100,
        );
        const tds = [...t.querySelectorAll("tbody tr")].slice(0, 3).map((tr) =>
          [...tr.querySelectorAll("td")]
            .map((td) => {
              const s = getComputedStyle(td);
              return `${Math.round(td.getBoundingClientRect().width)}w ${s.fontSize}/${s.lineHeight} ${s.whiteSpace}`;
            })
            .join(" | "),
        );
        const code = t.querySelector("td code");
        const cs = code ? getComputedStyle(code) : null;
        const th = t.querySelector("th")!;
        const ts = getComputedStyle(th);
        return {
          scrollWidth: wrap.scrollWidth,
          clientWidth: wrap.clientWidth,
          tableW: t.getBoundingClientRect().width,
          ths,
          tds,
          code:
            cs &&
            `${cs.fontSize}/${cs.lineHeight} ${cs.whiteSpace} ${cs.paddingLeft}`,
          th: `${ts.fontSize}/${ts.lineHeight} ls=${ts.letterSpacing} ${ts.whiteSpace}`,
        };
      });
      console.log(port, width, JSON.stringify(r));
      await p.close();
    }
  }
  await b.close();
})();
