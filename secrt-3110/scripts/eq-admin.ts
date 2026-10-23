/**
 * Exact-string value equivalence for DS5f (SECRT-3110).
 *
 * DS1's check-token-equivalence.ts proves each codemod mapping and a sample
 * of size lists. This proves every exact class string this PR writes: for
 * each changed file, every string literal and template-literal part of the
 * base version is paired with the same literal in the head version (the
 * counts must match), and each pair that differs is rendered:
 *   - old string with the base checkout's compiled CSS,
 *   - new string with the head checkout's compiled CSS,
 * as written and after cn(), plus each variant group (`hover:`, `md:` …)
 * with its prefix removed so the state styles are measured too, inside
 * parents at leading-[1.5], leading-[30px] and leading-normal, at 1440px
 * and 390px, at a 16px root. Every computed property (custom properties
 * excluded) of the element and of its second child (for divide-*) must be
 * equal. Exit 1 on any difference.
 *
 *   cd autogpt_platform/frontend
 *   npx tsx /path/eq-admin.ts --base <base frontend dir> --base-sha <sha> \
 *     --dir "src/app/(platform)/admin" [--out <dir>]
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";

const headDir = process.cwd();
const localRequire = createRequire(join(headDir, "package.json"));
const ts = localRequire("typescript");
const postcss = localRequire("postcss");
const tailwindcss = localRequire("tailwindcss");
const loadConfig = localRequire("tailwindcss/loadConfig");
const { chromium } = localRequire("@playwright/test");

function arg(name: string) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const baseDir = resolve(arg("--base")!);
const baseSha = arg("--base-sha")!;
const scope = arg("--dir")!;
const outDir = arg("--out");

function literals(source: string, file: string) {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const out: string[] = [];
  const visit = (node: any) => {
    const k = node.kind;
    if (
      k === ts.SyntaxKind.StringLiteral ||
      k === ts.SyntaxKind.NoSubstitutionTemplateLiteral ||
      k === ts.SyntaxKind.TemplateHead ||
      k === ts.SyntaxKind.TemplateMiddle ||
      k === ts.SyntaxKind.TemplateTail
    ) {
      // `{" "}` is prettier reflowing JSX text, not a class string.
      if (node.text.trim() !== "") out.push(node.text);
    }
    if (k === ts.SyntaxKind.JsxText) {
      // JSX text as React sees it: lines trimmed, blank lines dropped.
      const lines = node.text.split("\n");
      const text = lines
        .map((line: string, i: number) => {
          let t = line;
          if (i > 0) t = t.replace(/^\s+/, "");
          if (i < lines.length - 1) t = t.replace(/\s+$/, "");
          return t;
        })
        .filter((t: string) => t !== "")
        .join(" ");
      if (text.trim() !== "") out.push(text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}

const repoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
const prefix = execFileSync("git", ["rev-parse", "--show-prefix"], { encoding: "utf8" }).trim();
const changed = execFileSync(
  "git",
  ["diff", "--name-only", baseSha, "HEAD", "--", scope],
  { encoding: "utf8" },
)
  .split("\n")
  .filter((f) => /\.(ts|tsx)$/.test(f));

interface Pair {
  file: string;
  oldClass: string;
  newClass: string;
}
const pairs: Pair[] = [];
const seen = new Set<string>();
let literalMismatch = 0;
for (const repoPath of changed) {
  const rel = repoPath.slice(prefix.length);
  const oldSrc = execFileSync("git", ["show", `${baseSha}:${repoPath}`], { encoding: "utf8", cwd: repoRoot });
  const newSrc = execFileSync("git", ["show", `HEAD:${repoPath}`], { encoding: "utf8", cwd: repoRoot });
  const a = literals(oldSrc, rel);
  const b = literals(newSrc, rel);
  if (a.length !== b.length) {
    console.error(`literal count differs in ${rel}: ${a.length} vs ${b.length}`);
    literalMismatch++;
    continue;
  }
  a.forEach((oldClass, i) => {
    const newClass = b[i];
    if (oldClass === newClass) return;
    const key = `${oldClass}\u0000${newClass}`;
    if (seen.has(key)) return;
    seen.add(key);
    pairs.push({ file: rel, oldClass, newClass });
  });
}

// Every variant group of a list, prefix removed: "a hover:b hover:c md:d"
// -> { hover: "b c", md: "d" }.
function variantGroups(list: string) {
  const groups = new Map<string, string[]>();
  for (const word of list.trim().split(/\s+/).filter(Boolean)) {
    let depth = 0;
    let colon = -1;
    for (let i = 0; i < word.length; i++) {
      if (word[i] === "[") depth++;
      else if (word[i] === "]") depth--;
      else if (word[i] === ":" && depth === 0) colon = i;
    }
    if (colon < 0) continue;
    const variant = word.slice(0, colon);
    const rest = word.slice(colon + 1);
    groups.set(variant, [...(groups.get(variant) ?? []), rest]);
  }
  return groups;
}

async function main() {
  const { cn } = await import(join(headDir, "src/lib/utils.ts"));
  // Case = one class list to render; old and new side by side.
  interface Case {
    pair: number;
    label: string;
    oldList: string;
    newList: string;
  }
  const cases: Case[] = [];
  pairs.forEach((p, i) => {
    cases.push({ pair: i, label: "as written", oldList: p.oldClass, newList: p.newClass });
    cases.push({ pair: i, label: "cn()", oldList: cn(p.oldClass), newList: cn(p.newClass) });
    const og = variantGroups(p.oldClass);
    const ng = variantGroups(p.newClass);
    const variants = new Set([...og.keys(), ...ng.keys()]);
    for (const v of variants) {
      cases.push({
        pair: i,
        label: `${v}: unwrapped`,
        oldList: (og.get(v) ?? []).join(" "),
        newList: (ng.get(v) ?? []).join(" "),
      });
    }
  });

  const PARENTS = ["leading-[1.5]", "leading-[30px]", "leading-normal"];
  async function compile(dir: string, lists: string[]) {
    const config = loadConfig(join(dir, "tailwind.config.ts"));
    const globals = readFileSync(join(dir, "src/app/globals.css"), "utf8");
    const raw = [...lists, ...PARENTS].join(" ");
    const result = await postcss([
      tailwindcss({ ...config, content: [{ raw, extension: "html" }] }),
    ]).process(globals, { from: join(dir, "src/app/globals.css") });
    return result.css as string;
  }
  const oldCss = await compile(baseDir, cases.map((c) => c.oldList));
  const newCss = await compile(headDir, cases.map((c) => c.newList));

  const browser = await chromium.launch();
  async function measure(css: string, lists: string[], width: number) {
    const page = await browser.newPage({ viewport: { width, height: 800 } });
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    const cells = lists.flatMap((list, i) =>
      PARENTS.map(
        (parent, p) =>
          `<div class="${parent}" style="font-size:16px"><div data-i="${i}" data-p="${p}" class="${esc(list)}">Ag<span>a</span><span>b</span></div></div>`,
      ),
    );
    await page.setContent(`<html><head><style>${css}</style></head><body>${cells.join("")}</body></html>`);
    // A string, so esbuild's __name helper never reaches the page.
    const values: {
      i: number;
      p: number;
      self: Record<string, string>;
      child: Record<string, string>;
    }[] = await page.evaluate(`(() => {
      function read(el) {
        const s = getComputedStyle(el);
        const o = {};
        for (let k = 0; k < s.length; k++) {
          const prop = s[k];
          if (!prop.startsWith("--")) o[prop] = s.getPropertyValue(prop);
        }
        return o;
      }
      return Array.from(document.querySelectorAll("[data-i]")).map((el) => ({
        i: Number(el.dataset.i),
        p: Number(el.dataset.p),
        self: read(el),
        child: read(el.children[1]),
      }));
    })()`);
    const rootSize = await page.evaluate("getComputedStyle(document.documentElement).fontSize");
    if (rootSize !== "16px") throw new Error(`root font-size ${rootSize}`);
    await page.close();
    return values;
  }
  // Unstyled reference, to show only the properties a list changes.
  const plainPage = await browser.newPage();
  await plainPage.setContent(`<html><head><style>${newCss}</style></head><body><div class="leading-[30px]" style="font-size:16px"><div id="x">Ag<span>a</span><span>b</span></div></div></body></html>`);
  const plain: Record<string, string> = await plainPage.evaluate(`(() => {
    const s = getComputedStyle(document.getElementById("x"));
    const o = {};
    for (let k = 0; k < s.length; k++) if (!s[k].startsWith("--")) o[s[k]] = s.getPropertyValue(s[k]);
    return o;
  })()`);
  await plainPage.close();

  const problems: Map<number, Set<string>> = new Map();
  const shown: Map<number, Record<string, string>> = new Map();
  for (const width of [1440, 390]) {
    const o = await measure(oldCss, cases.map((c) => c.oldList), width);
    const n = await measure(newCss, cases.map((c) => c.newList), width);
    o.forEach((ov, idx) => {
      const nv = n[idx];
      const c = cases[ov.i];
      const set = problems.get(c.pair) ?? new Set<string>();
      for (const part of ["self", "child"] as const) {
        const keys = new Set([...Object.keys(ov[part]), ...Object.keys(nv[part])]);
        for (const k of keys) {
          if (ov[part][k] !== nv[part][k]) {
            set.add(`${c.label} ${part} ${k} @${width} p${ov.p}: ${ov[part][k]} != ${nv[part][k]}`);
          }
        }
      }
      problems.set(c.pair, set);
      if (width === 1440 && ov.p === 1) {
        const prev = shown.get(c.pair) ?? {};
        for (const [k, v] of Object.entries(nv.self)) {
          if (v !== plain[k] && !/^(width|height|inline-size|block-size|perspective-origin|transform-origin|min-|max-)/.test(k)) {
            const key = c.label === "as written" ? k : `${c.label.replace(": unwrapped", ":")}${k}`;
            if (c.label === "as written" || c.label.endsWith("unwrapped")) prev[key] = v;
          }
        }
        shown.set(c.pair, prev);
      }
    });
  }
  await browser.close();

  const lines = [
    `| file | old class string | new class string | computed value, 16px root, parent at leading-[30px], 1440px (every property the string changes; \`hover:\` etc. = that variant's styles) | result |`,
    "| --- | --- | --- | --- | --- |",
  ];
  let failures = 0;
  pairs.forEach((p, i) => {
    const set = problems.get(i)!;
    if (set.size) failures++;
    const vals = Object.entries(shown.get(i) ?? {})
      .map(([k, v]) => `${k}: ${v}`)
      .join("; ");
    const fmt = (s: string) => "`" + s.replace(/\|/g, "\\|") + "`";
    lines.push(
      `| ${p.file.replace(/^src\/app\/\(platform\)\/admin\//, "")} | ${fmt(p.oldClass)} | ${fmt(p.newClass)} | ${vals || "(no visible property)"} | ${set.size ? `FAIL: ${[...set].slice(0, 6).join("; ")}` : "identical"} |`,
    );
  });
  const caseCount = cases.length * 3 * 2;
  console.log(lines.join("\n"));
  console.log(
    `\n${pairs.length} exact class strings (${changed.length} changed files, ${cases.length} lists incl. cn() and unwrapped variants, x 3 parent line-heights x 2 viewports = ${caseCount} renders per side): ${failures} failing; literal-count mismatches: ${literalMismatch}`,
  );
  if (outDir) {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "equivalence-exact.md"), lines.join("\n") + "\n");
  }
  process.exitCode = failures || literalMismatch ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
