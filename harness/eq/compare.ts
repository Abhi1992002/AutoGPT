// Compiles each old class string against the base checkout's Tailwind config and
// globals.css and each new string against the head's, renders both in Chromium
// at a 16px root inside parents with non-default line-heights at 1280 and 390px,
// and compares EVERY computed property. Exits 1 on any difference.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const R = (m: string) => require(join(process.cwd(), "node_modules", m));
const postcss = R("postcss");
const tailwindcss = R("tailwindcss");
const loadConfig = R("tailwindcss/loadConfig");
const { chromium } = R("@playwright/test");

const [baseDir, headDir, pairsFile, outFile] = process.argv.slice(2);
const pairs: { old: string; new: string }[] = JSON.parse(readFileSync(pairsFile, "utf8"));
const unescape = (s: string) => s.replace(/&amp;/g, "&").replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&quot;/g, '"');
const split = (s: string) => { const i = s.indexOf("|"); return { tag: s.slice(0, i), cls: unescape(s.slice(i + 1)) }; };

const PARENTS = ["leading-[1.5]", "leading-[30px]", "leading-[normal]", "leading-[1.5]"];
// The fourth parent is 13px, so anything that inherits its size shows up.
const PARENT_FS = ["16px", "16px", "16px", "13px"];
// What each parent must compute to at a 16px root; asserted before measuring,
// so a parent class missing from the generated CSS fails the run.
const PARENT_LH = ["24px", "30px", "normal", "19.5px"];

async function css(dir: string, classes: string[]) {
  const config = loadConfig(join(dir, "tailwind.config.ts"));
  const globals = readFileSync(join(dir, "src/app/globals.css"), "utf8");
  const raw = classes.join(" ") + " " + PARENTS.join(" ") + " dark:text-[#010203]";
  const r = await postcss([tailwindcss({ ...config, content: [{ raw, extension: "html" }] })]).process(globals, { from: join(dir, "src/app/globals.css") });
  return r.css as string;
}
const WIDTHS = [1280, 390];
// Light, and dark as tailwind.config.ts defines it (darkMode: ["class", ".dark-mode"]),
// so every `dark:` class is exercised; the root class is asserted to switch it.
const MODES = ["", "dark-mode"];

async function measure(browser: any, mode: string, cssText: string, items: { tag: string; cls: string }[], width: number) {
  const page = await browser.newPage({ viewport: { width, height: 800 } });
  const body = items.flatMap((it, i) => PARENTS.map((p, j) => `<div class="${p}" style="font-size:${PARENT_FS[j]}"><${it.tag} data-i="${i}-${j}" class="${it.cls.replace(/"/g, "&quot;")}"><span>Ab</span> text</${it.tag}></div>`)).join("");
  await page.setContent(`<html class="${mode}"><head><style>${cssText}</style></head><body><i id="dark-probe" class="dark:text-[#010203]"></i>${body}</body></html>`);
  if ((await page.evaluate(() => getComputedStyle(document.documentElement).fontSize)) !== "16px") throw new Error("root not 16px");
  const probe = await page.evaluate(() => getComputedStyle(document.getElementById("dark-probe")!).color);
  if ((probe === "rgb(1, 2, 3)") !== (mode === "dark-mode")) throw new Error(`dark mode switch not applied (mode "${mode}", probe ${probe})`);
  const parentLH: string[] = await page.evaluate((n: number) => Array.from(document.querySelectorAll("body > div")).slice(0, n).map((d) => getComputedStyle(d).lineHeight), PARENTS.length);
  parentLH.forEach((lh, j) => { if (lh !== PARENT_LH[j]) throw new Error(`parent ${PARENTS[j]} computes line-height ${lh}, expected ${PARENT_LH[j]}`); });
  const vals = await page.evaluate(() => {
    const out: Record<string, Record<string, string>> = {};
    document.querySelectorAll("[data-i]").forEach((el) => {
      const s = getComputedStyle(el);
      const o: Record<string, string> = {};
      for (let k = 0; k < s.length; k++) { const p = s[k]; if (!p.startsWith("--")) o[p] = s.getPropertyValue(p); }
      out[(el as HTMLElement).dataset.i!] = o;
    });
    return out;
  });
  await page.close();
  return vals;
}

(async () => {
  const olds = pairs.map((p) => split(p.old));
  const news = pairs.map((p) => split(p.new));
  const baseCss = await css(baseDir, olds.map((o) => o.cls));
  const headCss = await css(headDir, news.map((n) => n.cls));
  const browser = await chromium.launch();
  let cases = 0, failures = 0;
  const rows: string[] = [];
  const darkColor: Record<string, string> = {};
  for (const mode of MODES) for (const w of WIDTHS) {
    const a = await measure(browser, mode, baseCss, olds, w);
    const b = await measure(browser, mode, headCss, news, w);
    for (const key of Object.keys(a)) {
      if (mode) darkColor[key] = b[key]["color"];
      cases++;
      const diffs = Object.keys(a[key]).filter((p) => a[key][p] !== b[key][p]);
      if (diffs.length) { failures++; rows.push(`FAIL ${mode || "light"} w=${w} case=${key}: ` + diffs.map((p) => `${p}: ${a[key][p]} -> ${b[key][p]}`).join("; ")); }
      else if (!mode && w === 1280 && key.endsWith("-1")) {
        const i = Number(key.split("-")[0]);
        const v = b[key];
        rows.push(`| \`${olds[i].tag}\` | font-size ${v["font-size"]}; line-height ${v["line-height"]}; weight ${v["font-weight"]}; color ${v["color"]} (dark: DARK${key}); background ${v["background-color"]}; border ${v["border-top-color"]} | identical (${Object.keys(v).length} props x 4 parents x 2 widths x light/dark) |`);
      }
    }
  }
  await browser.close();
  writeFileSync(outFile, rows.map((r) => r.replace(/DARK(\d+-\d+)/, (_, k) => darkColor[k] ?? "?")).join("\n"));
  console.log(`${pairs.length} pairs, ${cases} cases, ${failures} failing (light and dark-mode; parent line-heights asserted: ${PARENT_LH.join(", ")})`);
  process.exit(failures ? 1 : 0);
})();
