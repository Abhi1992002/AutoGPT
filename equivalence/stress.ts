// Shrink pressure: the two icons that gain the Icon slot's shrink-0, as flex
// items next to a long unbreakable word in rows 40px to 400px wide. Compares
// each icon's rendered box, old classes against new.
import { createRequire } from "node:module";
import { join } from "node:path";
const req = createRequire(join(process.cwd(), "package.json"));
const { chromium } = req("@playwright/test");
const CASES = [
  { label: "ArchivedExpertNotice icon 16px", old: "text-muted-foreground", new: "shrink-0 text-muted-foreground", size: 16, row: "flex items-center justify-center gap-2 text-center" },
  { label: "PendingReviewsList header icon 28px", old: "fill-yellow-600 text-action-foreground", new: "shrink-0 fill-yellow-600 text-action-foreground", size: 28, row: "flex items-start gap-2" },
];
const svg = (cls: string, size: number) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" class="${cls}"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/></svg>`;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  // Utilities as Tailwind emits them for these classes.
  const css = `.flex{display:flex}.items-center{align-items:center}.items-start{align-items:flex-start}.justify-center{justify-content:center}.gap-2{gap:.5rem}.text-center{text-align:center}.shrink-0{flex-shrink:0}`;
  let failures = 0;
  for (const c of CASES) {
    for (let w = 40; w <= 400; w += 20) {
      const html = (cls: string) => `<div style="width:${w}px" class="${c.row}">${svg(cls, c.size)}<p>Supercalifragilisticexpialidocious_${"x".repeat(40)}</p></div>`;
      await p.setContent(`<style>${css}</style><div id=o>${html(c.old)}</div><div id=n>${html(c.new)}</div>`);
      const [o, n] = await p.evaluate(() => ["#o svg", "#n svg"].map((s) => { const r = document.querySelector(s)!.getBoundingClientRect(); return `${r.x},${r.y - (s === "#n svg" ? document.querySelector("#n")!.getBoundingClientRect().y - document.querySelector("#o")!.getBoundingClientRect().y : 0)},${r.width},${r.height}`; }));
      if (o !== n) { failures++; console.log(`${c.label} @${w}px: ${o} != ${n}`); }
    }
    console.log(`${c.label}: 19 widths (40-400px) under shrink pressure`);
  }
  console.log(`${failures} differing icon boxes`);
  await b.close();
})();
