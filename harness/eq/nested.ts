// Restructures that move typography from an element to a child (copy wrapped
// in <Text>): old and new DOM fragments, built from the real class strings
// (merged with cn() by the caller), compiled with the base's and the head's
// Tailwind config + globals.css, rendered at a 16px root inside parents with
// non-default line-heights at 1280 and 390px. For every text run it compares
// the glyph box (Range rect: x, y, width, height relative to the fragment) and
// the holder's font-size, font-weight, font-family, color and letter-spacing;
// it also compares the fragment's own box. Exits 1 on any difference.
// usage: nested.ts <baseDir> <headDir> <cases.json> <out.md>
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const R = (m: string) => require(join(process.cwd(), "node_modules", m));
const postcss = R("postcss");
const tailwindcss = R("tailwindcss");
const loadConfig = R("tailwindcss/loadConfig");
const { chromium } = R("@playwright/test");

const [baseDir, headDir, casesFile, outFile] = process.argv.slice(2);
type Case = { name: string; old: string; new: string };
const cases: Case[] = JSON.parse(readFileSync(casesFile, "utf8"));
const PARENTS = ["leading-[1.5]", "leading-[30px]", "leading-[normal]", "leading-[1.5]"];
// The fourth parent is 13px, so anything that inherits its size shows up.
const PARENT_FS = ["16px", "16px", "16px", "13px"];
// What each parent must compute to at a 16px root; asserted before measuring.
const PARENT_LH = ["24px", "30px", "normal", "19.5px"];
const WIDTHS = [1280, 390];
// Light, and dark as tailwind.config.ts defines it (darkMode: ["class", ".dark-mode"]),
// so every `dark:` class is exercised; the root class is asserted to switch it.
const MODES = ["", "dark-mode"];

async function css(dir: string, html: string[]) {
  const config = loadConfig(join(dir, "tailwind.config.ts"));
  const globals = readFileSync(join(dir, "src/app/globals.css"), "utf8");
  const raw = html.join(" ") + " " + PARENTS.join(" ") + " dark:text-[#010203]";
  const r = await postcss([tailwindcss({ ...config, content: [{ raw, extension: "html" }] })]).process(globals, { from: join(dir, "src/app/globals.css") });
  return r.css as string;
}

async function measure(browser: any, mode: string, cssText: string, frags: string[], width: number) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const body = frags.flatMap((f, i) => PARENTS.map((p, j) => `<div class="${p}" style="font-size:${PARENT_FS[j]};width:280px" data-case="${i}-${j}">${f}</div>`)).join("");
  await page.setContent(`<html class="${mode}"><head><style>${cssText}</style></head><body><i id="dark-probe" class="dark:text-[#010203]"></i>${body}</body></html>`);
  const probe = await page.evaluate(() => getComputedStyle(document.getElementById("dark-probe")!).color);
  if ((probe === "rgb(1, 2, 3)") !== (mode === "dark-mode")) throw new Error(`dark mode switch not applied (mode "${mode}", probe ${probe})`);
  const parentLH: Record<string, string> = await page.evaluate(() => Object.fromEntries(Array.from(document.querySelectorAll("[data-case]")).map((d) => [(d as HTMLElement).dataset.case!, getComputedStyle(d).lineHeight])));
  for (const [k, lh] of Object.entries(parentLH)) { const j = Number(k.split("-")[1]); if (lh !== PARENT_LH[j]) throw new Error(`parent ${PARENTS[j]} computes line-height ${lh}, expected ${PARENT_LH[j]}`); }
  const out = await page.evaluate(() => {
    const res: Record<string, unknown> = {};
    document.querySelectorAll("[data-case]").forEach((host) => {
      const root = host.firstElementChild as HTMLElement;
      const rb = root.getBoundingClientRect();
      const runs: unknown[] = [];
      const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let n: Node | null;
      while ((n = walk.nextNode())) {
        if (!(n.textContent || "").trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(n);
        const r = range.getBoundingClientRect();
        const cs = getComputedStyle(n.parentElement as Element);
        runs.push({
          text: (n.textContent || "").trim(),
          x: +(r.x - rb.x).toFixed(3), y: +(r.y - rb.y).toFixed(3), w: +r.width.toFixed(3), h: +r.height.toFixed(3),
          fontSize: cs.fontSize, fontWeight: cs.fontWeight, fontFamily: cs.fontFamily, color: cs.color, letterSpacing: cs.letterSpacing,
        });
      }
      res[(host as HTMLElement).dataset.case!] = { box: [+rb.width.toFixed(3), +rb.height.toFixed(3)], runs };
    });
    return res;
  });
  await page.close();
  return out as Record<string, { box: number[]; runs: Record<string, unknown>[] }>;
}

(async () => {
  const baseCss = await css(baseDir, cases.map((c) => c.old));
  const headCss = await css(headDir, cases.map((c) => c.new));
  const browser = await chromium.launch();
  let total = 0, fail = 0;
  const rows: string[] = [];
  const dark: Record<string, string> = {};
  for (const mode of MODES) for (const w of WIDTHS) {
    const a = await measure(browser, mode, baseCss, cases.map((c) => c.old), w);
    const b = await measure(browser, mode, headCss, cases.map((c) => c.new), w);
    for (const k of Object.keys(a)) {
      if (mode && w === 1280) dark[k] = b[k].runs.map((r: any) => r.color).join(", ");
      total++;
      const sa = JSON.stringify(a[k]), sb = JSON.stringify(b[k]);
      const i = Number(k.split("-")[0]);
      if (sa !== sb) { fail++; rows.push(`FAIL ${mode || "light"} w=${w} ${cases[i].name} parent=${PARENTS[Number(k.split("-")[1])]}\n  old ${sa}\n  new ${sb}`); }
      else if (!mode && w === 1280 && k.endsWith("-0")) {
        const runs = a[k].runs.map((r: any) => `"${r.text}" ${r.fontSize} ${r.fontWeight} ${r.color} at (${r.x}, ${r.y})`).join("; ");
        rows.push(`| ${cases[i].name} | box ${a[k].box.join("x")}; ${runs}; dark-mode colours: DARK${k} | identical (glyph boxes, font, weight, colour, letter-spacing, box; 4 parents x 2 widths x light/dark) |`);
      }
    }
  }
  await browser.close();
  writeFileSync(outFile, rows.map((r) => r.replace(/DARK(\d+-\d+)/, (_, k) => dark[k] ?? "?")).join("\n"));
  console.log(`${cases.length} restructures, ${total} cases, ${fail} failing (light and dark-mode; parent line-heights asserted: ${PARENT_LH.join(", ")})`);
  process.exit(fail ? 1 : 0);
})();
