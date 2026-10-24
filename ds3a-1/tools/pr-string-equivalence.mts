/**
 * Every exact class string this PR writes, old (origin/dev) against new (HEAD),
 * rendered in Chromium at a 16px root and compared on computed values.
 *
 *   npx tsx pr-string-equivalence.ts <pairs.json> <base frontend dir> <out.md>
 *
 * Each pair is rendered: as written, through cn() under every Text variant
 * (strings on <Text>), under a generic conflict base (every class group the
 * PR touches, set to black, so a token tailwind-merge misreads stays visible),
 * under the TabsLine trigger base and the CategoryChip bases; inside parents at
 * leading-[30px] and leading-[1.5], plain and inside the profile-tabs panel
 * (`[data-profile-tabs] [role=tabpanel]`); at 1440 and 390 wide; in default
 * state and with :hover, :focus, :focus-visible, :focus-within and :active
 * switched on (rewritten to classes) for the element and its `group` parent, plus data-state=active. Read on
 * the element, its ::placeholder (as an <input>), and div/span/button/svg
 * children.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import type { Page } from "playwright-core";

const HEAD = process.cwd();
const req = createRequire(join(HEAD, "package.json"));
const postcss = req("postcss");
const tailwindcss = req("tailwindcss");
const loadConfig = req("tailwindcss/loadConfig");
const { chromium } = req("@playwright/test");

const { cn } = await import(join(HEAD, "src/lib/utils.ts"));
const textHelpers = (base: string) =>
  import(join(base, "src/components/atoms/Text/helpers.ts")) as Promise<{
    variants: Record<string, string>;
  }>;

const [pairsFile, baseDir, outFile] = process.argv.slice(2);
interface Pair {
  file: string;
  old: string;
  new: string;
  tag: string | null;
  variant?: string | null;
  extra?: { real: string; oldCls: string; newCls: string }[];
}
const allPairs = (JSON.parse(readFileSync(pairsFile, "utf8")).pairs as Pair[]).map(
  (p) => ({ ...p, new: p.new === "(removed)" ? "" : p.new }),
);
// The value shown for a class: its variants stripped, so `hover:text-error`
// shows what `text-error` resolves to. Results still cover every state.
function stripVariants(list: string) {
  return list
    .split(/\s+/)
    .filter((w) => w && !w.startsWith("dark:"))
    .map((w) => {
      let depth = 0;
      let cut = -1;
      for (let i = 0; i < w.length; i++) {
        if (w[i] === "[") depth++;
        else if (w[i] === "]") depth--;
        else if (w[i] === ":" && depth === 0) cut = i;
      }
      return w.slice(cut + 1);
    })
    .join(" ");
}
const seen = new Map<string, Pair & { files: Set<string> }>();
for (const p of allPairs) {
  const key = `${p.old}\u0000${p.new}\u0000${p.tag === "Text"}`;
  const hit = seen.get(key);
  if (hit) hit.files.add(p.file);
  else seen.set(key, { ...p, files: new Set([p.file]) });
}
const pairs = [...seen.values()];

const GENERIC =
  "text-black text-base leading-7 tracking-wide font-bold bg-black border-black ring-black divide-black from-black via-black to-black outline-black decoration-black placeholder:text-black hover:text-black hover:bg-black hover:border-black hover:to-black focus:text-black focus:bg-black focus-visible:ring-black group-hover:text-black data-[state=active]:text-black [&_svg]:text-black [&>svg]:text-black [&>div]:bg-black !text-black !text-base !leading-7";
const TABS_TRIGGER =
  "relative inline-flex items-center justify-center whitespace-nowrap px-3 py-3 font-sans text-[0.875rem] font-medium leading-[1.5rem] text-zinc-700 transition-all data-[state=active]:text-purple-600";
// TabsLine's trigger base as dev has it after DS2b (8a6b5b40a), which this
// PR's class string will merge into once it lands.
const TABS_TRIGGER_DEV =
  "relative inline-flex items-center justify-center whitespace-nowrap px-3 py-3 font-sans text-body font-medium leading-6 text-foreground-body transition-all data-[state=active]:text-brand-hover";
const CHIP =
  "inline-flex items-center rounded-full border border-[#e9e9e9] bg-transparent font-medium text-black";
const CHIP_NEW =
  "inline-flex items-center rounded-full border border-[#e9e9e9] bg-transparent font-medium text-foreground-base";
const CHIP_SIZES = ["h-7 gap-1 px-2 text-xs", "h-8 gap-1 px-2 text-xs", "h-9 gap-1.5 px-3.5 text-sm"];

interface Case {
  pair: number;
  real?: string;
  context: string;
  oldCls: string;
  newCls: string;
}

// Colour-only utilities render nothing without a width or a direction, so
// each one also gets the utility that makes it visible, under its own variant.
function companions(list: string) {
  const out = new Set<string>();
  for (const w of list.split(/\s+/)) {
    const m = w.match(/^(.*:)?(!?)(ring|divide|from|via|to)-(.+)$/);
    if (!m) continue;
    const [, variant = "", bang, util, rest] = m;
    if (util === "ring" && /^(\d|inset|offset)/.test(rest)) continue;
    if (util === "divide" && /^(x|y|\d|solid|dashed|dotted|double|none)/.test(rest)) continue;
    const helper = util === "ring" ? "ring-2" : util === "divide" ? "divide-y-2" : "bg-gradient-to-b";
    out.add(`${variant}${bang}${helper}`);
  }
  return [...out].join(" ");
}

async function buildCases() {
  const oldText = (await textHelpers(baseDir)).variants;
  const newText = (await textHelpers(HEAD)).variants;
  const cases: Case[] = [];
  pairs.forEach((p, i) => {
    cases.push({ pair: i, context: "as written", oldCls: p.old, newCls: p.new });
    for (const e of p.extra ?? []) {
      cases.push({ pair: i, real: e.real, context: `real ${e.real}`, oldCls: e.oldCls, newCls: e.newCls });
    }
    cases.push({ pair: i, context: "cn(generic base)", oldCls: cn(GENERIC, p.old), newCls: cn(GENERIC, p.new) });
    const extra = companions(p.old);
    if (extra) {
      cases.push({ pair: i, context: `with ${extra}`, oldCls: `${p.old} ${extra}`, newCls: `${p.new} ${extra}` });
    }
    if (p.tag === "Text" && p.variant) {
      const v = p.variant;
      cases.push({ pair: i, real: `<Text variant="${v}">`, context: `real cn(Text ${v})`, oldCls: cn(oldText[v], p.old), newCls: cn(newText[v], p.new) });
    }
    if (p.tag === "CategoryTag") {
      cases.push({ pair: i, real: '<CategoryTag size="medium">', context: "real cn(CategoryTag medium)", oldCls: cn(CHIP, CHIP_SIZES[1], "max-w-full", p.old), newCls: cn(CHIP_NEW, CHIP_SIZES[1], "max-w-full", p.new) });
    }
    if (p.file.includes("team/helpers.ts") && p.new.includes("leading-inherit")) {
      cases.push({ pair: i, real: "<TabsLineTrigger>", context: "real cn(TabsLineTrigger)", oldCls: cn(TABS_TRIGGER, p.old), newCls: cn(TABS_TRIGGER, p.new) });
      cases.push({ pair: i, real: "<TabsLineTrigger> (dev 8a6b5b40a base)", context: "real cn(TabsLineTrigger dev)", oldCls: cn(TABS_TRIGGER_DEV, p.old), newCls: cn(TABS_TRIGGER_DEV, p.new) });
    }
    if (p.tag === "Text") {
      for (const v of Object.keys(oldText)) {
        cases.push({ pair: i, context: `cn(Text ${v})`, oldCls: cn(oldText[v], p.old), newCls: cn(newText[v], p.new) });
      }
    }
    if (p.file.includes("team/helpers.ts")) {
      cases.push({ pair: i, context: "cn(TabsLine trigger)", oldCls: cn(TABS_TRIGGER, p.old), newCls: cn(TABS_TRIGGER, p.new) });
    }
    if (p.file.includes("CategoryChip") || p.tag === "CategoryTag") {
      for (const s of CHIP_SIZES) {
        cases.push({ pair: i, context: `cn(chip ${s.split(" ")[0]})`, oldCls: cn(CHIP, s, p.old), newCls: cn(CHIP, s, p.new) });
      }
    }
  });
  return cases;
}

async function compile(dir: string, classes: string[]) {
  const config = loadConfig(join(dir, "tailwind.config.ts"));
  const globals = readFileSync(join(dir, "src/app/globals.css"), "utf8");
  const raw = [...classes, "group", "leading-[30px]", "leading-[1.5]"].join(" ");
  const result = await postcss([tailwindcss({ ...config, content: [{ raw, extension: "html" }] })]).process(globals, {
    from: join(dir, "src/app/globals.css"),
  });
  return result.css as string;
}

const PROPS = [
  "color", "background-color", "background-image", "border-top-color", "border-right-color",
  "border-bottom-color", "border-left-color", "border-top-width", "box-shadow", "outline-color",
  "outline-style", "outline-width", "text-decoration-color", "font-size", "line-height",
  "letter-spacing", "font-weight", "font-family", "opacity", "fill", "stroke", "display",
  "margin-top", "margin-bottom", "padding-top", "padding-left",
  "width", "height", "border-top-left-radius", "border-top-style", "flex-shrink", "text-align",
];
const PARENTS = ["leading-[30px]", "leading-[1.5]"];
const WRAPS = ["plain", "profile-tabs"];
const STATES = ["default", "hover", "focus", "focus-visible", "focus-within", "active"];
const WIDTHS = [1440, 390];

function html(css: string, classes: string[]) {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const cells: string[] = [];
  classes.forEach((cls, i) => {
    for (const parent of PARENTS) {
      for (const wrap of WRAPS) {
        const inner = `<div class="group ${parent}" style="font-size:16px;color:rgb(1,2,3)"><div data-host="${i}" data-state="active" class="${esc(cls)}">Ag<div>d</div><span>s</span><button>b</button><svg width="4" height="4"><rect width="4" height="4"/></svg></div><input data-input="${i}" class="${esc(cls)}" placeholder="p"></div>`;
        cells.push(wrap === "plain" ? inner : `<div data-profile-tabs><div role="tabpanel">${inner}</div></div>`);
      }
    }
  });
  return `<html><head><style>${css}</style><style>*,*::before,*::after,*::placeholder{transition:none!important;animation:none!important}</style></head><body>${cells.join("")}</body></html>`;
}

// Pseudo-classes become plain classes, so a state is switched on for every
// element at once. Old and new stylesheets get the same rewrite.
function forceable(css: string) {
  return css
    .replace(/(?<!\\):focus-visible/g, ".fs-focus-visible")
    .replace(/(?<!\\):focus-within/g, ".fs-focus-within")
    .replace(/(?<!\\):focus(?![-\w])/g, ".fs-focus")
    .replace(/(?<!\\):hover/g, ".fs-hover")
    .replace(/(?<!\\):active/g, ".fs-active");
}

async function measure(page: Page, css: string, classes: string[], state: string) {
  await page.setContent(html(forceable(css), classes));
  if (state !== "default") {
    await page.evaluate(`document.querySelectorAll("[data-host], .group, [data-input]").forEach((el) => el.classList.add("fs-${state}"))`);
  }
  const fn = `(props) => {
    function read(el, pseudo) {
      const s = getComputedStyle(el, pseudo);
      return props.map((p) => s.getPropertyValue(p)).join("|");
    }
    const inputs = document.querySelectorAll("[data-input]");
    return Array.from(document.querySelectorAll("[data-host]")).map((host, k) =>
      [read(host), ...Array.from(host.children).map((c) => read(c)), read(inputs[k]), read(inputs[k], "::placeholder")].join("#"));
  }`;
  return page.evaluate(`(${fn})(${JSON.stringify(PROPS)})`) as Promise<string[]>;
}

const cases = await buildCases();
const oldCss = await compile(baseDir, cases.map((c) => c.oldCls));
const newCss = await compile(HEAD, [
  ...cases.map((c) => c.newCls),
  ...pairs.map((p) => `${stripVariants(p.new)} ${companions(stripVariants(p.new))}`),
]);
const browser = await chromium.launch();
const failures = new Map<number, string[]>();
let measurements = 0;
for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  for (const state of STATES) {
    const before = await measure(page, oldCss, cases.map((c) => c.oldCls), state);
    const after = await measure(page, newCss, cases.map((c) => c.newCls), state);
    const per = PARENTS.length * WRAPS.length;
    cases.forEach((c, ci) => {
      for (let k = 0; k < per; k++) {
        measurements++;
        const idx = ci * per + k;
        if (before[idx] !== after[idx]) {
          if (process.env.DEBUG_DIFF && !failures.has(ci)) {
            const b = before[idx].split("#"), a = after[idx].split("#");
            b.forEach((part, e) => { const bp = part.split("|"), ap = a[e].split("|"); bp.forEach((v, q) => { if (v !== ap[q]) console.error(`DIFF case ${ci} el ${e} ${PROPS[q]}: ${v} != ${ap[q]}`); }); });
          }
          const list = failures.get(ci) ?? [];
          list.push(`${width}px ${state} ${PARENTS[Math.floor(k / WRAPS.length)]} ${WRAPS[k % WRAPS.length]}`);
          failures.set(ci, list);
        }
      }
    });
  }
  await page.close();
}

// Desktop default values of the as-written case, for the table.
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const shownClasses = pairs.map((p) => {
  const bare = stripVariants(p.new);
  return `${bare} ${companions(bare)}`.trim();
});
const shown = await measure(page, newCss, shownClasses, "default");
await browser.close();

const casesPerPair = new Map<number, number>();
cases.forEach((c) => casesPerPair.set(c.pair, (casesPerPair.get(c.pair) ?? 0) + 1));
const failingPairs = new Set([...failures.keys()].map((ci) => cases[ci].pair));
const lines = [
  `| # | old ${process.env.TOKEN_TABLE ? "class" : "class string"} | new ${process.env.TOKEN_TABLE ? "class" : "class string"} | ${process.env.TOKEN_TABLE ? "uses | " : ""}value of the new class (computed, 16px root, in a leading-[30px] parent, 1440px, variant stripped, with the ring/divide/gradient helper that makes a colour visible) | result |`,
  process.env.TOKEN_TABLE ? "| --- | --- | --- | --- | --- | --- |" : "| --- | --- | --- | --- | --- |",
];
const changedProps = (oldS: string, newS: string) => {
  const o = new Set(oldS.split(/\s+/));
  const n = new Set(newS.split(/\s+/));
  return { removed: [...o].filter((x) => !n.has(x)), added: [...n].filter((x) => !o.has(x)) };
};
pairs.forEach((p, i) => {
  const elements = shown[i * PARENTS.length * WRAPS.length].split("#");
  const vals = elements[0].split("|");
  const divided = elements[2].split("|");
  const { removed, added } = changedProps(stripVariants(p.old), stripVariants(p.new));
  const relevant = PROPS.map((prop, k) => [prop, vals[k]] as const).filter(([prop, v]) => {
    const touched = [...removed, ...added].join(" ");
    if (/text-\[|text-(body|caption|tiny|lead|heading|title|display)|leading-/.test(touched) && /font-size|line-height/.test(prop)) return true;
    if (/tracking-/.test(touched) && prop === "letter-spacing") return true;
    if (/font-\[|font-(normal|medium|semibold)/.test(touched) && prop === "font-weight") return true;
    if (/(^|[\s:!])text-/.test(touched) && prop === "color") return true;
    if (/(^|\s|!)bg-/.test(touched) && prop === "background-color") return true;
    if (/(^|\s|!)(from|via|to)-/.test(touched) && prop === "background-image") return true;
    if (/border-/.test(touched) && prop === "border-top-color") return true;
    if (/ring-/.test(touched) && prop === "box-shadow") return true;
    return false;
  });
  if (/(^|\s)divide-/.test(stripVariants(p.new))) {
    relevant.push(["border-top-color (divided child)", divided[PROPS.indexOf("border-top-color")]] as const);
  }
  const fail = failingPairs.has(i);
  lines.push(
    `| ${i + 1} | \`${p.old}\` | ${p.new ? `\`${p.new}\`` : "(removed)"} | ${process.env.TOKEN_TABLE ? `${p.file.slice(1)} | ` : ""}${relevant.map(([k, v]) => `${k}: ${v}`).join("; ") || (p.new ? "(no colour or type property: see result)" : "dark: needs a .dark-mode ancestor, which the forced light theme never sets: applies nowhere")} | ${fail ? "FAIL" : `identical (${(casesPerPair.get(i) ?? 0) * PARENTS.length * WRAPS.length * STATES.length * WIDTHS.length} measurements)`} |`,
  );
});
// Rule 14: the cn()-merged class string on the real element, old and new.
const realRows = cases
  .map((c, ci) => ({ c, ci }))
  .filter(({ c }) => c.real);
let realLines: string[] = [];
if (realRows.length) {
  const rp = await chromium.launch();
  const pg = await rp.newPage({ viewport: { width: 1440, height: 900 } });
  const realVals = await measure(pg, newCss, realRows.map(({ c }) => c.newCls), "default");
  await rp.close();
  realLines = [
    "| element | old merged class string | new merged class string | font-size · line-height · color (in a leading-[30px] parent, 1440px) | result |",
    "| --- | --- | --- | --- | --- |",
    ...realRows.map(({ c, ci }, k) => {
      const v = realVals[k * PARENTS.length * WRAPS.length].split("#")[0].split("|");
      const val = ["font-size", "line-height", "color"].map((pr) => v[PROPS.indexOf(pr)]).join(" · ");
      return `| \`${c.real}\` | \`${c.oldCls}\` | \`${c.newCls}\` | ${val} | ${failures.has(ci) ? "FAIL" : `identical (${PARENTS.length * WRAPS.length * STATES.length * WIDTHS.length} measurements)`} |`;
    }),
  ];
}
const failLines = [...failures.entries()].map(
  ([ci, where]) => `- FAIL ${cases[ci].context}: \`${cases[ci].oldCls}\` -> \`${cases[ci].newCls}\` at ${where.slice(0, 4).join(", ")}${where.length > 4 ? ` (+${where.length - 4})` : ""}`,
);
const summary = `${pairs.length} unique class strings (${allPairs.length} occurrences), ${cases.length} cases (as written, cn() contexts), ${measurements} measurements (2 widths x 6 states x 2 parent line-heights x plain/profile-tabs): ${failures.size} failing cases`;
writeFileSync(outFile, `${summary}\n\n${lines.join("\n")}\n\n${realLines.length ? `### cn()-merged on the real element\n\n${realLines.join("\n")}\n\n` : ""}${failLines.join("\n")}\n`);
if (realLines.length) writeFileSync(outFile.replace(/\.md$/, "-merged.md"), `${realLines.join("\n")}\n`);
console.log(summary);
failLines.slice(0, 40).forEach((l) => console.log(l));
process.exitCode = failures.size ? 1 : 0;
