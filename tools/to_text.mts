// Moves plain <p>/<span>/<div>/<li> elements whose className sets the font
// family, size and weight of a Text variant onto <Text variant as>, keeping
// every other class. Only elements whose class list carries one of this PR's
// typography tokens are touched (TOUCHED), so untouched code stays as it is.
//
//   npx tsx to_text.mts [--write] <files...>
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
const req = createRequire(join(process.cwd(), "package.json"));
const ts = req("typescript");

const TOUCHED = /(^|\s)(leading-5\.5|leading-5|leading-6|leading-4|leading-inherit|text-tiny|text-caption-sm|text-caption|text-body-sm|text-body|text-body-md|text-body-lg)(\s|$)/;
// size class -> [px, own line-height px]
const SIZES: Record<string, [number, number]> = {
  "text-xs": [12, 16],
  "text-sm": [14, 20],
  "text-base": [16, 24],
  "text-xl": [20, 28],
  "text-caption": [12, 18],
  "text-body": [14, 22],
  "text-body-lg": [16, 26],
  "text-lead": [20, 28],
};
const LEADING: Record<string, number> = {
  "leading-4": 16, "leading-4.5": 18, "leading-5": 20, "leading-5.5": 22, "leading-6": 24,
  "leading-6.5": 26, "leading-7": 28, "leading-8": 32,
};
const LEADING_OF_PX = Object.fromEntries(Object.entries(LEADING).map(([k, v]) => [v, k]));
// [px, weight] -> [variant, variant line-height px]
const VARIANTS: Record<string, [string, number]> = {
  "12 font-normal": ["small", 18],
  "12 font-medium": ["small-medium", 18],
  "14 font-normal": ["body", 22],
  "14 font-medium": ["body-medium", 22],
  "16 font-normal": ["large", 26],
  "16 font-medium": ["large-medium", 26],
  "16 font-semibold": ["large-semibold", 26],
  "20 font-normal": ["lead", 28],
  "20 font-medium": ["lead-medium", 28],
  "20 font-semibold": ["lead-semibold", 28],
};
const TAGS = new Set(["p", "span", "div", "li"]);
const DEFAULT_TAG: Record<string, string> = Object.fromEntries(Object.values(VARIANTS).map(([v]) => [v, "p"]));

function plan(classes: string[]) {
  const words = classes;
  if (!words.includes("font-sans")) return null;
  const sizes = words.filter((w) => w in SIZES);
  const weights = words.filter((w) => ["font-normal", "font-medium", "font-semibold"].includes(w));
  const leadings = words.filter((w) => w in LEADING);
  if (sizes.length !== 1 || weights.length !== 1 || leadings.length > 1) return null;
  // Anything else that sets type stays out: variants, !important, arbitrary.
  if (words.some((w) => /(^|:)!?(text-\[|leading-\[|font-\[)/.test(w) || /^!/.test(w) && /text-|leading-|font-/.test(w))) return null;
  if (words.some((w) => /^[\w-]+:(font-(sans|poppins|mono)|text-(xs|sm|base|lg|xl)|leading-)/.test(w))) return null;
  // Text sets a colour; the element must already set its own, or it would
  // lose the colour it inherits today.
  const ALIGN = /^text-(left|center|right|justify|start|end|ellipsis|clip|wrap|nowrap|balance|pretty)$/;
  if (!words.some((w) => /^!?text-/.test(w) && !(w.replace(/^!/, "") in SIZES) && !ALIGN.test(w.replace(/^!/, "")) && !/^!?text-(xs|sm|base|lg|\d?xl|\[)/.test(w))) return null;
  const [px, own] = SIZES[sizes[0]];
  const v = VARIANTS[`${px} ${weights[0]}`];
  if (!v) return null;
  const lh = leadings.length ? LEADING[leadings[0]] : own;
  const keep = words.filter((w) => w !== "font-sans" && w !== sizes[0] && w !== weights[0] && !(w in LEADING));
  if (lh !== v[1]) {
    const lc = LEADING_OF_PX[lh];
    if (!lc) return null;
    keep.push(lc);
  }
  return { variant: v[0], keep };
}

const write = process.argv.includes("--write");
const files = process.argv.slice(2).filter((a) => !a.startsWith("--"));
let total = 0;
for (const file of files) {
  const src = readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits: { start: number; end: number; text: string }[] = [];
  function visit(node: any) {
    if (ts.isJsxElement(node)) {
      const open = node.openingElement;
      const tag = open.tagName.getText(sf);
      if (TAGS.has(tag)) {
        const attrs = open.attributes.properties;
        const cls = attrs.find((a: any) => ts.isJsxAttribute(a) && a.name.getText(sf) === "className");
        const hasRef = attrs.some((a: any) => ts.isJsxSpreadAttribute(a) || (ts.isJsxAttribute(a) && ["ref", "as", "variant", "size", "tone"].includes(a.name.getText(sf))));
        let lit: any = null;
        if (cls && cls.initializer && ts.isStringLiteral(cls.initializer)) lit = cls.initializer;
        else if (cls?.initializer && ts.isJsxExpression(cls.initializer) && cls.initializer.expression && ts.isCallExpression(cls.initializer.expression) && cls.initializer.expression.expression.getText(sf) === "cn") {
          const first = cls.initializer.expression.arguments[0];
          if (first && ts.isStringLiteral(first)) lit = first;
        }
        if (lit && !hasRef && TOUCHED.test(lit.text)) {
          const words = lit.text.split(/\s+/).filter(Boolean);
          const p = plan(words);
          if (p) {
            total++;
            const asAttr = DEFAULT_TAG[p.variant] === tag ? "" : ` as="${tag}"`;
            const q = lit.getText(sf)[0];
            edits.push({ start: open.tagName.getStart(sf), end: open.tagName.getEnd(), text: `Text variant="${p.variant}"${asAttr}` });
            edits.push({ start: lit.getStart(sf), end: lit.getEnd(), text: `${q}${p.keep.join(" ")}${q}` });
            edits.push({ start: node.closingElement.tagName.getStart(sf), end: node.closingElement.tagName.getEnd(), text: "Text" });
            console.log(`${file}:${sf.getLineAndCharacterOfPosition(open.getStart(sf)).line + 1}  <${tag} "${lit.text}"> -> <Text variant="${p.variant}"${asAttr} "${p.keep.join(" ")}">`);
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  if (!edits.length) continue;
  let out = src;
  for (const e of edits.sort((a, b) => b.start - a.start)) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  if (!/import \{[^}]*\bText\b[^}]*\} from "@\/components\/atoms\/Text\/Text"/.test(out)) {
    const lastImport = [...out.matchAll(/^import [\s\S]*?;$/gm)].pop()!;
    const at = lastImport.index! + lastImport[0].length;
    out = out.slice(0, at) + `\nimport { Text } from "@/components/atoms/Text/Text";` + out.slice(at);
  }
  if (write) writeFileSync(file, out);
}
console.log(`${total} element(s)${write ? "" : " (dry run)"}`);
