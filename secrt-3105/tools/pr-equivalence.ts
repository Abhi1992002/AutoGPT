/**
 * PR-specific value equivalence for DS5a (companion to DS1's
 * scripts/check-token-equivalence.ts, which it does not edit).
 *
 * Pairs: every string literal (and template-literal part) in every changed
 * file, base (origin/dev) vs head, aligned by AST order; the pairs that differ
 * are exactly the class strings this PR writes.
 *
 * Each pair: old string compiled with the base checkout's Tailwind config and
 * globals.css, new string with head's. Rendered in Chromium (16px root) inside
 * parents at leading-[30px], leading-[1.5], leading-normal, at 1280 and 390px,
 * as written and after cn(), on three hosts (div with a/span/p/code/del/
 * blockquote children, input with placeholder, disabled button), in two state
 * passes: plain, and forced (CDP hover/focus/focus-visible/focus-within/active
 * on host and its .group parent, data-selected=true, prefers-reduced-motion:
 * reduce). Compared: EVERY computed property of host, host::before,
 * input::placeholder and every descendant. Any difference fails.
 */
import { execFileSync, execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import ts from "../../autogpt_platform/frontend/node_modules/typescript";
import { chromium } from "../../autogpt_platform/frontend/node_modules/@playwright/test";
import { cn } from "../../autogpt_platform/frontend/src/lib/utils";

const MERGE_BASE = execSync("git merge-base HEAD origin/dev", { cwd: process.argv[2] }).toString().trim();
const head = resolve(process.argv[2]);
const base = resolve(process.argv[3]);
const outDir = resolve(process.argv[4]);
const req = createRequire(join(head, "package.json"));
const postcss = req("postcss");
const tailwindcss = req("tailwindcss");
const loadConfig = req("tailwindcss/loadConfig");

interface Host { tag: string; props: Record<string, string | null> }
const hostsOf = new Map<string, Host[]>();
function hostOf(n: ts.Node, sf: ts.SourceFile): Host | null {
  let p: ts.Node | undefined = n;
  while (p && !ts.isJsxOpeningElement(p) && !ts.isJsxSelfClosingElement(p)) p = p.parent;
  if (!p) return null;
  const el = p as ts.JsxOpeningElement;
  const props: Record<string, string | null> = {};
  for (const a of el.attributes.properties) {
    if (!ts.isJsxAttribute(a)) continue;
    const name = a.name.getText(sf);
    if (!["variant", "size", "tone"].includes(name)) continue;
    props[name] = a.initializer && ts.isStringLiteral(a.initializer) ? a.initializer.text : null;
  }
  return { tag: el.tagName.getText(sf), props };
}
function literals(src: string, file: string) {
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const out: string[] = [];
  const hosts: (Host | null)[] = [];
  hostsOf.set(`${file}:${src.length}`, hosts as Host[]);
  const walk = (n: ts.Node) => {
    if ((ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)) && n.text.trim() !== "") { out.push(n.text); hosts.push(hostOf(n, sf)); }
    else if (ts.isJsxText(n)) {/* copy, not classes */}
    ts.forEachChild(n, walk);
  };
  walk(sf);
  return out;
}

const files = execSync("git diff --name-only $(git merge-base HEAD origin/dev) -- 'src/app/(platform)'", { cwd: head }).toString().trim().split("\n").filter(Boolean)
  .map((f) => f.replace(/^autogpt_platform\/frontend\//, ""));
const pairMap = new Map<string, { oldClass: string; newClass: string; where: string[] }>();
const mergedPairs: { oldClass: string; newClass: string; where: string[] }[] = [];
const { variants: TEXT_VARIANTS, tones: TEXT_TONES } = req(join(head, "src/components/atoms/Text/helpers.ts")) as { variants: Record<string, string>; tones: Record<string, string> };
const COMPONENT_BASE: Record<string, string> = { DropdownMenuLabel: "px-2 py-1.5 text-sm font-semibold" };
function hostBases(h: Host | null): { label: string; base: string }[] {
  if (!h) return [];
  if (h.tag === "Text") {
    const vs = h.props.variant ? [h.props.size ?? h.props.variant] : Object.keys(TEXT_VARIANTS);
    const ts_ = "tone" in h.props ? (h.props.tone ? [h.props.tone] : Object.keys(TEXT_TONES)) : [null];
    return vs.flatMap((v) => ts_.map((t) => ({ label: `<Text variant="${v}"${t ? ` tone="${t}"` : ""}>`, base: [TEXT_VARIANTS[v], t ? TEXT_TONES[t] : ""].filter(Boolean).join(" ") })));
  }
  if (COMPONENT_BASE[h.tag]) return [{ label: `<${h.tag}>`, base: COMPONENT_BASE[h.tag] }];
  return [];
}
let misaligned = 0;
for (const f of files) {
  const oldSrc = execFileSync("git", ["show", `${MERGE_BASE}:autogpt_platform/frontend/${f}`], { cwd: head }).toString();
  const newSrc = readFileSync(join(head, f), "utf8");
  const a = literals(oldSrc, f), b = literals(newSrc, f);
  if (a.length !== b.length) { misaligned++; console.error(`MISALIGNED ${f}: ${a.length} vs ${b.length}`); continue; }
  const hb = hostsOf.get(`${f}:${newSrc.length}`)!;
  a.forEach((o, i) => {
    if (o === b[i]) return;
    for (const { label, base: hostBase } of hostBases(hb[i])) {
      mergedPairs.push({ oldClass: cn(hostBase, o.replace(/\s+/g, " ").trim()), newClass: cn(hostBase, b[i].replace(/\s+/g, " ").trim()), where: [`${label} ${f}`] });
    }
    const n = b[i].replace(/\s+/g, " ").trim(), oo = o.replace(/\s+/g, " ").trim();
    const key = `${oo}\u0000${n}`;
    const p = pairMap.get(key) ?? { oldClass: oo, newClass: n, where: [] };
    p.where.push(f);
    pairMap.set(key, p);
  });
}
const pairs = [...pairMap.values()];
// MERGED=1: each changed string merged with its host component's own classes
// with cn(), as the component renders it.
if (process.env.MERGED) {
  const seen = new Map<string, { oldClass: string; newClass: string; where: string[] }>();
  for (const m of mergedPairs) { const k = `${m.oldClass}\u0000${m.newClass}`; if (!seen.has(k)) seen.set(k, m); else seen.get(k)!.where.push(...m.where); }
  pairs.length = 0;
  pairs.push(...seen.values());
}
// WORDS=1: one pair per distinct changed class word (old word -> new word or
// words), taken from the aligned strings, for a compact table.
if (process.env.WORDS) {
  const words = new Map<string, { oldClass: string; newClass: string; where: string[] }>();
  for (const p of [...pairs]) {
    const a = p.oldClass.split(" "), b = p.newClass.split(" ");
    const removed = a.filter((w) => !b.includes(w));
    const added: string[] = [];
    for (const w of b.filter((w) => !a.includes(w))) {
      if (/(^|:)leading-inherit$/.test(w) && added.length) added[added.length - 1] += ` ${w}`;
      else added.push(w);
    }
    if (removed.length !== added.length) throw new Error(`cannot split ${p.oldClass} -> ${p.newClass}`);
    removed.forEach((o, i) => {
      // A size role written without leading-inherit relies on the explicit
      // leading-* that follows it in the same string: carry it along.
      if (/(^|:)text-\[/.test(o) && !added[i].includes("leading-inherit")) {
        const lead = b.slice(b.indexOf(added[i].split(" ")[0]) + 1).find((w) => /(^|:)leading-/.test(w));
        if (lead) { o = `${o} ${lead}`; added[i] = `${added[i]} ${lead}`; }
      }
      const k = `${o}\u0000${added[i]}`; if (!words.has(k)) words.set(k, { oldClass: o, newClass: added[i], where: p.where }); });
  }
  // Companions make a colour-only class visible, the same on both sides.
  const companion = (w: string) => {
    const v = w.slice(0, w.lastIndexOf(":") + 1);
    const u = w.slice(v.length);
    if (/^ring-(?!\d|inset|offset)/.test(u)) return `${v}ring-2`;
    if (/^divide-/.test(u)) return "divide-y";
    if (/^from-/.test(u)) return "bg-gradient-to-r";
    if (/^(via|to)-/.test(u)) return "bg-gradient-to-r from-transparent";
    if (/^scrollbar-thumb-/.test(u)) return "scrollbar-thin scrollbar-track-transparent";
    if (v.startsWith("before:")) return "before:content-['']";
    return "";
  };
  for (const w of words.values()) {
    const c = companion(w.newClass.split(" ")[0]);
    if (c) { w.oldClass = `${c} ${w.oldClass}`; w.newClass = `${c} ${w.newClass}`; }
  }
  pairs.length = 0;
  pairs.push(...[...words.values()].sort((x, y) => x.oldClass.localeCompare(y.oldClass)));
}
// Negative control: a wrong rewrite must fail the check.
if (process.env.NEGATIVE) for (const p of pairs) p.newClass = p.newClass.replace(/text-foreground-tertiary/g, "text-foreground-secondary").replace(/ ?(md:)?leading-inherit/g, "");
console.error(`${files.length} files, ${pairs.length} distinct changed strings, ${misaligned} misaligned`);

async function compile(dir: string, lists: string[]) {
  const config = loadConfig(join(dir, "tailwind.config.ts"));
  const globals = readFileSync(join(dir, "src/app/globals.css"), "utf8");
  const raw = [...lists, ...lists.map((l) => cn(l)), "group", "leading-[30px] leading-[1.5] leading-normal"].join(" ");
  const r = await postcss([tailwindcss({ ...config, content: [{ raw, extension: "html" }] })]).process(globals, { from: join(dir, "src/app/globals.css") });
  return r.css as string;
}
const PARENTS = ["leading-[30px]", "leading-[1.5]", "leading-normal"];
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
function cells(lists: string[]) {
  const html: string[] = [];
  lists.forEach((list, i) => [list, cn(list)].forEach((cls, m) => PARENTS.forEach((parent, p) => {
    const id = `${i}-${m}-${p}`;
    html.push(`<div class="${parent} group" style="font-size:16px;position:relative" data-p="${id}">` +
      `<div data-h="${id}-div" class="${esc(cls)}">x<a href="#">a</a><span>s</span><p>p</p><code>c</code><del>d</del><blockquote>q</blockquote></div>` +
      `<input data-h="${id}-input" class="${esc(cls)}" placeholder="ph">` +
      `<button data-h="${id}-button" disabled class="${esc(cls)}">b</button></div>`);
  })));
  return html.join("");
}
const FORCE = /:(hover|focus-visible|focus-within|focus|active)(?![\w-])/g;
// One page per (viewport, state pass): base cells in one shadow root styled by
// the base CSS, head cells in another styled by the head CSS. `:root` becomes
// `:host` so each tree gets its own variables. The forced pass drops the
// hover/focus/active pseudo-classes from every selector (same rewrite on both
// sides), sets data-selected=true and emulates prefers-reduced-motion.
async function measure(oldCss: string, newCss: string, oldLists: string[], newLists: string[], width: number, forced: boolean) {
  const prep = (css: string) => { let c = css.replace(/:root/g, ":host"); if (forced) c = c.replace(FORCE, ""); return c; };
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width, height: 800 }, reducedMotion: forced ? "reduce" : "no-preference" });
  const page = await ctx.newPage();
  await page.setContent(`<html><head></head><body style="margin:0"><div id="old"></div><div id="new"></div></body></html>`);
  await page.evaluate(`(() => {
    const mk = (id, css, html) => { const r = document.getElementById(id).attachShadow({ mode: "open" }); r.innerHTML = "<style>" + css + "</style>" + html; };
    mk("old", ${JSON.stringify(prep(oldCss))}, ${JSON.stringify(cells(oldLists))});
    mk("new", ${JSON.stringify(prep(newCss))}, ${JSON.stringify(cells(newLists))});
    if (${forced}) for (const id of ["old", "new"]) document.getElementById(id).shadowRoot.querySelectorAll("[data-h]").forEach((e) => e.setAttribute("data-selected", "true"));
  })()`);
  const res = (await page.evaluate(`(() => {
    const SHOW = ["color","background-color","border-top-color","box-shadow","fill","stroke","background-image","scrollbar-color","font-size","line-height","letter-spacing","font-weight"];
    const o = document.getElementById("old").shadowRoot, n = document.getElementById("new").shadowRoot;
    const nh = new Map(); n.querySelectorAll("[data-h]").forEach((e) => nh.set(e.dataset.h, e));
    const parts = (el) => { const p = [["self", getComputedStyle(el)], ["before", getComputedStyle(el, "::before")]]; if (el.tagName === "INPUT") p.push(["placeholder", getComputedStyle(el, "::placeholder")]); Array.from(el.children).forEach((c, k) => p.push(["child" + k + "-" + c.tagName, getComputedStyle(c)])); return p; };
    const diffs = []; let comparisons = 0; const shown = {};
    o.querySelectorAll("[data-h]").forEach((a) => {
      const id = a.dataset.h, b = nh.get(id);
      const pa = parts(a), pb = parts(b);
      pa.forEach(([name, sa], k) => { const sb = pb[k][1]; for (let i = 0; i < sa.length; i++) { const prop = sa[i]; if (prop.startsWith("--")) continue; comparisons++; const va = sa.getPropertyValue(prop), vb = sb.getPropertyValue(prop); if (va !== vb) diffs.push([id, name, prop, va, vb]); } });
      if (/-0-0-(div|input|button)$/.test(id)) pb.forEach(([name, st]) => { shown[id + ":" + name] = Object.fromEntries(SHOW.map((k) => [k, st.getPropertyValue(k)])); });
    });
    return { diffs, comparisons, shown };
  })()`)) as { diffs: string[][]; comparisons: number; shown: Record<string, Record<string, string>> };
  await browser.close();
  return res;
}

(async () => {
  const oldCss = await compile(base, pairs.map((p) => p.oldClass));
  const newCss = await compile(head, pairs.map((p) => p.newClass));
  const failures = new Map<number, Set<string>>();
  const shown: Record<string, string>[] = pairs.map(() => ({}));
  let comparisons = 0;
  for (const width of [1280, 390]) for (const forced of [false, true]) {
    const r = await measure(oldCss, newCss, pairs.map((p) => p.oldClass), pairs.map((p) => p.newClass), width, forced);
    comparisons += r.comparisons;
    for (const [id, part, prop, va, vb] of r.diffs) {
      const i = Number(id.split("-")[0]);
      const s = failures.get(i) ?? new Set(); s.add(`${width}${forced ? " forced" : ""} ${id.split("-").slice(1).join("-")} ${part} ${prop}: ${va} != ${vb}`); failures.set(i, s);
    }
    if (width === 1280) for (const [key, vals] of Object.entries(r.shown)) {
      const i = Number(key.split("-")[0]);
      const part = key.replace(/^\d+-0-0-/, "");
      for (const [k, v] of Object.entries(vals)) shown[i][`${forced ? "forced " : ""}${part}|${k}`] = v;
    }
  }
  // Table: the properties the changed classes set, read from the element and
  // state they style (descendant, ::before, ::placeholder, forced state).
  const lines = ["| # | old class string (dev) | new class string (head) | computed value at 1280px, parent leading-[30px], as written (where it applies) | result |", "| --- | --- | --- | --- | --- |"];
  pairs.forEach((p, i) => {
    const oldWords = p.oldClass.split(" "), newWords = p.newClass.split(" ");
    const changed = newWords.filter((w) => !oldWords.includes(w));
    const cells: string[] = [];
    for (const w of changed) {
      const v = w.slice(0, w.lastIndexOf(":") + 1), u = w.slice(v.length).replace(/^!/, "");
      const forced = /(hover|focus|focus-visible|focus-within|group-hover|data-\[[^\]]*\]|disabled|active|motion-reduce):/.test(v);
      let part = "div:self";
      const sub = v.match(/\[&_(\w+)\]:/);
      if (sub) part = `div:child${["a","span","p","code","del","blockquote"].indexOf(sub[1]) === -1 ? 0 : ["a","span","p","code","del","blockquote"].indexOf(sub[1])}-${sub[1].toUpperCase()}`;
      if (sub && sub[1] === "a") part = "div:child0-A";
      if (v.includes("placeholder:")) part = "input:placeholder";
      if (v.includes("before:")) part = "div:before";
      if (/^divide-/.test(u)) part = "div:child1-SPAN";
      if (v.includes("disabled:")) part = "button:self";
      const prop = /^text-(tiny|caption|body|lead|heading|title|display)/.test(u) ? ["font-size", "line-height"]
        : /^leading-/.test(u) ? ["line-height"]
        : /^tracking-/.test(u) ? ["letter-spacing"]
        : /^text-/.test(u) ? ["color"]
        : /^bg-/.test(u) ? ["background-color"]
        : /^(border|divide)-/.test(u) ? ["border-top-color"]
        : /^ring-/.test(u) ? ["box-shadow"]
        : /^fill-/.test(u) ? ["fill"]
        : /^stroke-/.test(u) ? ["stroke"]
        : /^(from|via|to)-/.test(u) ? ["background-image"]
        : /^scrollbar-thumb-/.test(u) ? ["scrollbar-color"] : [];
      for (const k of prop) {
        const key = `${forced ? "forced " : ""}${part}|${k}`;
        const val = shown[i][key];
        if (val !== undefined && !cells.some((c) => c.startsWith(`${k}:`))) cells.push(`${w.includes(":") ? `\`${w}\` ` : ""}${k}: ${val}${forced ? " (state forced)" : ""}`);
      }
    }
    const f = failures.get(i);
    lines.push(`| ${i + 1}${process.env.MERGED ? ` ${[...new Set(p.where.map((w) => w.split(" src/")[0]))].join(", ").replace(/\|/g, "\\|")}` : ""} | \`${p.oldClass.replace(/\|/g, "\\|")}\` | \`${p.newClass.replace(/\|/g, "\\|")}\` | ${cells.join("; ") || "(test assertion string)"} | ${f ? `FAIL: ${[...f].slice(0, 3).join("; ")}` : "identical"} |`);
  });
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, process.env.WORDS ? "pr-equivalence-words.md" : process.env.MERGED ? "pr-equivalence-merged.md" : "pr-equivalence.md"), lines.join("\n") + "\n");
  console.log(`${pairs.length} changed class strings x 2 viewports x 3 parent line-heights x 2 modes (as written, cn()) x 3 hosts x 2 state passes; ${comparisons} computed-property comparisons; ${failures.size} failing strings`);
  for (const [i, f] of failures) console.log(`FAIL #${i + 1} ${pairs[i].oldClass} -> ${pairs[i].newClass}\n  ${[...f].slice(0, 6).join("\n  ")}`);
  process.exitCode = failures.size ? 1 : 0;
})();
