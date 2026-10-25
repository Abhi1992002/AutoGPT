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
const { variants, tones } = await import(join(process.cwd(), "src/components/atoms/Text/helpers.ts"));
const [base, head, out] = process.argv.slice(2);
const files = execSync(`git diff --name-only ${base}..${head} -- '${FE}src/app/(platform)/build'`, { cwd: ROOT }).toString().split("\n").filter((f) => f.endsWith(".tsx"));

interface El { tag: string; variant?: string; as?: string; tone?: string; cls: string | null; line: number; inButton: boolean }
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
        els.push({ tag, variant: attr(n.attributes, "variant"), as: attr(n.attributes, "as"), tone: attr(n.attributes, "tone"), cls: attr(n.attributes, "className") ?? null, line: sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1, inButton: legacyButton && stack.slice(0, ts.isJsxOpeningElement(n) ? -1 : undefined).includes("Button") });
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
  if (a.length !== b.length) { mismatch++; console.log(`ELEMENT COUNT DIFFERS ${f}: ${a.length} vs ${b.length}`); continue; }
  a.forEach((x, i) => {
    const y = b[i];
    if (y.tag !== "Text") return;
    if (x.tag === "Text" && x.cls === y.cls && x.tone === y.tone && x.variant === y.variant) return;
    if (y.variant?.startsWith("expr:") || x.variant?.startsWith("expr:")) { console.log(`DYNAMIC ${f}:${y.line}`); return; }
    const o = effective(x), n = effective(y);
    if (o === null || n === null) { console.log(`DYNAMIC ${f}:${y.line}`); return; }
    pairs.push({ file: f.replace(FE, ""), old: o, new: n, tag: "Text-merged", variant: y.variant, line: y.line, ...(y.inButton && x.inButton ? { parent: "font-medium" } : {}) });
  });
}
writeFileSync(out, JSON.stringify({ pairs, unpaired: [] }, null, 1));
console.log(`${pairs.length} Text elements (base class string -> cn()-merged Text class string); ${mismatch} files with a different element count`);
