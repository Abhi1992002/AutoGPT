// Rule 31/22: every JSX element other than <Text> whose className literals carry
// typography (size, leading, weight, family, tracking, style/decoration/case).
//   npx tsx non_text_typo.mts <file...>
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
const req = createRequire(join(process.cwd(), "package.json"));
const ts = req("typescript");
const TYPO = /^(?:[\w\-\[\]&>:=*_()]+:)?!?(text-(?:xs|sm|base|lg|xl|\d?xl|body(?:-\w+)?|caption(?:-\w+)?|tiny|lead|title|heading(?:-\w+)?|display|\[[\d.]+(?:px|rem|em)\])|leading-\S+|font-(?:sans|mono|poppins|serif|thin|extralight|light|normal|medium|semibold|bold|extrabold|black)|tracking-\S+|italic|not-italic|uppercase|lowercase|capitalize|underline|line-through|no-underline)$/;
const ATTRS = new Set(["className", "labelClassName", "selectClassName", "inputClassName", "titleClassName"]);
for (const f of process.argv.slice(2)) {
  const sf = ts.createSourceFile(f, readFileSync(f, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const visit = (n: any) => {
    if ((ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) && n.tagName.getText(sf) !== "Text") {
      for (const a of n.attributes.properties) {
        if (!ts.isJsxAttribute(a) || !ATTRS.has(a.name.getText(sf)) || !a.initializer) continue;
        const lits: string[] = [];
        const collect = (x: any) => { if (ts.isStringLiteral(x) || ts.isNoSubstitutionTemplateLiteral(x)) lits.push(x.text); else if (ts.isTemplateExpression(x)) { lits.push(x.head.text); x.templateSpans.forEach((s: any) => lits.push(s.literal.text)); } ts.forEachChild(x, collect); };
        collect(a.initializer);
        const typo = lits.join(" ").split(/\s+/).filter((k) => TYPO.test(k));
        if (typo.length) console.log(`${f.replace(/.*\/build\//, "build/")}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1} <${n.tagName.getText(sf)}> ${a.name.getText(sf)}: ${[...new Set(typo)].join(" ")}`);
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
}
