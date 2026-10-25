// Rule 8/14 pairs: every element that renders through <Text> at head and
// either was a plain element at base or had its className/tone changed.
// old = the class string the element rendered at base (cn(variant, className)
// for a base <Text>), new = cn(variant, tone, className) at head, the way
// Text.tsx merges it. Elements are matched in document order per file.
//
//   npx tsx text_pairs.mts <base-sha> <head-sha> <out.json>
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
const ROOT = "/home/vercel-sandbox/autogpt";
const FE = "autogpt_platform/frontend/";
const req = createRequire(join(process.cwd(), "package.json"));
const ts = req("typescript");
const { cn } = await import(join(process.cwd(), "src/lib/utils.ts"));
const { variants, tones, variantElementMap } = await import(join(process.cwd(), "src/components/atoms/Text/helpers.ts"));
const [base, head, out] = process.argv.slice(2);
const files = execSync(`git diff --name-only ${base}..${head} -- '${FE}src/app/(platform)/build'`, { cwd: ROOT }).toString().split("\n").filter((f) => f.endsWith(".tsx"));

interface El { tag: string; variant?: string; as?: string; tone?: string; cls: string | null; line: number; inButton: boolean; text: string }
function elements(src: string, f: string) {
  const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const els: El[] = [];
  const attr = (attrs: any, name: string) => {
    const a = attrs.properties.find((p: any) => ts.isJsxAttribute(p) && p.name.getText(sf) === name);
    if (!a || !a.initializer) return undefined;
    if (ts.isStringLiteral(a.initializer)) return a.initializer.text;
    if (ts.isJsxExpression(a.initializer) && a.initializer.expression) {
      const e = a.initializer.expression;
      if (ts.isStringLiteral(e)) return e.text;
      if (ts.isCallExpression(e) && e.expression.getText(sf) === "cn" && e.arguments[0] && ts.isStringLiteral(e.arguments[0])) return `cn:${e.arguments[0].text}`;
      return `expr:${e.getText(sf)}`;
    }
    return undefined;
  };
  // The legacy <Button> sets font-medium on itself; children inherit it.
  const legacyButton = /from "@\/components\/__legacy__\/ui\/button"/.test(src);
  const stack: string[] = [];
  function visit(n: any) {
    if (ts.isJsxElement(n)) {
      stack.push(n.openingElement.tagName.getText(sf));
      ts.forEachChild(n, visit);
      stack.pop();
      return;
    }
    if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) {
      const tag = n.tagName.getText(sf);
      if (tag === "Text" || /^[a-z][a-z0-9]*$/.test(tag)) {
        // The copy under the element (JSX text and expressions), for aligning.
        const text: string[] = [];
        const hasJsx = (x: any): boolean => ts.isJsxElement(x) || ts.isJsxSelfClosingElement(x) || ts.isJsxFragment(x) || !!ts.forEachChild(x, (c: any) => hasJsx(c) || undefined);
        const grab = (x: any) => { if (ts.isJsxAttributes(x)) return; if (ts.isJsxText(x)) text.push(x.getText(sf)); else if (ts.isJsxExpression(x) && x.expression && !hasJsx(x.expression)) text.push(x.expression.getText(sf)); else ts.forEachChild(x, grab); };
        if (ts.isJsxOpeningElement(n)) n.parent.children.forEach(grab);
        els.push({ tag, variant: attr(n.attributes, "variant"), as: attr(n.attributes, "as"), tone: attr(n.attributes, "tone"), cls: attr(n.attributes, "className") ?? null, line: sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1, inButton: legacyButton && stack.slice(0, ts.isJsxOpeningElement(n) ? -1 : undefined).includes("Button"), text: text.join(" ").replace(/\s+/g, " ").trim() });
      }
    }
    ts.forEachChild(n, visit);
  }
  visit(sf);
  return els;
}
const effective = (e: El) => {
  const own = (e.cls ?? "").replace(/^cn:/, "");
  if (e.cls?.startsWith("expr:")) return null;
  if (e.tag !== "Text") return own;
  return cn(variants[e.variant as keyof typeof variants], e.tone && tones[e.tone as keyof typeof tones], own);
};
const pairs: { file: string; old: string; new: string; tag: string; variant?: string; line: number; parent?: string }[] = [];
let mismatch = 0;
for (const f of files) {
  let baseSrc: string;
  try { baseSrc = execSync(`git show "${base}:${f}"`, { cwd: ROOT, stdio: ["pipe", "pipe", "ignore"] }).toString(); } catch { continue; }
  const a = elements(baseSrc, f);
  const b = elements(execSync(`git show "${head}:${f}"`, { cwd: ROOT }).toString(), f);
  // Elements are matched in document order. When the head wraps copy in a new
  // <Text> (inside a button, th, td or tooltip), the counts differ: the two
  // sequences are then aligned on the tag each element renders and the copy
  // under it (longest common subsequence), and a head <Text> with no base element is an inserted
  // wrapper, listed here and measured by markup_eq.mts instead.
  const key = (e: El) => `${e.tag === "Text" ? e.as ?? (variantElementMap as any)[e.variant ?? ""] ?? "p" : e.tag}|${e.text}`;
  let match: [number, number][];
  if (a.length === b.length) match = a.map((_, i) => [i, i]);
  else {
    mismatch++;
    const L = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) L[i][j] = key(a[i]) === key(b[j]) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    match = [];
    const hit = new Set<number>();
    for (let i = 0, j = 0; i < a.length && j < b.length; ) {
      if (key(a[i]) === key(b[j]) && L[i][j] === L[i + 1][j + 1] + 1) { match.push([i, j]); hit.add(j); i++; j++; }
      else if (L[i + 1][j] >= L[i][j + 1]) i++;
      else j++;
    }
    const inserted = b.map((e, j) => ({ e, j })).filter(({ e, j }) => !hit.has(j));
    console.log(`ALIGNED ${f}: ${a.length} vs ${b.length} elements; ${a.length - match.length} base and ${inserted.length} head elements unmatched`);
    for (const { e } of inserted) console.log(`  INSERTED ${f.split("build/")[1]}:${e.line} <${e.tag}${e.variant ? ` variant="${e.variant}"` : ""}${e.as ? ` as="${e.as}"` : ""}>`);
    for (let i = 0; i < a.length; i++) if (!match.some(([x]) => x === i)) console.log(`  BASE-ONLY ${f.split("build/")[1]}:${a[i].line} <${a[i].tag}> ${a[i].cls ?? ""}`);
    if (process.env.DEBUG_KEYS) { console.log(a.map(key).join("\n")); console.log("--"); console.log(b.map(key).join("\n")); }
  }
  match.forEach(([i, j]) => {
    const x = a[i];
    const y = b[j];
    if (y.tag !== "Text") return;
    if (x.tag === "Text" && x.cls === y.cls && x.tone === y.tone && x.variant === y.variant) return;
    if (y.variant?.startsWith("expr:") || x.variant?.startsWith("expr:")) { console.log(`DYNAMIC ${f}:${y.line}`); return; }
    const o = effective(x), n = effective(y);
    if (o === null || n === null) { console.log(`DYNAMIC ${f}:${y.line}`); return; }
    pairs.push({ file: f.replace(FE, ""), old: o, new: n, tag: "Text-merged", variant: y.variant, line: y.line, ...(y.inButton && x.inButton ? { parent: "font-medium" } : {}) });
  });
}
writeFileSync(out, JSON.stringify({ pairs, unpaired: [] }, null, 1));
console.log(`${pairs.length} Text elements (base class string -> cn()-merged Text class string); ${mismatch} files aligned on rendered tags (different element count)`);
