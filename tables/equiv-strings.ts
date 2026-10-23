/**
 * Evidence-only harness (never committed). Proves every exact class string
 * this PR rewrites renders the same as the string it replaces.
 *
 *   cd <head frontend> && npx tsx <this> --base <base frontend> --base-sha <sha> --out <dir>
 *
 * Pairs: every string literal in every changed file under src, base vs head,
 * aligned in order (comments ignored). Old strings compile against the base
 * checkout's tailwind.config.ts + globals.css, new against the head's.
 * Each pair is rendered in Chromium at a 16px root inside parents at
 * leading-[1.5], leading-[30px] and leading-normal, at 1440 and 390 wide,
 * as written and after cn(), in four states (plain; :hover; :focus +
 * :focus-visible + :focus-within; data-state=open + data-active=true +
 * data-collapsible=icon), forced on the element and every ancestor. Every
 * computed property of the element, its ::before/::after, its two children
 * and (as an <input>) its ::placeholder must match.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { chromium, type CDPSession, type Page } from "@playwright/test";
import { cn } from "@/lib/utils";
import ts from "typescript";

const argv = process.argv.slice(2);
const flag = (n: string) => argv[argv.indexOf(n) + 1];
const headDir = process.cwd();
const baseDir = resolve(flag("--base"));
const baseSha = flag("--base-sha");
const outDir = resolve(flag("--out"));
const req = createRequire(join(headDir, "package.json"));
const postcss = req("postcss");
const tailwindcss = req("tailwindcss");
const loadConfig = req("tailwindcss/loadConfig");

// String literals in source order (TypeScript AST; JSX text and comments excluded).
function strings(src: string) {
  const sf = ts.createSourceFile("x.tsx", src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const out: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) out.push(node.text);
    else if (ts.isTemplateExpression(node)) {
      out.push([node.head.text, ...node.templateSpans.map((sp) => sp.literal.text)].join(" "));
      node.templateSpans.forEach((sp) => visit(sp.expression));
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  // Prettier adds {" "} when it rewraps JSX text; it renders the same space.
  return out.filter((x) => x.trim() !== "");
}

// JSX text children like `it's` contain a lone quote; restrict to code by
// dropping JSX text is too much work, so a file whose string counts differ
// is reported and its pairs come from a diff of the two sequences instead.
function pairsFor(file: string) {
  const rel = file.replace(/^autogpt_platform\/frontend\//, "");
  const oldSrc = execFileSync("git", ["show", `${baseSha}:${file}`], {
    encoding: "utf8",
    cwd: headDir,
    maxBuffer: 1 << 26,
  });
  const newSrc = readFileSync(join(headDir, rel), "utf8");
  const a = strings(oldSrc);
  const b = strings(newSrc);
  if (a.length !== b.length) {
    throw new Error(`${rel}: ${a.length} strings at base, ${b.length} at head`);
  }
  return a
    .map((oldClass, k) => ({ file: rel, oldClass, newClass: b[k] }))
    .filter((p) => p.oldClass !== p.newClass);
}

const changed = execFileSync(
  "git",
  ["diff", "--name-only", baseSha, "--", "src"],
  { encoding: "utf8", cwd: headDir },
)
  .split("\n")
  .filter((f) => /\.(tsx?|jsx?)$/.test(f))
  // Tests are not rendered UI; their class assertions follow the component.
  .filter((f) => !/__tests__\/|\.test\.tsx?$/.test(f));
const pairs = changed.flatMap(pairsFor);
const nonClass = pairs.filter(
  (p) => !/^[\w\-:![\]/.&>=#()%,'"* ]*$/.test(p.oldClass.trim()),
);
if (nonClass.length) {
  console.error("non-class string changes:", nonClass);
  process.exit(1);
}

// Component context: a className handed to one of these components is merged
// with the component's own classes by cn(), so the same string is also
// measured inside that merge (a role size's bundled line-height or a
// leading-inherit could otherwise lose to the component's own text-*).
const sidebarSrc = readFileSync(join(headDir, "src/components/ui/sidebar.tsx"), "utf8");
const menuButtonBase =
  sidebarSrc.match(/sidebarMenuButtonVariants = cva\(\s*"([^"]+)"/)![1] +
  " " + sidebarSrc.match(/default: "(hover:[^"]+)"/)![1] +
  " " + sidebarSrc.match(/default: "(h-8 text-sm)"/)![1];
const groupLabelBase = [...sidebarSrc.matchAll(/data-sidebar="group-label"[\s\S]*?cn\(\s*"([^"]+)",\s*"([^"]+)"/g)][0];
const { variants: textVariants, tones: textTones } = req(join(headDir, "src/components/atoms/Text/helpers.ts"));
const BASES: Record<string, (attrs: Record<string, string>) => string | null> = {
  SidebarMenuButton: () => menuButtonBase,
  SidebarGroupLabel: () => `${groupLabelBase[1]} ${groupLabelBase[2]}`,
  Text: (a) => [textVariants[a.size || a.variant] ?? textVariants.body, a.tone ? textTones[a.tone] : ""].join(" "),
  LoadingSpinner: (a) => `animate-spin text-inherit ${{ small: "h-4 w-4", medium: "h-6 w-6", large: "h-10 w-10" }[a.size || "medium"]}`,
};
function classAttrs(src: string) {
  const sf = ts.createSourceFile("x.tsx", src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const out: { tag: string; cls: string; attrs: Record<string, string> }[] = [];
  const visit = (node: ts.Node) => {
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && ts.isIdentifier(node.tagName)) {
      const attrs: Record<string, string> = {};
      let cls: string | null = null;
      for (const prop of node.attributes.properties) {
        if (!ts.isJsxAttribute(prop) || !prop.initializer || !ts.isStringLiteral(prop.initializer)) continue;
        const name = prop.name.getText(sf);
        if (name === "className") cls = prop.initializer.text;
        else attrs[name] = prop.initializer.text;
      }
      if (cls !== null) out.push({ tag: node.tagName.text, cls, attrs });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}
const contextPairs = changed.flatMap((file) => {
  const rel = file.replace(/^autogpt_platform\/frontend\//, "");
  const a = classAttrs(execFileSync("git", ["show", `${baseSha}:${file}`], { encoding: "utf8", cwd: headDir }));
  const b = classAttrs(readFileSync(join(headDir, rel), "utf8"));
  if (a.length !== b.length) throw new Error(`${rel}: className attrs differ in count`);
  return a.flatMap((o, k) => {
    const base = BASES[o.tag]?.(o.attrs);
    if (!base || o.cls === b[k].cls) return [];
    return [{ file: rel, oldClass: `${base} ${o.cls}`, newClass: `${base} ${b[k].cls}`, tag: o.tag }];
  });
});
console.error("component-context pairs", contextPairs.length);

const norm = (s: string) => s.replace(/\s+/g, " ").trim();
const unique = new Map<string, { oldClass: string; newClass: string; files: Set<string>; tag?: string }>();
for (const p of pairs) {
  const key = `${norm(p.oldClass)}\u0000${norm(p.newClass)}`;
  if (!unique.has(key))
    unique.set(key, {
      oldClass: norm(p.oldClass),
      newClass: norm(p.newClass),
      files: new Set(),
    });
  unique.get(key)!.files.add(p.file);
}
for (const p of contextPairs) {
  const key = `ctx:${p.tag}\u0000${norm(p.oldClass)}\u0000${norm(p.newClass)}`;
  if (!unique.has(key))
    unique.set(key, { oldClass: norm(p.oldClass), newClass: norm(p.newClass), files: new Set([p.file]), tag: p.tag } as never);
}
const list = [...unique.values()].slice(0, Number(process.env.LIMIT ?? 1e9));
// Negative control: break known pairs and expect FAIL rows.
if (process.env.NEGATIVE) {
  list[0].newClass = list[0].newClass.replace("text-success", "text-success-foreground");
  list.push({ oldClass: "text-[13px]", newClass: "text-body-sm", files: new Set() });
  list.push({ oldClass: "hover:bg-zinc-100", newClass: "hover:bg-surface-active", files: new Set() });
}

const PARENTS = ["leading-[1.5]", "leading-[30px]", "leading-normal"];
const VIEWPORTS = [1440, 390];
const STATES = ["plain", "hover", "focus", "data"] as const;
const KEY_PROPS = [
  "color",
  "background-color",
  "border-top-color",
  "outline-color",
  "box-shadow",
  "font-size",
  "line-height",
  "letter-spacing",
  "font-weight",
];

async function compile(dir: string, classes: string[]) {
  const config = loadConfig(join(dir, "tailwind.config.ts"));
  const globals = readFileSync(join(dir, "src/app/globals.css"), "utf8");
  const raw = [...classes, ...PARENTS, "group", "peer"].join(" ");
  const result = await postcss([
    tailwindcss({ ...config, content: [{ raw, extension: "html" }] }),
  ]).process(globals, { from: join(dir, "src/app/globals.css") });
  return result.css as string;
}

function html(lists: string[]) {
  const esc = (s: string) => s.replace(/"/g, "&quot;");
  const cells = lists.flatMap((cls, i) =>
    PARENTS.map(
      (parent, p) =>
        `<div class="${parent} group group/expert-header group/menu-item peer" style="font-size:16px" data-p="${i}-${p}"><div class="group/x"><div data-i="${i}" data-p="${p}" class="${esc(cls)}" tabindex="0"><div class="c">Ag a</div><div class="c">b</div></div><input data-in="${i}" data-p="${p}" class="${esc(cls)}" placeholder="Ag"></div></div>`,
    ),
  );
  return `<html><head><style>CSS</style><style>*,*::before,*::after,*::placeholder{animation-play-state:paused!important;animation-delay:0s!important;transition:none!important}</style></head><body>${cells.join("")}</body></html>`;
}

// Forcing a pseudo-class on every element = dropping it from every selector.
// Old and new stylesheets get the same rewrite.
function cssFor(css: string, state: (typeof STATES)[number]) {
  if (state === "hover") return css.replace(/:hover/g, "");
  if (state === "focus")
    return css.replace(/:focus-visible|:focus-within|:focus/g, "");
  return css;
}

async function measure(css: string, lists: string[], full = false) {
  const browser = await chromium.launch();
  const results: string[][] = lists.map(() => []);
  const display: Record<string, string>[] = lists.map(() => ({}));
  for (const width of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    for (const state of STATES) {
      await page.setContent(html(lists).replace("CSS", cssFor(css, state)));
      const root = await page.evaluate(
        () => getComputedStyle(document.documentElement).fontSize,
      );
      if (root !== "16px") throw new Error(`root ${root}`);
      // tsx (esbuild keepNames) wraps named functions in __name().
      await page.evaluate("window.__name = (f) => f");
      const values = await page.evaluate(
        ({ state, full, keyProps }) => {
          if (state === "data")
            document.querySelectorAll("body *").forEach((n) => {
              n.setAttribute("data-state", "open");
              n.setAttribute("data-active", "true");
              n.setAttribute("data-collapsible", "icon");
            });
          const dump = (el: Element, pseudo?: string) => {
            const st = getComputedStyle(el, pseudo);
            const o: Record<string, string> = {};
            for (let k = 0; k < st.length; k++) {
              const prop = st[k];
              if (prop.startsWith("--")) continue;
              o[prop] = st.getPropertyValue(prop);
            }
            return o;
          };
          const hash = (str: string) => {
            let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
            for (let k = 0; k < str.length; k++) {
              const ch = str.charCodeAt(k);
              h1 = Math.imul(h1 ^ ch, 2654435761);
              h2 = Math.imul(h2 ^ ch, 1597334677);
            }
            return `${h1 >>> 0}-${h2 >>> 0}-${str.length}`;
          };
          return Array.from(document.querySelectorAll("[data-i]")).map((el) => {
            const i = Number((el as HTMLElement).dataset.i);
            const p = (el as HTMLElement).dataset.p;
            const input = document.querySelector(`[data-in="${i}"][data-p="${p}"]`)!;
            const v = {
              el: dump(el),
              before: dump(el, "::before"),
              after: dump(el, "::after"),
              c1: dump(el.children[0]),
              c2: dump(el.children[1]),
              input: dump(input),
              placeholder: dump(input, "::placeholder"),
            };
            const json = JSON.stringify(v);
            const props = Object.values(v).reduce((n, o) => n + Object.keys(o).length, 0);
            return {
              i,
              p,
              key: full ? json : hash(json),
              props,
              shown: Object.fromEntries(keyProps.map((k) => [k, v.el[k]])),
            };
          });
        },
        { state, full, keyProps: KEY_PROPS },
      );
      for (const { i, p, key, props, shown } of values) {
        results[i].push(key);
        if (state === "plain" && width === 1440 && p === "0")
          display[i] = { ...shown, props: String(props) };
      }
    }
    await page.close();
  }
  await browser.close();
  return { results, display };
}



async function main() {
  console.error("lists", list.length);
  // Component-context rows only exist merged: the component always cn()s.
  const oldLists = list.flatMap((p) => [p.tag ? cn(p.oldClass) : p.oldClass, cn(p.oldClass)]);
  const newLists = list.flatMap((p) => [p.tag ? cn(p.newClass) : p.newClass, cn(p.newClass)]);
  const words = (ls: string[]) => ls.join(" ").split(/\s+/).filter(Boolean);
  const oldCss = await compile(baseDir, words(oldLists));
  const newCss = await compile(headDir, words(newLists));
  const oldV = await measure(oldCss, oldLists);
  const newV = await measure(newCss, newLists);
  const cases = VIEWPORTS.length * STATES.length * PARENTS.length * 2;
  let failures = 0;
  const rows = [
    "| # | old class string | new class string | value (computed, 16px root; plain state, desktop, parent leading-[1.5]) | result |",
    "| --- | --- | --- | --- | --- |",
  ];
  const failing: number[] = [];
  list.forEach((_, n) => {
    for (const mode of [0, 1]) {
      const idx = n * 2 + mode;
      if (oldV.results[idx].join() !== newV.results[idx].join()) {
        failing.push(n);
        return;
      }
    }
  });
  // Detail for failing pairs only: rerun them with full dumps.
  const detail = new Map<number, string[]>();
  if (failing.length) {
    const ol = failing.flatMap((n) => [oldLists[n * 2], oldLists[n * 2 + 1]]);
    const nl = failing.flatMap((n) => [newLists[n * 2], newLists[n * 2 + 1]]);
    const o = await measure(oldCss, ol, true);
    const w = await measure(newCss, nl, true);
    failing.forEach((n, f) => {
      const problems = new Set<string>();
      for (const mode of [0, 1])
        o.results[f * 2 + mode].forEach((json, c) => {
          const a = JSON.parse(json);
          const b = JSON.parse(w.results[f * 2 + mode][c]);
          for (const part of Object.keys(a))
            for (const k of Object.keys(a[part]))
              if (a[part][k] !== b[part]?.[k])
                problems.add(`${part} ${k}: ${a[part][k]} != ${b[part]?.[k]}`);
        });
      detail.set(n, [...problems]);
    });
  }
  // A string handed only to a context component never renders on its own:
  // its standalone row is informational when every one of its occurrences
  // has a context row and all of those are identical.
  const occurrences = (o: string, n: string) =>
    pairs.filter((p) => norm(p.oldClass) === o && norm(p.newClass) === n).length;
  const onlyInContext = new Map<number, number[]>();
  list.forEach((pair, n) => {
    if (pair.tag) return;
    const ctxRows = list
      .map((c, k) => ({ c, k }))
      .filter(({ c }) => c.tag && c.oldClass.endsWith(` ${pair.oldClass}`) && c.newClass.endsWith(` ${pair.newClass}`));
    const ctxCount = contextPairs.filter((c) => norm(c.oldClass).endsWith(` ${pair.oldClass}`) && norm(c.newClass).endsWith(` ${pair.newClass}`)).length;
    if (ctxRows.length && ctxCount === occurrences(pair.oldClass, pair.newClass) && ctxRows.every(({ k }) => !failing.includes(k)))
      onlyInContext.set(n, ctxRows.map(({ k }) => k + 1));
  });
  failures = failing.filter((n) => !onlyInContext.has(n)).length;
  list.forEach((pair, n) => {
    const shownV = newV.display[n * 2];
    const shown = KEY_PROPS.map((k) => `${k}: ${shownV[k]}`).join("; ");
    const d = onlyInContext.has(n) && detail.get(n)
      ? [`standalone only (never rendered bare; every use is inside a component, merged row ${onlyInContext.get(n)!.join(", ")} identical): ${detail.get(n)!.slice(0, 2).join("; ")}`]
      : detail.get(n);
    rows.push(
      `| ${n + 1} | ${pair.tag ? `in \`<${pair.tag}>\`: ` : ""}\`${pair.oldClass}\` | \`${pair.newClass}\` | ${shown} | ${d ? (onlyInContext.has(n) ? `n/a: ${d[0]}` : `FAIL: ${d.slice(0, 6).join("; ")}`) : `identical (${cases} cases x ${shownV.props} properties)`} |`,
    );
  });
  mkdirSync(outDir, { recursive: true });
  const summary = `${list.length} class strings (${list.length - contextPairs.length} distinct strings from ${pairs.length} occurrences in ${changed.length} files, plus ${contextPairs.length} measured merged with their component's own classes) x ${cases} cases (2 viewports x 4 states x 3 parent line-heights x as written|cn()), every computed property of the element, ::before, ::after, both children, an <input> and its ::placeholder: ${failures} failing`;
  writeFileSync(join(outDir, "equivalence-strings.md"), `${rows.join("\n")}\n\n${summary}\n`);
  console.log(summary);
  process.exitCode = failures ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
