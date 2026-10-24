import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
const out = process.argv[2];
const { radix, huge } = JSON.parse(readFileSync(`${out}/svgs.json`, "utf8"));
// checked atoms/Checkbox: 16x16, 1px #171717 border, #171717 fill, rounded-sm, #FAFAFA tick
const box = (svg: string) => `<html><body style="margin:0;background:#fff"><div style="padding:8px">
<button style="all:unset;box-sizing:border-box;display:flex;width:16px;height:16px;border:1px solid #171717;border-radius:2px;background:#171717;color:#FAFAFA;align-items:center;justify-content:center">
<span style="display:flex;align-items:center;justify-content:center;color:currentColor">${svg.replace('class="h-4 w-4"', 'style="width:16px;height:16px;flex-shrink:0"')}</span></button></div></body></html>`;
const b = await chromium.launch();
const shots: Record<string, Buffer> = {};
for (const scale of [1, 2]) for (const [k, svg] of Object.entries({ radix, huge })) {
  const p = await b.newPage({ viewport: { width: 32, height: 32 }, deviceScaleFactor: scale });
  await p.setContent(box(svg));
  shots[`${k}@${scale}x`] = await p.screenshot();
  writeFileSync(`${out}/${k}@${scale}x.png`, shots[`${k}@${scale}x`]);
  await p.close();
}
await b.close();
