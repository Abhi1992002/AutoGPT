// Text-first, second pass: every JSX element Text can render (span/div/p/li/
// code/label/h*) that sets a text size role class directly moves onto
// <Text variant as>. Rendering is preserved:
//   - variant chosen by the size role (caption->small, body->body,
//     body-lg->large, lead->lead); the role class itself is dropped
//   - weight, leading, family, alignment and every other class stay in
//     className and win over the variant in cn()
//   - a colour that is a Text tone moves to `tone`; any other colour stays;
//     an element that set no colour gets `text-inherit`, so it keeps the
//     colour it inherits instead of the variant's foreground-base
// Elements with no weight class are reported (Text sets font-normal).
//
//   npx tsx to_text2.mts [--write] <files...>
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
const req = createRequire(join(process.cwd(), "package.json"));
const ts = req("typescript");

const TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6", "p", "span", "div", "code", "label", "kbd", "li", "dt", "dd"]);
const VARIANT: Record<string, string> = { "text-caption": "small", "text-body": "body", "text-body-lg": "large", "text-lead": "lead" };
const ROLES = /^text-(tiny|caption-sm|caption|body-sm|body-md|body-lg|body|lead|heading-sm|heading|title|display)$/;
const TONES: Record<string, string> = { "text-foreground-strong": "primary", "text-foreground-emphasis": "emphasis", "text-foreground-body": "body", "text-foreground-secondary": "secondary", "text-foreground-tertiary": "muted", "text-foreground-subtle": "subtle" };
const NON_COLOUR = /^text-(left|center|right|justify|start|end|ellipsis|clip|wrap|nowrap|balance|pretty|xs|sm|base|lg|\d?xl|\[)/;
const isColour = (w: string) => /^text-/.test(w) && !ROLES.test(w) && !NON_COLOUR.test(w);
const isWeight = (w: string) => /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/.test(w);

const write = process.argv.includes("--write");
const files = process.argv.slice(2).filter((a) => !a.startsWith("--"));
let total = 0;
for (const file of files) {
  const src = readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits: { start: number; end: number; text: string }[] = [];
  const visit = (node: any) => {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const open = ts.isJsxElement(node) ? node.openingElement : node;
      const tag = open.tagName.getText(sf);
      const attrs = open.attributes.properties;
      const cls = attrs.find((a: any) => ts.isJsxAttribute(a) && a.name.getText(sf) === "className");
      let lit: any = null;
      if (cls?.initializer && ts.isStringLiteral(cls.initializer)) lit = cls.initializer;
      else if (cls?.initializer && ts.isJsxExpression(cls.initializer) && cls.initializer.expression && ts.isCallExpression(cls.initializer.expression) && cls.initializer.expression.expression.getText(sf) === "cn") {
        const first = cls.initializer.expression.arguments[0];
        if (first && ts.isStringLiteral(first)) lit = first;
      }
      const line = sf.getLineAndCharacterOfPosition(open.getStart(sf)).line + 1;
      if (TAGS.has(tag) && lit) {
        const words = lit.text.split(/\s+/).filter(Boolean);
        const roles = words.filter((w: string) => ROLES.test(w));
        const blocked = attrs.some((a: any) => ts.isJsxSpreadAttribute(a) || (ts.isJsxAttribute(a) && ["ref", "as", "variant", "size", "tone"].includes(a.name.getText(sf))));
        if (roles.length === 1 && !blocked) {
          const v = VARIANT[roles[0]];
          if (!v) { console.log(`SKIP no variant for ${roles[0]}: ${file}:${line}`); }
          else {
            let keep = words.filter((w: string) => w !== roles[0]);
            const colours = keep.filter(isColour);
            let tone = "";
            if (colours.length === 1 && TONES[colours[0]]) { tone = TONES[colours[0]]; keep = keep.filter((w: string) => w !== colours[0]); }
            else if (colours.length === 0) keep.push("text-inherit");
            const noWeight = !keep.some(isWeight);
            const asAttr = tag === "p" ? "" : ` as="${tag}"`;
            const toneAttr = tone ? ` tone="${tone}"` : "";
            const q = lit.getText(sf)[0];
            edits.push({ start: open.tagName.getStart(sf), end: open.tagName.getEnd(), text: `Text variant="${v}"${asAttr}${toneAttr}` });
            edits.push({ start: lit.getStart(sf), end: lit.getEnd(), text: `${q}${keep.join(" ")}${q}` });
            if (ts.isJsxElement(node)) edits.push({ start: node.closingElement.tagName.getStart(sf), end: node.closingElement.tagName.getEnd(), text: "Text" });
            total++;
            console.log(`${noWeight ? "NOWEIGHT " : "         "}${file.replace(/.*\/build\//, "")}:${line} <${tag}> -> <Text variant="${v}"${asAttr}${toneAttr}> "${keep.join(" ")}"`);
          }
        } else if (roles.length) console.log(`SKIP ${blocked ? "blocked" : "roles=" + roles.join(",")}: ${file}:${line}`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  if (!edits.length) continue;
  let out = src;
  for (const e of edits.sort((a, b) => b.start - a.start)) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  if (!/import \{[^}]*\bText\b[^}]*\} from "@\/components\/atoms\/Text\/Text"/.test(out)) {
    const imports = [...out.matchAll(/^import [\s\S]*?;$/gm)];
    const last = imports[imports.length - 1];
    const at = last.index! + last[0].length;
    out = out.slice(0, at) + `\nimport { Text } from "@/components/atoms/Text/Text";` + out.slice(at);
  }
  if (write) writeFileSync(file, out);
}
console.log(`${total} element(s)${write ? "" : " (dry run)"}`);
