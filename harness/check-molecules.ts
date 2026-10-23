/**
 * Value equivalence for every class string DS2b (SECRT-3103) writes in
 * src/components/molecules, beyond the pairs DS1's
 * scripts/check-token-equivalence.ts already proves.
 *
 *   npx tsx <this> --base <base frontend dir> --pairs pairs.json --manual manual.json --out <dir>
 *
 * Old strings compile against the base checkout's tailwind.config.ts +
 * globals.css, new ones against this checkout's. Each pair renders inside
 * parents at leading-[1.5], leading-[30px] and leading-normal, at 1280 and
 * 390px wide, as written and after cn(), and every computed property in PROPS
 * must match. Variant-scoped tokens (hover:, focus:, data-[..]:, [&>svg]:,
 * placeholder:, motion-reduce: ...) are checked by stripping the same prefix
 * on both sides and applying them on top of the unscoped tokens, which is
 * what the browser does when the state is active. `dark:` tokens are only
 * on the old side and never match (darkMode is `.dark-mode`, which nothing
 * sets), so they are listed as removed. Manual pairs (CSS modules, inline
 * styles, attribute-scoped selectors) render the real markup on both sides.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import type { Browser } from "@playwright/test";
import { cn } from "../../autogpt_platform/frontend/src/lib/utils";

const req = createRequire(join(process.cwd(), "package.json"));
const postcss = req("postcss");
const tailwindcss = req("tailwindcss");
const loadConfig = req("tailwindcss/loadConfig");
const { chromium } = req("@playwright/test");

const PROPS = [
  "font-size", "line-height", "letter-spacing", "font-weight", "font-family",
  "text-transform", "color", "background-color", "background-image",
  "border-top-color", "border-right-color", "border-bottom-color", "border-left-color",
  "border-top-width", "border-bottom-width", "border-top-style",
  "border-top-left-radius", "border-top-right-radius", "border-bottom-left-radius", "border-bottom-right-radius",
  "box-shadow", "outline-color", "outline-style", "outline-width",
  "padding-top", "padding-right", "padding-bottom", "padding-left",
  "margin-top", "margin-right", "margin-bottom", "margin-left",
  "opacity", "filter", "backdrop-filter", "mask-image", "-webkit-mask-image",
  "position", "top", "left", "width", "height", "transform",
  "animation-duration", "animation-timing-function", "animation-direction",
  "animation-iteration-count", "display", "text-decoration-line",
];
const CHILD_PROPS = ["border-top-color", "border-top-width", "background-color"];
const PARENTS = ["leading-[1.5]", "leading-[30px]", "leading-normal"];
const WIDTHS = [1280, 390];

interface Pair { file: string; old: string | null; new: string | null }
interface Manual {
  file: string;
  label: string;
  /** Raw CSS the old markup relied on (a CSS module, inline style). */
  oldCss?: string;
  /** Third-party CSS both sides load (Sonner). */
  newCss?: string;
  oldHtml: string;
  newHtml: string;
  reducedMotion?: boolean;
  /** Freeze animations at their first frame so transforms compare. */
  pause?: boolean;
}

function argv(name: string) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function lastTopLevelColon(t: string) {
  let depth = 0, found = -1;
  for (let i = 0; i < t.length; i++) {
    if (t[i] === "[") depth++;
    else if (t[i] === "]") depth--;
    else if (t[i] === ":" && depth === 0) found = i;
  }
  return found;
}

function split(list: string) {
  const scopes = new Map<string, string[]>();
  for (const tok of list.split(/\s+/).filter(Boolean)) {
    const c = lastTopLevelColon(tok);
    const scope = tok.slice(0, c + 1);
    const bare = tok.slice(c + 1);
    if (!scopes.has(scope)) scopes.set(scope, []);
    scopes.get(scope)!.push(bare);
  }
  return scopes;
}

// One render case per variant scope: the unscoped tokens, plus each scope's
// tokens applied on top as if its state were active.
function cases(oldList: string, newList: string) {
  const o = split(oldList), n = split(newList);
  const removed: string[] = [];
  for (const [scope, toks] of o)
    if (scope.startsWith("dark:")) removed.push(...toks.map((t) => scope + t));
  const scopes = new Set([...o.keys(), ...n.keys()].filter((s) => !s.startsWith("dark:")));
  const base = (m: Map<string, string[]>) => (m.get("") ?? []).join(" ");
  // `[&]:` always matches and, like any variant, is emitted after the
  // unscoped utilities, so the scope wins exactly as it does when its state
  // is active.
  const active = (toks: string[] | undefined) =>
    (toks ?? []).map((t) => `[&]:${t}`).join(" ");
  const out: { scope: string; old: string; new: string }[] = [];
  for (const scope of scopes) {
    if (scope === "") out.push({ scope: "(none)", old: base(o), new: base(n) });
    else
      out.push({
        scope,
        old: `${base(o)} ${active(o.get(scope))}`.trim(),
        new: `${base(n)} ${active(n.get(scope))}`.trim(),
      });
  }
  if (out.length === 0) out.push({ scope: "(none)", old: "", new: "" });
  return { out, removed };
}

async function compile(dir: string, raw: string) {
  const config = loadConfig(join(dir, "tailwind.config.ts"));
  const globals = readFileSync(join(dir, "src/app/globals.css"), "utf8");
  const r = await postcss([
    tailwindcss({ ...config, content: [{ raw, extension: "html" }] }),
  ]).process(globals, { from: join(dir, "src/app/globals.css") });
  return r.css as string;
}

function cell(cls: string, id: string) {
  return `<div data-id="${id}" class="${cls}"><span>a</span><span>b</span><i data-sb style="display:block;width:4px;height:4px;background-color:var(--scrollbar-thumb)"></i></div>`;
}

async function measure(browser: Browser, css: string, items: { id: string; html: string }[], reducedMotion = false) {
  const results: Record<string, Record<string, string>[]> = {};
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 800 }, reducedMotion: reducedMotion ? "reduce" : "no-preference" });
    const html = items
      .flatMap((it) =>
        PARENTS.map(
          (p, pi) =>
            `<div class="${p}" style="font-size:16px;position:relative;width:200px;height:120px" data-host="${it.id}:${pi}">${it.html}</div>`,
        ),
      )
      .join("");
    await page.setContent(`<html><head><style>${css}*{animation-play-state:paused!important;animation-delay:0s!important}</style></head><body>${html}</body></html>`);
    const vals = await page.evaluate(
      ({ props, childProps }) =>
        Array.from(document.querySelectorAll("[data-host]")).map((host) => {
          const el = host.firstElementChild as HTMLElement;
          const s = getComputedStyle(el);
          const v: Record<string, string> = {};
          for (const p of props) v[p] = s.getPropertyValue(p);
          const kid = el.children[1] as HTMLElement | undefined;
          if (kid) {
            const k = getComputedStyle(kid);
            for (const p of childProps) v[`child:${p}`] = k.getPropertyValue(p);
          }
          const sb = el.querySelector("[data-sb]") as HTMLElement | null;
          if (sb) v["scrollbar-thumb"] = getComputedStyle(sb).backgroundColor;
          return { id: (host as HTMLElement).dataset.host!.split(":")[0], v };
        }),
      { props: PROPS, childProps: CHILD_PROPS },
    );
    for (const { id, v } of vals) (results[id] ??= []).push(v);
    await page.close();
  }
  return results;
}

function diff(a: Record<string, string>[], b: Record<string, string>[]) {
  const problems = new Set<string>();
  a.forEach((x, i) => {
    for (const k of Object.keys(x)) if (x[k] !== b[i]?.[k]) problems.add(`${k}: ${x[k]} != ${b[i]?.[k]}`);
  });
  return [...problems];
}

function summary(v: Record<string, string>) {
  const keys = ["font-size", "line-height", "font-weight", "color", "background-color", "background-image", "border-top-color", "box-shadow", "child:border-top-color", "scrollbar-thumb", "animation-duration", "mask-image", "filter"];
  const blank = new Set(["", "none", "normal", "0s", "rgba(0, 0, 0, 0)"]);
  return keys
    .filter((k) => v[k] !== undefined && !blank.has(v[k]))
    .map((k) => `${k}: ${v[k]}`)
    .join("; ");
}

async function main() {
  const headDir = process.cwd();
  const baseDir = resolve(argv("--base")!);
  const pairs = (JSON.parse(readFileSync(argv("--pairs")!, "utf8")) as Pair[]).filter((p) => p.old !== null && p.new !== null);
  const manual = JSON.parse(readFileSync(argv("--manual")!, "utf8")) as Manual[];
  const outDir = resolve(argv("--out")!);
  mkdirSync(outDir, { recursive: true });

  type Row = { file: string; old: string; new: string; scope: string; mode: string; oldList: string; newList: string };
  const rows: Row[] = [];
  const removedRows: { file: string; tokens: string[] }[] = [];
  const seen = new Set<string>();
  for (const p of pairs) {
    const key = `${p.old}=>${p.new}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const { out, removed } = cases(p.old!, p.new!);
    if (removed.length) removedRows.push({ file: p.file, tokens: removed });
    const cnOnly = /\((Text|trigger|active)/.test(p.file);
    for (const c of out)
      for (const mode of cnOnly ? ["cn()"] : ["as written", "cn()"]) {
        rows.push({
          file: p.file, old: p.old!, new: p.new!, scope: c.scope, mode,
          oldList: mode === "cn()" ? cn(c.old) : c.old,
          newList: mode === "cn()" ? cn(c.new) : c.new,
        });
      }
  }
  // cn() is applied before splitting too: merge the whole string, then split.
  for (const p of pairs) {
    const { out } = cases(cn(p.old!), cn(p.new!));
    for (const c of out)
      rows.push({ file: p.file, old: p.old!, new: p.new!, scope: c.scope, mode: "cn(whole)", oldList: c.old, newList: c.new });
  }

  const oldCss = await compile(baseDir, rows.map((r) => r.oldList).concat(PARENTS).join(" "));
  const newCss = await compile(headDir, rows.map((r) => r.newList).concat(PARENTS).join(" "));
  const browser = await chromium.launch();
  const oldVals = await measure(browser, oldCss, rows.map((r, i) => ({ id: `r${i}`, html: cell(r.oldList, `r${i}`) })));
  const newVals = await measure(browser, newCss, rows.map((r, i) => ({ id: `r${i}`, html: cell(r.newList, `r${i}`) })));

  const manualRes: { m: Manual; problems: string[]; value: string }[] = [];
  for (const m of manual) {
    const mOld = await compile(baseDir, m.oldHtml + " " + PARENTS.join(" "));
    const mNew = await compile(headDir, m.newHtml + " " + PARENTS.join(" "));
    for (const rm of m.reducedMotion ? [false, true] : [false]) {
      const freeze = m.pause ? "*{animation-play-state:paused!important;animation-delay:0s!important}" : "";
      const a = await measure(browser, mOld + (m.oldCss ?? "") + freeze, [{ id: "m", html: m.oldHtml }], rm);
      const b = await measure(browser, mNew + (m.newCss ?? "") + freeze, [{ id: "m", html: m.newHtml }], rm);
      manualRes.push({ m: { ...m, label: m.label + (rm ? " (prefers-reduced-motion)" : "") }, problems: diff(a.m, b.m), value: summary(b.m[0]) });
    }
  }
  await browser.close();

  let failures = 0;
  const grouped = new Map<string, { file: string; old: string; new: string; checks: number; problems: string[]; value: string }>();
  rows.forEach((r, i) => {
    const key = `${r.file}|${r.old}|${r.new}`;
    const g = grouped.get(key) ?? { file: r.file, old: r.old, new: r.new, checks: 0, problems: [], value: "" };
    const pr = diff(oldVals[`r${i}`], newVals[`r${i}`]);
    g.checks += oldVals[`r${i}`].length;
    g.problems.push(...pr.map((x) => `[${r.scope} ${r.mode}] ${x}`));
    if (r.scope === "(none)" && (r.mode === "as written" || (r.mode === "cn()" && !g.value))) g.value = summary(newVals[`r${i}`][0]);
    else if (pr.length === 0 && r.mode === "as written") g.value += ` · ${r.scope} ${summary(newVals[`r${i}`][0]).split("; ").filter((s) => !g.value.includes(s)).join("; ")}`;
    grouped.set(key, g);
  });
  const lines = [
    "| file | old class string | new class string | resolved value (computed, 16px root; variant scopes after ·) | result |",
    "| --- | --- | --- | --- | --- |",
  ];
  for (const g of grouped.values()) {
    if (g.problems.length) failures++;
    lines.push(`| ${g.file} | \`${g.old}\` | \`${g.new}\` | ${g.value.replace(/\|/g, "\\|")} | ${g.problems.length ? "FAIL: " + [...new Set(g.problems)].join("; ") : `identical (${g.checks} cases)`} |`);
  }
  const mlines = ["| file | before (CSS module / inline style) | after (classes) | resolved value | result |", "| --- | --- | --- | --- | --- |"];
  for (const r of manualRes) {
    if (r.problems.length) failures++;
    mlines.push(`| ${r.m.file} | ${r.m.label} | \`${r.m.newHtml.replace(/\|/g, "\\|").slice(0, 400)}\` | ${r.value.replace(/\|/g, "\\|")} | ${r.problems.length ? "FAIL: " + r.problems.join("; ") : `identical (${WIDTHS.length * PARENTS.length} cases)`} |`);
  }
  const rlines = ["| file | removed `dark:` classes (never match: no `.dark-mode` ancestor exists) |", "| --- | --- |"];
  for (const r of removedRows) rlines.push(`| ${r.file} | \`${r.tokens.join(" ")}\` |`);
  const md = `${lines.join("\n")}\n\n${mlines.join("\n")}\n\n${rlines.join("\n")}\n`;
  writeFileSync(join(outDir, "molecules-equivalence.md"), md);
  console.log(md);
  console.log(`${grouped.size} class-string pairs, ${rows.length} render cases x ${WIDTHS.length * PARENTS.length}; ${manualRes.length} manual checks; ${failures} failing`);
  process.exitCode = failures ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
