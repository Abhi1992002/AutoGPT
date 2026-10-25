/**
 * Old vs new markup (the outermost element of each carries data-eq-root), each inside its real ancestors, rendered in Chromium in standards mode with
 * the frontend's compiled Tailwind CSS (16px root; Geist and Poppins stand-ins). For every case it compares
 * the root's box, every text run's boxes (Range client rects), the computed
 * type and colour of the element holding each run, the text decorations that
 * reach it (own and propagated: line, colour, thickness, offset and the
 * decorating box's font size), and every svg's box. Widths 1440 and 390;
 * default, hover and active (pseudo-classes rewritten to classes).
 * Old markup is styled by the base checkout's CSS, new markup by the head's.
 *   npx tsx markup_eq.mts <cases.json> <out.md> [base frontend dir]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
const DIR = process.cwd();
const req = createRequire(join(DIR, "package.json"));
const postcss = req("postcss");
const tailwindcss = req("tailwindcss");
const loadConfig = req("tailwindcss/loadConfig");
const { chromium } = req("@playwright/test");
interface Case { name: string; where: string; ctx: string; old: string; new: string }
const [casesFile, outFile, baseDir = DIR] = process.argv.slice(2);
const cases: Case[] = JSON.parse(readFileSync(casesFile, "utf8"));
const raw = cases.map((c) => c.ctx + c.old + c.new).join(" ");
// Old markup gets the base checkout's CSS, new markup the head's.
async function compile(dir: string) {
  const config = loadConfig(join(dir, "tailwind.config.ts"));
  return (await postcss([tailwindcss({ ...config, content: [{ raw, extension: "html" }] })]).process(readFileSync(join(dir, "src/app/globals.css"), "utf8"), { from: join(dir, "src/app/globals.css") })).css
    .replace(/(?<!\\):hover/g, ".fs-hover").replace(/(?<!\\):active/g, ".fs-active");
}
const cssOld = await compile(baseDir), cssNew = await compile(DIR);
const page = await (await chromium.launch()).newPage();
const read = `() => {
  const root = document.querySelector("[data-eq-root]");
  const r = (b) => [b.x, b.y, b.width, b.height].map((v) => Math.round(v * 1000) / 1000).join(",");
  const P = ["font-family","font-size","line-height","font-weight","font-style","letter-spacing","text-transform","color","white-space","text-align","opacity","visibility"];
  const out = { root: r(root.getBoundingClientRect()), runs: [], svgs: [] };
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    if (!n.textContent.trim()) continue;
    const range = document.createRange(); range.selectNodeContents(n);
    const el = n.parentElement, cs = getComputedStyle(el);
    const deco = [];
    for (let a = el; a && a !== document.body; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (s.textDecorationLine !== "none") deco.push([s.textDecorationLine, s.textDecorationColor, s.textDecorationThickness, s.textUnderlineOffset, s.fontSize].join(" "));
    }
    out.runs.push({ text: n.textContent.trim(), rects: [...range.getClientRects()].map(r).join(" | "), style: P.map((p) => cs.getPropertyValue(p)).join("; "), deco: deco.join(" + ") });
  }
  root.querySelectorAll("svg").forEach((s) => out.svgs.push(r(s.getBoundingClientRect())));
  return out;
}`;
async function measure(css: string, html: string, width: number, state: string) {
  await page.setViewportSize({ width, height: 900 });
  await page.setContent(`<!DOCTYPE html><html><head><style>:root{--font-geist-sans:"Liberation Sans";--font-geist-mono:"Liberation Mono";--font-poppins:"Noto Sans"}</style><style>${css}</style><style>*,*::before,*::after{transition:none!important;animation:none!important}</style></head><body>${html}</body></html>`);
  if (state !== "default") await page.evaluate(`document.querySelectorAll("body *").forEach((e) => e.classList.add("fs-${state}"))`);
  return page.evaluate(`(${read})()`);
}
const rows: string[] = []; let fails = 0, measurements = 0;
for (const c of cases) {
  let bad: string[] = []; let runs = 0;
  for (const width of [1440, 390]) for (const state of ["default", "hover", "active"]) {
    const a = await measure(cssOld, c.ctx.replace("{X}", c.old), width, state);
    const b = await measure(cssNew, c.ctx.replace("{X}", c.new), width, state);
    measurements += 1 + a.runs.length * 4 + a.svgs.length; runs = a.runs.length;
    const ja = JSON.stringify(a), jb = JSON.stringify(b);
    if (ja !== jb) {
      if (a.root !== b.root) bad.push(`${width} ${state} root ${a.root} vs ${b.root}`);
      if (a.runs.length !== b.runs.length) bad.push(`${width} ${state} ${a.runs.length} vs ${b.runs.length} runs`);
      a.runs.forEach((x: any, i: number) => { const y = b.runs[i]; if (!y) return; for (const k of ["text", "rects", "style", "deco"]) if (x[k] !== y[k]) bad.push(`${width} ${state} "${x.text}" ${k}: ${x[k]} vs ${y[k]}`); });
      if (JSON.stringify(a.svgs) !== JSON.stringify(b.svgs)) bad.push(`${width} ${state} svg ${a.svgs} vs ${b.svgs}`);
    }
  }
  if (bad.length) fails++;
  rows.push(`| ${c.name} | \`${c.where}\` | ${runs} | ${bad.length ? "**differs**: " + bad.slice(0, 3).join("; ").replace(/\|/g, "/") : "identical"} |`);
}
const head = `${cases.length} cases, ${measurements} measurements (root box, per text run: boxes, type and colour, decorations; svg boxes; 2 widths x 3 states): ${fails} failing`;
writeFileSync(outFile, `${head}\n\n| case | where | text runs | result |\n| --- | --- | --- | --- |\n${rows.join("\n")}\n`);
console.log(head); rows.filter((r) => r.includes("differs")).forEach((r) => console.log(r));
process.exit(0);
