/**
 * Companion to scripts/check-token-equivalence.ts (DS1), which only checks
 * DS1's own token tables. This renders every exact class string the PR
 * writes next to the string it replaced and compares the whole computed
 * style (every resolved CSS property Chromium reports, plus two children for
 * divide/space utilities) at a 16px root.
 *
 * Cases per pair: viewport 1440 and 390, parent line-height leading-[1.5],
 * leading-[30px] and leading-normal (parent font-size 16px, colour #010203),
 * class list as written and after cn(); and the same for each variant scope
 * (hover:, focus-visible:, placeholder:, before:, group-hover:, md: ...)
 * with its prefix stripped, so state and pseudo-element values are
 * compared too. Old classes compile against the base checkout's
 * tailwind.config.ts and globals.css, new ones against this checkout's.
 *
 *   npx tsx check-class-strings.ts <pairs.json> --base <dir> --out <md>
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import type { Browser } from "@playwright/test";

const headDir = process.cwd();
const req = createRequire(join(headDir, "package.json"));
const postcss = req("postcss");
const tailwindcss = req("tailwindcss");
const loadConfig = req("tailwindcss/loadConfig");
const { chromium } = req("@playwright/test");

interface Side { cls: string; style?: string }
interface Pair { file: string; kind: string; old: Side; new: Side; note?: string }

function lastTopLevelColon(text: string) {
  let depth = 0, found = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "[") depth++;
    else if (text[i] === "]") depth = Math.max(0, depth - 1);
    else if (text[i] === ":" && depth === 0) found = i;
  }
  return found;
}
function scopes(list: string) {
  const out = new Map<string, string[]>();
  for (const word of list.split(/\s+/).filter(Boolean)) {
    const c = lastTopLevelColon(word);
    const scope = word.slice(0, c + 1);
    if (!scope) continue;
    out.set(scope, [...(out.get(scope) ?? []), word.slice(c + 1)]);
  }
  return out;
}

async function compile(dir: string, classes: string[]) {
  const config = loadConfig(join(dir, "tailwind.config.ts"));
  const globals = readFileSync(join(dir, "src/app/globals.css"), "utf8");
  const result = await postcss([
    tailwindcss({ ...config, content: [{ raw: classes.join(" "), extension: "html" }] }),
  ]).process(globals, { from: join(dir, "src/app/globals.css") });
  return result.css as string;
}

const PARENTS = ["leading-[1.5]", "leading-[30px]", "leading-normal"];
const VIEWPORTS = [1440, 390];

async function measure(browser: Browser, css: string, cases: { cls: string; style: string }[]) {
  const results: Record<string, string>[][] = [];
  for (const width of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const html = cases
      .map((c, i) =>
        PARENTS.map(
          (p) =>
            `<div class="${p}" style="font-size:16px;color:#010203"><div data-i="${i}" class="${c.cls}" style="${c.style}"><span>Ag</span><span>Ag</span></div></div>`,
        ).join(""),
      )
      .join("");
    await page.setContent(`<html><head><style>${css}</style></head><body>${html}</body></html>`);
    const root = await page.evaluate("getComputedStyle(document.documentElement).fontSize");
    if (root !== "16px") throw new Error(`root font-size ${root}`);
    // A string, so the bundler's __name helper never reaches the page.
    const values = (await page.evaluate(`Array.from(document.querySelectorAll("[data-i]")).map((el) => {
      const out = {};
      const nodes = [el, ...Array.from(el.children)];
      nodes.forEach((node, n) => {
        const s = getComputedStyle(node);
        for (let k = 0; k < s.length; k++) out[(n ? "child" + n + " " : "") + s[k]] = s.getPropertyValue(s[k]);
      });
      return { i: Number(el.dataset.i), out };
    })`)) as { i: number; out: Record<string, string> }[];
    for (const v of values) (results[v.i] ??= []).push(v.out);
    await page.close();
  }
  return results;
}

async function main() {
  const argv = process.argv.slice(2);
  const { cn } = await import(join(headDir, "src/lib/utils.ts"));
  const pairs: Pair[] = JSON.parse(readFileSync(argv[0], "utf8"));
  const baseDir = resolve(argv[argv.indexOf("--base") + 1]);
  const outFile = resolve(argv[argv.indexOf("--out") + 1]);

  // Expand every pair into cases: full list (as written, cn) and each scope.
  type Case = { pair: number; label: string; old: { cls: string; style: string }; new: { cls: string; style: string } };
  const cases: Case[] = [];
  pairs.forEach((p, i) => {
    for (const [mode, f] of [["as written", (s: string) => s], ["cn()", (s: string) => cn(s)]] as const) {
      cases.push({ pair: i, label: mode, old: { cls: f(p.old.cls), style: p.old.style ?? "" }, new: { cls: f(p.new.cls), style: p.new.style ?? "" } });
    }
    const so = scopes(p.old.cls), sn = scopes(p.new.cls);
    for (const scope of new Set([...so.keys(), ...sn.keys()])) {
      cases.push({ pair: i, label: scope, old: { cls: (so.get(scope) ?? []).join(" "), style: "" }, new: { cls: (sn.get(scope) ?? []).join(" "), style: "" } });
    }
  });
  const bare = { cls: "", style: "" };
  const oldCss = await compile(baseDir, [...cases.map((c) => c.old.cls), ...PARENTS]);
  const newCss = await compile(headDir, [...cases.map((c) => c.new.cls), ...PARENTS]);
  const browser = await chromium.launch();
  const oldV = await measure(browser, oldCss, [bare, ...cases.map((c) => c.old)]);
  const newV = await measure(browser, newCss, [bare, ...cases.map((c) => c.new)]);
  await browser.close();

  const perPair = pairs.map(() => ({ problems: new Set<string>(), n: 0 }));
  cases.forEach((c, k) => {
    const o = oldV[k + 1], n = newV[k + 1];
    o.forEach((ov, x) => {
      perPair[c.pair].n++;
      for (const prop of new Set([...Object.keys(ov), ...Object.keys(n[x])])) {
        // Custom properties are unresolved token streams (#7733f5 vs
        // rgb(119 51 245 / 1)); every property that reads one is compared
        // resolved, so they are left out of the comparison.
        if (/(^| )--/.test(prop)) continue;
        if (ov[prop] !== n[x][prop]) perPair[c.pair].problems.add(`[${c.label}] ${prop}: ${ov[prop]} != ${n[x][prop]}`);
      }
    });
  });
  // Value column: properties the full new list changes from a bare element
  // (desktop, parent leading-[30px], as written).
  const lines = [
    "| file | old class string | new class string | value (computed, 16px root, every property the list sets) | result |",
    "| --- | --- | --- | --- | --- |",
  ];
  let failing = 0;
  pairs.forEach((p, i) => {
    const k = cases.findIndex((c) => c.pair === i);
    const base = newV[0][1];
    const describe = (index: number, prefix: string) =>
      Object.entries(newV[index + 1][1])
        .filter(([prop, v]) => base[prop] !== v && (!prop.startsWith("child") || /^child\d border-top-(color|width)$/.test(prop)) && !/(^| )--|^(-webkit-)?(perspective|transform)-origin$|^(block|inline)-size$|^height$/.test(prop) && !(prop === "width" && !pairs[i].new.style))
        .map(([prop, v]) => `${prefix}${prop}: ${v}`);
    const scoped = cases
      .map((c, index) => ({ c, index }))
      .filter(({ c }) => c.pair === i && c.label !== "as written" && c.label !== "cn()")
      .flatMap(({ c, index }) => describe(index, `[${c.label}] `));
    const value = [...describe(k, ""), ...scoped].join("; ");
    const { problems, n } = perPair[i];
    if (problems.size) failing++;
    const esc = (s: string) => s.replace(/\|/g, "\\|");
    const side = (s: Side) => `\`${esc(s.cls)}\`${s.style ? ` style=\`${esc(s.style)}\`` : ""}`;
    lines.push(`| ${p.file.replace(/^.*organisms\//, "")}${p.note ? ` (${p.note})` : ""} | ${side(p.old)} | ${side(p.new)} | ${esc(value)} | ${problems.size ? `FAIL: ${esc([...problems].slice(0, 6).join("; "))}` : `identical (${n} cases)`} |`);
  });
  writeFileSync(outFile, lines.join("\n") + "\n");
  console.log(`${pairs.length} class strings, ${cases.length} cases x ${VIEWPORTS.length * PARENTS.length} renders: ${failing} failing`);
  process.exitCode = failing ? 1 : 0;
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
