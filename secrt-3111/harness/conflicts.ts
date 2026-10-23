// Finds className expressions (outside cn()) that hold two classes for the
// same CSS property in the same variant scope, and reports where the class
// that wins in CSS order differs between base and head.
//   npx tsx conflicts.ts <baseFrontend> <headFrontend> <relDir>
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { cn } from "/home/vercel-sandbox/autogpt/autogpt_platform/frontend/src/lib/utils";
import ts from "/home/vercel-sandbox/autogpt/autogpt_platform/frontend/node_modules/typescript";

const [baseDir, headDir, rel] = process.argv.slice(2).map((p, i) =>
  i < 2 ? resolve(p) : p,
);

type Tok = { t: string; path: string };
type Attr = { key: string; merged: boolean; tokens: string[]; paths: string[] };
let condId = 0;

function collect(file: string): Attr[] {
  const src = readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true);
  const consts = new Map<string, ts.Expression>();
  const addConsts = (unit: ts.SourceFile) =>
    unit.forEachChild(function visit(n: ts.Node) {
      if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer && !consts.has(n.name.text))
        consts.set(n.name.text, n.initializer);
      n.forEachChild(visit);
    });
  addConsts(sf);
  sf.forEachChild((n) => {
    if (!ts.isImportDeclaration(n) || !ts.isStringLiteral(n.moduleSpecifier)) return;
    const spec = n.moduleSpecifier.text;
    if (!spec.startsWith(".")) return;
    for (const ext of [".ts", ".tsx", "/index.ts"]) {
      const target = join(file, "..", spec + ext);
      if (existsSync(target)) {
        addConsts(ts.createSourceFile(target, readFileSync(target, "utf8"), ts.ScriptTarget.Latest, true));
        break;
      }
    }
  });
  const out: Attr[] = [];
  let ordinal = 0;
  function strings(e: ts.Node, seen: Set<string>, acc: Tok[], path = "") {
    const push = (text: string) =>
      text.split(/\s+/).filter(Boolean).forEach((t) => acc.push({ t, path }));
    if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) {
      push(e.text);
      return;
    }
    if (ts.isTemplateExpression(e)) {
      push(e.head.text);
      for (const span of e.templateSpans) {
        strings(span.expression, seen, acc, path);
        push(span.literal.text);
      }
      return;
    }
    if (ts.isConditionalExpression(e)) {
      const id = condId++;
      strings(e.condition, seen, acc, path);
      strings(e.whenTrue, seen, acc, `${path}/${id}a`);
      strings(e.whenFalse, seen, acc, `${path}/${id}b`);
      return;
    }
    if (ts.isObjectLiteralExpression(e)) {
      const id = condId++;
      e.properties.forEach((prop, k) => strings(prop, seen, acc, `${path}/${id}p${k}`));
      return;
    }
    if (ts.isIdentifier(e) && consts.has(e.text) && !seen.has(e.text)) {
      seen.add(e.text);
      strings(consts.get(e.text)!, seen, acc, path);
      return;
    }
    if (ts.isArrowFunction(e) || ts.isFunctionExpression(e)) return;
    e.forEachChild((c) => strings(c, seen, acc, path));
  }
  function isCn(e: ts.Expression) {
    return (
      ts.isCallExpression(e) &&
      ts.isIdentifier(e.expression) &&
      ["cn", "twMerge"].includes(e.expression.text)
    );
  }
  sf.forEachChild(function visit(n: ts.Node) {
    if (
      ts.isJsxAttribute(n) &&
      /classname$/i.test(n.name.getText()) &&
      n.initializer
    ) {
      let e: ts.Expression | undefined = ts.isStringLiteral(n.initializer)
        ? n.initializer
        : ts.isJsxExpression(n.initializer)
          ? n.initializer.expression
          : undefined;
      if (e) {
        const acc: Tok[] = [];
        strings(e, new Set(), acc);
        let root = e;
        while (ts.isParenthesizedExpression(root)) root = root.expression;
        const line = sf.getLineAndCharacterOfPosition(n.getStart()).line + 1;
        out.push({
          key: `#${ordinal++} line ${line}`,
          merged: isCn(root),
          tokens: acc.map((x) => x.t),
          paths: acc.map((x) => x.path),
        });
      }
    }
    n.forEachChild(visit);
  });
  return out;
}

const localRequire = createRequire(join(headDir, "package.json"));
const postcss = localRequire("postcss");
const tailwindcss = localRequire("tailwindcss");
const loadConfig = localRequire("tailwindcss/loadConfig");

function escapeClass(cls: string) {
  return cls.replace(/[^a-zA-Z0-9_-]/g, (ch) => `\\${ch}`);
}

// For every class: index of its rule in the compiled CSS, the variant part,
// and the longhand properties it sets.
async function ruleInfo(dir: string, classes: string[]) {
  const config = loadConfig(join(dir, "tailwind.config.ts"));
  const css = (
    await postcss([
      tailwindcss({
        ...config,
        content: [{ raw: classes.join(" "), extension: "html" }],
      }),
    ]).process("@tailwind utilities;", { from: undefined })
  ).css as string;
  const root = postcss.parse(css);
  const info = new Map<string, { index: number; props: Set<string> }>();
  let index = 0;
  root.walkRules((rule: any) => {
    index++;
    for (const cls of classes) {
      const sel = `.${escapeClass(cls)}`;
      if (
        !rule.selectors.some((s: string) => {
          const at = s.indexOf(sel);
          if (at < 0) return false;
          const next = s[at + sel.length];
          return next === undefined || /[\s:>.[+~]/.test(next);
        })
      )
        continue;
      const entry = info.get(cls) ?? { index, props: new Set<string>() };
      entry.index = Math.max(entry.index, index);
      rule.walkDecls((d: any) => {
        if (d.prop.startsWith("--")) {
          if (d.prop.startsWith("--tw-ring-color")) entry.props.add("ring-color");
          if (d.prop === "--tw-shadow-color") entry.props.add("shadow-color");
          if (d.prop === "--tw-gradient-from") entry.props.add("gradient-from");
          if (d.prop === "--tw-gradient-to") entry.props.add("gradient-to");
          if (d.prop === "--tw-gradient-via") entry.props.add("gradient-via");
          return;
        }
        if (d.prop === "border-color")
          ["top", "right", "bottom", "left"].forEach((s) =>
            entry.props.add(`border-${s}-color`),
          );
        else if (d.prop === "border-width")
          ["top", "right", "bottom", "left"].forEach((s) =>
            entry.props.add(`border-${s}-width`),
          );
        else entry.props.add(d.prop);
      });
      info.set(cls, entry);
    }
  });
  return info;
}

function variantOf(token: string) {
  let depth = 0;
  let last = -1;
  for (let i = 0; i < token.length; i++) {
    if (token[i] === "[") depth++;
    else if (token[i] === "]") depth--;
    else if (token[i] === ":" && depth === 0) last = i;
  }
  const rest = token.slice(last + 1);
  return token.slice(0, last + 1) + (rest.startsWith("!") ? "!" : "");
}

function exclusive(p: string, q: string) {
  const a = p.split("/").filter(Boolean), b = q.split("/").filter(Boolean);
  for (let k = 0; k < Math.min(a.length, b.length); k++) {
    if (a[k] === b[k]) continue;
    return a[k].replace(/[ab]$|p\d+$/, "") === b[k].replace(/[ab]$|p\d+$/, "");
  }
  return false;
}


import { buildReplacementMap, buildSizeMap, rewriteClassList } from "/home/vercel-sandbox/autogpt/autogpt_platform/frontend/scripts/codemod-tokens";
const MAP = buildReplacementMap();
const SIZE = buildSizeMap();
// Hand swaps this PR makes on top of the codemod (same value, new name).
const MANUAL: Record<string, string[]> = {
  "border-[#DADADC]": ["border-border-base"],
  "bg-[#F9F9FA]": ["bg-surface-muted"],
  "placeholder:text-zinc-400": ["placeholder:text-foreground-subtle"],
  "[&_div]:!text-[1.375rem]": ["[&_div]:!text-heading-sm"],
  "accent-zinc-900": ["accent-action-hover"],
  "focus-visible:ring-zinc-900": ["focus-visible:ring-action-hover"],
  "from-purple-500/30": ["from-brand/30"],
  "from-white": ["from-surface"],
  "ring-zinc-100": ["ring-separator"],
  "ring-zinc-800": ["ring-action"],
  "scrollbar-thumb-zinc-200": ["scrollbar-thumb-surface-active"],
  "to-blue-500/30": ["to-info/30"],
  "before:bg-[linear-gradient(90deg,transparent_0%,transparent_40%,#18181b_50%,transparent_60%,transparent_100%)]": ["before:bg-[linear-gradient(90deg,transparent_0%,transparent_40%,rgb(var(--color-primary))_50%,transparent_60%,transparent_100%)]"],
};
function mapToken(t: string, attrTokens: string[]): string[] {
  if (MANUAL[t]) return MANUAL[t];
  return rewriteClassList(t, MAP, SIZE).output.split(/\s+/);
}

async function main() {
  const files = execSync(`find "${rel}" -name '*.tsx' -o -name '*.ts'`, { cwd: headDir })
    .toString().trim().split("\n")
    .filter((f) => !/\.(test|stories)\.tsx?$/.test(f));
  type Pair = { file: string; key: string; merged: boolean; a: string; b: string; a2: string; b2: string; ia: number; ib: number; ia2: number; ib2: number };
  const pairs: Pair[] = [];
  const manual: string[] = [];
  const allOld = new Set<string>(), allNew = new Set<string>();
  const inheritChecks: { file: string; attr: Attr; k: number }[] = [];
  for (const f of files) {
    const b = join(baseDir, f);
    if (!existsSync(b)) continue;
    const oldAttrs = collect(b);
    const newAttrs = collect(join(headDir, f));
    if (oldAttrs.length !== newAttrs.length) {
      manual.push(`${f}: ${oldAttrs.length} vs ${newAttrs.length} className attributes`);
      continue;
    }
    oldAttrs.forEach((o, n) => {
      const h = newAttrs[n];
      if (o.tokens.join(" ") === h.tokens.join(" ")) return;
      // Expected head tokens: every old token mapped, keyed by branch path.
      const expected: { t: string; path: string; from: number }[] = [];
      o.tokens.forEach((t, i) => mapToken(t, o.tokens).forEach((m) => expected.push({ t: m, path: o.paths[i], from: i })));
      const key = (t: string, p: string) => `${p}|${t}`;
      const pool = new Map<string, number[]>();
      h.tokens.forEach((t, j) => { const k = key(t, h.paths[j].replace(/\/\d+/g, (x) => x)); });
      // Paths carry global ids, so compare branch shape only by order of appearance.
      const norm = (attr: Attr) => { const ids = new Map<string, string>(); return attr.paths.map((p) => p.replace(/\d+(?=[abp])/g, (id) => { if (!ids.has(id)) ids.set(id, String(ids.size)); return ids.get(id)!; })); };
      const op = norm(o), hp = norm(h);
      expected.forEach((e) => (e.path = op[e.from]));
      h.tokens.forEach((t, j) => { const k = key(t, hp[j]); pool.set(k, [...(pool.get(k) ?? []), j]); });
      const position = new Map<number, number>();
      const unmatched: string[] = [];
      for (const e of expected) {
        const list = pool.get(key(e.t, e.path));
        if (!list?.length) { unmatched.push(e.t); continue; }
        const j = list.shift()!;
        if (!position.has(e.from) || /leading-inherit$/.test(e.t) === false) position.set(e.from, j);
        if (/(^|:)!?leading-inherit$/.test(e.t)) inheritChecks.push({ file: f, attr: h, k: j });
      }
      const extra = [...pool.values()].flat().map((j) => h.tokens[j]);
      // The codemod adds no leading-inherit when a leading-* already sits in the same scope.
      const stillMissing = unmatched.filter((t) => {
        if (!/(^|:)!?leading-inherit$/.test(t)) return true;
        return !h.tokens.some((x) => /leading-(?!inherit)/.test(x) && variantOf(x) === variantOf(t));
      });
      unmatched.length = 0;
      unmatched.push(...stillMissing);
      if (unmatched.length || extra.length) {
        manual.push(`${f} ${h.key}: expected but missing [${unmatched.join(" ")}], unexpected [${extra.join(" ")}]`);
        return;
      }
      o.tokens.forEach((t) => allOld.add(t));
      h.tokens.forEach((t) => allNew.add(t));
      for (let i = 0; i < o.tokens.length; i++)
        for (let k = i + 1; k < o.tokens.length; k++) {
          if (exclusive(o.paths[i], o.paths[k])) continue;
          const ii = position.get(i)!, kk = position.get(k)!;
          pairs.push({ file: f, key: h.key, merged: o.merged, a: o.tokens[i], b: o.tokens[k], a2: h.tokens[ii], b2: h.tokens[kk], ia: i, ib: k, ia2: ii, ib2: kk });
        }
    });
  }
  const oldInfo = await ruleInfo(baseDir, [...allOld]);
  const newInfo = await ruleInfo(headDir, [...allNew]);
  let flips = 0;
  for (const p of pairs) {
    if (p.a === p.b) continue;
    if (variantOf(p.a) !== variantOf(p.b)) continue;
    const ia = oldInfo.get(p.a), ib = oldInfo.get(p.b), na = newInfo.get(p.a2), nb = newInfo.get(p.b2);
    if (!ia || !ib || !na || !nb) continue;
    const ov = [...ia.props].filter((x) => ib.props.has(x));
    const nv = [...na.props].filter((x) => nb.props.has(x));
    if (!ov.length && !nv.length) continue;
    // Winner in CSS order.
    let oldWin = ia.index > ib.index ? "a" : "b";
    let newWin = na.index > nb.index ? "a" : "b";
    if (p.merged) {
      // cn(): tailwind-merge drops the earlier class of a conflict; the later one in the string wins.
      const oldDrop = cn(`${p.a} ${p.b}`).split(" ").length === 1 || cn(`${p.b} ${p.a}`).split(" ").length === 1;
      const newDrop = cn(`${p.a2} ${p.b2}`).split(" ").length === 1 || cn(`${p.b2} ${p.a2}`).split(" ").length === 1;
      if (oldDrop) oldWin = p.ia > p.ib ? "a" : "b";
      if (newDrop) newWin = p.ia2 > p.ib2 ? "a" : "b";
    }
    const sizeVsLeading = !ov.length && nv.join() === "line-height" && ((/leading-/.test(p.b2) && newWin === "b") || (/leading-/.test(p.a2) && newWin === "a"));
    if (sizeVsLeading) continue;
    if (oldWin !== newWin) {
      flips++;
      console.log(`${p.file} ${p.key}${p.merged ? " (cn)" : ""}: ${p.a} vs ${p.b} -> ${p.a2} vs ${p.b2}; ${ov.join(",")}; winner ${oldWin === "a" ? p.a : p.b} -> ${newWin === "a" ? p.a2 : p.b2}`);
    }
  }
  let inheritFlags = 0;
  for (const { file, attr, k } of inheritChecks) {
    attr.tokens.forEach((t, m) => {
      if (m === k) return;
      const vt = variantOf(t), vk = variantOf(attr.tokens[k]);
      if (vt !== vk && !(vt === "" && vk !== "")) return;
      if (exclusive(attr.paths[m], attr.paths[k])) return;
      if (/(^|:)!?text-(tiny|caption-sm|caption|body-sm|body|body-md|body-lg|lead|heading-sm|heading|title|display)$/.test(t) && vt === vk) return;
      const info = newInfo.get(t);
      if (info?.props.has("line-height")) {
        // A same-scope leading-* after the size wins in CSS and in cn(); the codemod only adds leading-inherit when none exists.
        inheritFlags++;
        console.log(`${file} ${attr.key}: ${attr.tokens[k]} next to ${t} (sets line-height)`);
      }
    });
  }
  console.log(`\n${pairs.length} class pairs checked, ${flips} winner flips; ${inheritChecks.length} leading-inherit, ${inheritFlags} next to another line-height`);
  if (manual.length) console.log(`\nCheck by hand:\n${manual.join("\n")}`);
}
main();
