// Folds overrides that a <Text> variant already expresses back into the
// variant: drops `font-sans` (every body/small/large/lead variant sets it) and
// moves `font-medium` / `font-semibold` into the -medium / -semibold variant
// where one exists. cn() renders the same class set either way.
//   npx tsx text_fold.mts <file...>   (prints each change; writes in place)
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
const req = createRequire(join(process.cwd(), "package.json"));
const ts = req("typescript");
const FAMILY = /^(body|small|large|lead)(-medium|-semibold)?$/;
const HAS = new Set(["body-medium", "small-medium", "large-medium", "large-semibold", "lead-medium", "lead-semibold"]);
for (const f of process.argv.slice(2)) {
  let src = readFileSync(f, "utf8");
  const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits: { start: number; end: number; text: string }[] = [];
  const visit = (n: any) => {
    if ((ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) && n.tagName.getText(sf) === "Text") {
      const attr = (name: string) => n.attributes.properties.find((a: any) => ts.isJsxAttribute(a) && a.name.getText(sf) === name);
      const v = attr("variant"), c = attr("className");
      const vLit = v?.initializer && ts.isStringLiteral(v.initializer) ? v.initializer : null;
      let cLit: any = c?.initializer && ts.isStringLiteral(c.initializer) ? c.initializer : null;
      if (!cLit && c?.initializer && ts.isJsxExpression(c.initializer)) {
        const e = c.initializer.expression;
        if (e && ts.isCallExpression(e) && e.expression.getText(sf) === "cn" && e.arguments.length === 1 && ts.isStringLiteral(e.arguments[0])) cLit = e.arguments[0];
      }
      if (vLit && cLit && FAMILY.test(vLit.text) && !attr("size")) {
        let variant = vLit.text;
        let classes = cLit.text.split(/\s+/).filter(Boolean);
        const base = variant.replace(/-(medium|semibold)$/, "");
        classes = classes.filter((k: string) => k !== "font-sans");
        for (const w of ["medium", "semibold"]) {
          if (classes.includes(`font-${w}`) && HAS.has(`${base}-${w}`)) { variant = `${base}-${w}`; classes = classes.filter((k: string) => k !== `font-${w}`); }
        }
        const text = classes.join(" ");
        if (variant !== vLit.text) edits.push({ start: vLit.getStart(sf), end: vLit.getEnd(), text: `"${variant}"` });
        if (text !== cLit.text) {
          if (!text) edits.push({ start: c.getFullStart(), end: c.getEnd(), text: "" });
          else edits.push({ start: cLit.getStart(sf), end: cLit.getEnd(), text: `"${text}"` });
        }
        if (variant !== vLit.text || text !== cLit.text) console.log(`${f}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1} ${vLit.text} "${cLit.text}" -> ${variant} "${text}"`);
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  for (const e of edits.sort((a, b) => b.start - a.start)) src = src.slice(0, e.start) + e.text + src.slice(e.end);
  if (edits.length) writeFileSync(f, src);
}
