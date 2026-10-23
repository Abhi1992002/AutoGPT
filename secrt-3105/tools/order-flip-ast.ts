// Element-level CSS-order check. Tailwind v3 emits same-plugin utilities in
// alphabetical class order, so when two classes on one element set the same
// property and neither cn()/twMerge drops one, the alphabetically later wins.
// A rename can flip that. For every className-like expression in the base
// version of each changed file that is NOT wrapped in cn()/twMerge, collect
// every string literal in it, find conflicting pairs (twMerge's own grouping,
// same variants) with at least one renamed class, and flag order flips.
// Expressions wrapped in cn() resolve by position, which the codemod keeps.
import { execFileSync, execSync } from "node:child_process";
import ts from "../../autogpt_platform/frontend/node_modules/typescript";
import { cn } from "../../autogpt_platform/frontend/src/lib/utils";
import { buildReplacementMap, buildSizeMap, rewriteClassList } from "../../autogpt_platform/frontend/scripts/codemod-tokens";

const MERGE_BASE = execSync("git merge-base HEAD origin/dev", { cwd: process.argv[2] }).toString().trim();
const cwd = process.argv[2];
const map = buildReplacementMap();
const sizeMap = buildSizeMap();
// Hand mappings this PR adds on top of the codemod.
const HAND: Record<string, string> = { "bg-[#F9F9FA]": "bg-surface-muted", "border-[#DADADC]": "border-border-base", "focus-visible:ring-zinc-800": "focus-visible:ring-action", "from-amber-50/60": "from-warning-surface/60", "to-white": "to-surface", "to-blue-50": "to-info-surface", "via-white": "via-surface", "placeholder:text-zinc-400": "placeholder:text-foreground-subtle", "from-zinc-100": "from-surface-hover", "to-zinc-200": "to-surface-active", "scrollbar-thumb-zinc-200": "scrollbar-thumb-surface-active", "stroke-zinc-200": "stroke-border-base", "fill-zinc-200": "fill-surface-active", "fill-white": "fill-surface", "border-green-600": "border-success", "border-purple-500": "border-brand" };
const renamed = (w: string) => HAND[w] ?? rewriteClassList(w, map, sizeMap).output.split(/\s+/)[0];
const files = execSync("git diff --name-only $(git merge-base HEAD origin/dev) -- 'src/app/(platform)'", { cwd }).toString().trim().split("\n").filter(Boolean);
const MERGERS = new Set(["cn", "twMerge", "cva"]);
let exprs = 0, pairs = 0, flips = 0, unwrapped = 0;
for (const f of files) {
  if (!/\.(tsx|ts)$/.test(f)) continue;
  const src = execFileSync("git", ["show", `${MERGE_BASE}:${f}`], { cwd }).toString();
  const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true, f.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const check = (node: ts.Node, where: string) => {
    exprs++;
    const words = new Set<string>();
    let merged = false;
    const walk = (n: ts.Node) => {
      if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && MERGERS.has(n.expression.text)) { merged = true; return; }
      if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) n.text.split(/\s+/).filter(Boolean).forEach((w) => words.add(w));
      if (ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)) n.text.split(/\s+/).filter(Boolean).forEach((w) => words.add(w));
      ts.forEachChild(n, walk);
    };
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && MERGERS.has(node.expression.text)) return;
    walk(node);
    if (merged && words.size === 0) return;
    unwrapped++;
    const list = [...words];
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
      const na = renamed(a), nb = renamed(b);
      if (na === a && nb === b) continue;
      if (cn(a, b) !== b || cn(b, a) !== a) continue;
      pairs++;
      if ((a < b) !== (na < nb)) { flips++; console.log(`FLIP ${where}: ${a} + ${b} -> ${na} + ${nb}`); }
    }
  };
  const visit = (n: ts.Node) => {
    if (ts.isJsxAttribute(n) && /className$/i.test(n.name.getText(sf)) && n.initializer) {
      const { line } = sf.getLineAndCharacterOfPosition(n.getStart(sf));
      const init = ts.isJsxExpression(n.initializer) && n.initializer.expression ? n.initializer.expression : n.initializer;
      check(init, `${f}:${line + 1}`);
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
}
console.log(`className expressions ${exprs}, not wrapped in cn() ${unwrapped}, conflicting renamed pairs on one element ${pairs}, order flips ${flips}`);
