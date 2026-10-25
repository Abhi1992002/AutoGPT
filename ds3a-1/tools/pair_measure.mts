// usage (from the head frontend dir): npx tsx pair_measure.mts <cases.json> <base frontend dir> <out.md>
// Real multi-element markup, old (base CSS) vs new (head CSS): every case is rendered inside three parents
// (the page default 16px/24px, a leading-[30px] parent, a 14px/20px parent) at 1440 and 390 wide, and compares
// the container's box, the text's own line box (a Range over its text) and the text's computed font and colour.
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const HEAD = process.cwd();
const req = createRequire(join(HEAD, "package.json"));
const postcss = req("postcss");
const tailwindcss = req("tailwindcss");
const loadConfig = req("tailwindcss/loadConfig");
const { chromium } = req("@playwright/test");

type Case = { name: string; old: string; new: string };
const [casesFile, baseDir, outFile] = process.argv.slice(2);
const cases: Case[] = JSON.parse(readFileSync(casesFile, "utf8"));

async function compile(dir: string, html: string) {
  const config = loadConfig(join(dir, "tailwind.config.ts"));
  const globals = readFileSync(join(dir, "src/app/globals.css"), "utf8");
  const raw = html + " leading-[30px]";
  const r = await postcss([tailwindcss({ ...config, content: [{ raw, extension: "html" }] })]).process(globals, { from: join(dir, "src/app/globals.css") });
  return r.css as string;
}

const PARENTS: [string, string][] = [
  ["page default 16px/24px", 'style="font-size:16px;line-height:24px"'],
  ["leading-[30px] parent", 'class="leading-[30px]" style="font-size:16px"'],
  ["14px/20px parent", 'style="font-size:14px;line-height:20px"'],
];
const WIDTHS = [1440, 390];

const MEASURE = `() => {
  const box = document.querySelector("[data-m=box]");
  const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT, { acceptNode: (n) => n.textContent.trim() ? 1 : 3 });
  const text = walker.nextNode();
  const range = document.createRange(); range.selectNodeContents(text);
  const b = box.getBoundingClientRect(), t = range.getBoundingClientRect();
  const s = getComputedStyle(text.parentElement);
  return { box: Math.round(b.width) + "x" + Math.round(b.height), text: Math.round(t.width) + "x" + Math.round(t.height) + " at +" + Math.round(t.left - b.left) + ",+" + Math.round(t.top - b.top),
           font: s.fontSize + "/" + s.lineHeight + " " + s.fontWeight + " " + s.fontFamily.split(",")[0], color: s.color };
}`;

const browser = await chromium.launch();
const page = await browser.newPage();
const lines = ["| case | parent | width | old box | new box | old text line box | new text line box | font (old → new) | colour | result |", "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"];
let fails = 0, n = 0;
for (const c of cases) {
  const cssOld = await compile(baseDir, c.old), cssNew = await compile(HEAD, c.new);
  for (const [pname, pattr] of PARENTS) {
    for (const w of WIDTHS) {
      await page.setViewportSize({ width: w, height: 800 });
      const doc = (css: string, body: string) => `<!DOCTYPE html><html><head><style>${css}</style></head><body><div ${pattr}><div style="width:${Math.min(w - 40, 320)}px">${body}</div></div></body></html>`;
      await page.setContent(doc(cssOld, c.old)); const o = await page.evaluate(`(${MEASURE})()`);
      await page.setContent(doc(cssNew, c.new)); const nn = await page.evaluate(`(${MEASURE})()`);
      const same = o.box === nn.box && o.text === nn.text && o.font === nn.font && o.color === nn.color;
      n++; if (!same) fails++;
      lines.push(`| ${c.name} | ${pname} | ${w} | ${o.box} | ${nn.box} | ${o.text} | ${nn.text} | ${o.font === nn.font ? o.font : o.font + " → " + nn.font} | ${o.color === nn.color ? o.color : o.color + " → " + nn.color} | ${same ? "identical" : "**DIFFERENT**"} |`);
    }
  }
}
await browser.close();
const summary = `${cases.length} markup pairs x ${PARENTS.length} parents x ${WIDTHS.length} widths = ${n} renders, ${fails} different`;
writeFileSync(outFile, `${summary}\n\n${lines.join("\n")}\n`);
console.log(summary);
