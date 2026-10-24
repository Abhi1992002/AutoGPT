// Same method as DS1's scripts/check-token-equivalence.ts (compile each side
// with its own checkout's tailwind.config.ts + globals.css, render in
// Chromium at a 16px root, compare computed values inside parents at
// leading-[1.5] / leading-[30px] / leading-normal, at 1280px and 390px), over
// this PR's exact class strings.
//   cd <head frontend> && npx tsx <this> --base <base frontend> [--out dir]
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";

import { CHECKS } from "./pairs";

const headDir = process.cwd();
const argv = process.argv.slice(2);
const baseDir = resolve(argv[argv.indexOf("--base") + 1]);
const outIdx = argv.indexOf("--out");
const req = createRequire(join(headDir, "package.json"));
const postcss = req("postcss");
const tailwindcss = req("tailwindcss");
const loadConfig = req("tailwindcss/loadConfig");
const { chromium } = req("@playwright/test");

const GROUPS: Record<string, string[]> = {
  box: ["margin-top","margin-right","margin-bottom","margin-left","padding-top","padding-right","padding-bottom","padding-left","border-top-width","border-right-width","border-bottom-width","border-left-width","border-top-color","border-right-color","border-bottom-color","border-left-color","border-top-style","border-top-left-radius","border-top-right-radius","border-bottom-left-radius","border-bottom-right-radius","background-color","background-image","box-shadow","width","max-width","overflow-x","overflow-y","display","--attention-card-gap"],
  flex: ["display","flex-direction","align-items","justify-content","column-gap","row-gap","flex-wrap","content-box-width","text-align"],
  text: ["font-size","line-height","letter-spacing","font-weight","font-family","text-transform","color","text-align"],
};
GROUPS.all = [...new Set([...GROUPS.box.filter((p) => p !== "display"), ...GROUPS.flex, ...GROUPS.text, "flex-grow","flex-shrink","flex-basis","min-width","align-self","fill","position","transition-property","transition-duration","height"])];

const PARENTS = ["leading-[1.5]", "leading-[30px]", "leading-normal"];
const WIDTHS = [1280, 390];

async function compile(dir: string, classes: string[]) {
  const config = loadConfig(join(dir, "tailwind.config.ts"));
  const globals = readFileSync(join(dir, "src/app/globals.css"), "utf8");
  const res = await postcss([tailwindcss({ ...config, content: [{ raw: classes.join(" "), extension: "html" }] })]).process(globals, { from: join(dir, "src/app/globals.css") });
  return res.css as string;
}

function chainHtml(chain: string[], id: string) {
  let html = `<span>Ag text</span>`;
  for (let level = chain.length - 1; level >= 0; level--) {
    html = `<div data-c="${id}" data-l="${level}" class="${chain[level]}">${html}${level === chain.length - 1 ? "<span>b</span>" : ""}</div>`;
  }
  return html;
}

async function values(css: string, side: "old" | "new") {
  const browser = await chromium.launch();
  const out: Record<string, Record<string, string>> = {};
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 800 } });
    const cells = CHECKS.flatMap((c, i) => PARENTS.map((p, j) => `<div class="${p}" style="font-size:16px">${chainHtml(c[side], `${i}-${j}`)}</div>`));
    // An unstyled div in each parent: the value column shows only what differs from it.
    PARENTS.forEach((p, j) => cells.push(`<div class="${p}" style="font-size:16px"><div data-c="ref-${j}" data-l="0"><span>Ag text</span><span>b</span></div></div>`));
    await page.setContent(`<html><head><style>${css}</style></head><body>${cells.join("")}</body></html>`);
    const root = await page.evaluate(() => getComputedStyle(document.documentElement).fontSize);
    if (root !== "16px") throw new Error(root);
    const props = GROUPS.all.concat(GROUPS.box);
    const got = await page.evaluate((props) => Array.from(document.querySelectorAll("[data-c]")).map((el) => {
      const s = getComputedStyle(el);
      const v: Record<string, string> = Object.fromEntries(props.map((p) => [p, s.getPropertyValue(p).trim()]));
      v["content-box-width"] = `${el.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight)}px`;
      return { k: `${(el as HTMLElement).dataset.c}:${(el as HTMLElement).dataset.l}`, v };
    }), [...new Set(props)]);
    for (const { k, v } of got) out[`${width}:${k}`] = v;
    await page.close();
  }
  await browser.close();
  return out;
}

async function main() {
  const oldCss = await compile(baseDir, [...CHECKS.flatMap((c) => c.old), ...PARENTS]);
  const newCss = await compile(headDir, [...CHECKS.flatMap((c) => c.new), ...PARENTS]);
  const oldV = await values(oldCss, "old");
  const newV = await values(newCss, "new");
  const lines = ["| element | old class string | new class string (as rendered) | compared | value (1280px, parent leading-[30px]) | result |", "| --- | --- | --- | --- | --- | --- |"];
  let failures = 0;
  CHECKS.forEach((c, i) => {
    for (const [ol, nl, group] of c.compare) {
      const problems = new Set<string>();
      // When a card moved onto Root > Row, `display: flex` moved to the Row
      // with the rest of the flex row; that level is compared under "flex".
      const split = c.new.length > c.old.length && group === "box";
      const props = GROUPS[group].filter((p) => p !== "--attention-card-gap" && !(split && p === "display"));
      for (const w of WIDTHS) for (let j = 0; j < PARENTS.length; j++) {
        const o = oldV[`${w}:${i}-${j}:${ol}`], n = newV[`${w}:${i}-${j}:${nl}`];
        for (const p of props) if (o[p] !== n[p]) problems.add(`${p}@${w}: ${o[p]} != ${n[p]}`);
      }
      if (problems.size) failures++;
      const shown = newV[`1280:${i}-1:${nl}`];
      const ref = newV["1280:ref-1:0"];
      const value = props.filter((p) => shown[p] !== ref[p] && !(p === "content-box-width" || p === "width" || p === "height")).map((p) => `${p}: ${shown[p]}`).join("; ") || "(all at element defaults)";
      lines.push(`| ${c.label} | \`${c.old[ol] || "(none)"}\` | \`${c.new[nl]}\` | ${group} (${props.length} props x ${WIDTHS.length * PARENTS.length} cases) | ${value} | ${problems.size ? `FAIL: ${[...problems].slice(0, 6).join("; ")}` : "identical"} |`);
    }
  });
  console.log(lines.join("\n"));
  const total = CHECKS.reduce((n, c) => n + c.compare.length, 0);
  console.log(`\n${CHECKS.length} class strings, ${total} comparisons: ${failures} failing`);
  if (outIdx >= 0) writeFileSync(join(resolve(argv[outIdx + 1]), "equivalence.md"), lines.join("\n") + `\n\n${CHECKS.length} class strings, ${total} comparisons: ${failures} failing\n`);
  process.exitCode = failures ? 1 : 0;
}
main();
