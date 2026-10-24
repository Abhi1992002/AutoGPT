import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { comparePngs } from "./scripts/screenshot-pages";
const req = createRequire(join(process.cwd(), "package.json"));
const postcss = req("postcss"); const tailwindcss = req("tailwindcss"); const loadConfig = req("tailwindcss/loadConfig");
const { rows } = JSON.parse(readFileSync("/home/vercel-sandbox/autogpt/.context/ev/glyph/markup.json", "utf8"));
async function css(dir: string, html: string) {
  const config = loadConfig(join(dir, "tailwind.config.ts"));
  const r = await postcss([tailwindcss({ ...config, content: [{ raw: html, extension: "html" }] })]).process(readFileSync(join(dir, "src/app/globals.css"), "utf8"), { from: join(dir, "src/app/globals.css") });
  return r.css as string;
}
const BASE = "/home/vercel-sandbox/wt/base/autogpt_platform/frontend";
const oldCss = await css(BASE, rows.map((r: any) => r.old).join("\n"));
const newCss = await css(process.cwd(), rows.map((r: any) => r.new).join("\n"));
const ARGS = ["--disable-gpu","--disable-gpu-rasterization","--disable-partial-raster","--num-raster-threads=1","--disable-skia-runtime-opts","--force-color-profile=srgb","--font-render-hinting=none","--disable-lcd-text"];
const browser = await chromium.launch({ args: ARGS });
const page = await browser.newPage({ viewport: { width: 400, height: 300 }, deviceScaleFactor: 1 });
const outDir = "/home/vercel-sandbox/autogpt/.context/ev/glyph/png"; mkdirSync(outDir, { recursive: true });
const lines = ["| # | element | colour context | old vs new pixels differing |", "| --- | --- | --- | --- |"];
let fails = 0, n = 0;
const colours = ["rgb(20,20,20)", "rgb(124,59,237)", "rgb(239,68,68)"];
for (const [i, r] of rows.entries()) {
  for (const c of colours) {
    const shot = async (style: string, markup: string) => {
      await page.setContent(`<html><head><style>${style}</style><style>*{animation:none!important;transition:none!important}</style></head><body style="margin:0;background:#fff"><div id="h" style="display:inline-block;padding:4px;color:${c};font-size:16px;line-height:1.5">${markup}</div></body></html>`);
      return page.locator("#h").screenshot();
    };
    const a = await shot(oldCss, r.old), b = await shot(newCss, r.new);
    const res = comparePngs(a, b); n++;
    const diff = typeof res === "number" ? res : (res as any).diffPixels ?? (res as any).pixels ?? JSON.stringify(res);
    if (diff !== 0) { fails++; writeFileSync(`${outDir}/${i}-old.png`, a); writeFileSync(`${outDir}/${i}-new.png`, b); }
    lines.push(`| ${i + 1} | ${r.name} | color ${c} | ${diff} |`);
  }
}
await browser.close();
writeFileSync("/home/vercel-sandbox/autogpt/.context/ev/glyph/glyph-equivalence.md", `${n} renders (${rows.length} elements x 3 colours), ${fails} differing\n\n${lines.join("\n")}\n`);
console.log(n, "renders,", fails, "differing");
