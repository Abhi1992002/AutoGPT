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

async function css(dir: string, classes: string[]) {
  const config = loadConfig(join(dir, "tailwind.config.ts"));
  const globals = readFileSync(join(dir, "src/app/globals.css"), "utf8");
  const r = await postcss([tailwindcss({ ...config, content: [{ raw: classes.join(" "), extension: "html" }] })]).process(globals, { from: join(dir, "src/app/globals.css") });
  return r.css as string;
}
const PARENTS = ["leading-[1.5]", "leading-[30px]", "leading-normal"];
const WIDTHS = [1280, 390];

async function measure(browser: any, cssText: string, items: { tag: string; cls: string }[], width: number) {
  const page = await browser.newPage({ viewport: { width, height: 800 } });
  const body = items.flatMap((it, i) => PARENTS.map((p, j) => `<div class="${p}" style="font-size:16px"><${it.tag} data-i="${i}-${j}" class="${it.cls.replace(/"/g, "&quot;")}"><span>Ab</span> text</${it.tag}></div>`)).join("");
  await page.setContent(`<html><head><style>${cssText}</style><style>${PARENTS.map((p) => "").join("")}</style></head><body>${body}</body></html>`);
  if ((await page.evaluate(() => getComputedStyle(document.documentElement).fontSize)) !== "16px") throw new Error("root not 16px");
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
  for (const w of WIDTHS) {
    const a = await measure(browser, baseCss, olds, w);
    const b = await measure(browser, headCss, news, w);
    for (const key of Object.keys(a)) {
      cases++;
      const diffs = Object.keys(a[key]).filter((p) => a[key][p] !== b[key][p]);
      if (diffs.length) { failures++; rows.push(`FAIL w=${w} case=${key}: ` + diffs.map((p) => `${p}: ${a[key][p]} -> ${b[key][p]}`).join("; ")); }
      else if (w === 1280 && key.endsWith("-1")) {
        const i = Number(key.split("-")[0]);
        const v = b[key];
        rows.push(`| \`${olds[i].tag}\` | font-size ${v["font-size"]}; line-height ${v["line-height"]}; weight ${v["font-weight"]}; color ${v["color"]}; background ${v["background-color"]}; border ${v["border-top-color"]} | identical (${Object.keys(v).length} props x 3 parents x 2 widths) |`);
      }
    }
  }
  await browser.close();
  writeFileSync(outFile, rows.join("\n"));
  console.log(`${pairs.length} pairs, ${cases} cases, ${failures} failing`);
  process.exit(failures ? 1 : 0);
})();
