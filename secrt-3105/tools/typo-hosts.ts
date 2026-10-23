// For every changed literal that gains a typography class (size role,
// leading-*, tracking-*), print the JSX element that receives it and its
// static props, so component-merged cn() results can be checked.
import { execFileSync, execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "../../autogpt_platform/frontend/node_modules/typescript";
const MERGE_BASE = execSync("git merge-base HEAD origin/dev", { cwd: process.argv[2] }).toString().trim();
const head = process.argv[2];
const files = execSync("git diff --name-only $(git merge-base HEAD origin/dev) -- 'src/app/(platform)'", { cwd: head }).toString().trim().split("\n").filter(Boolean).map((f) => f.replace(/^autogpt_platform\/frontend\//, ""));
const TYPO = new RegExp(process.env.ALL ? "." : "(^|[\\s:])(text-(tiny|caption-sm|caption|body-sm|body-md|body-lg|body|lead|heading-sm|heading|title|display)|leading-[\\w.]+|tracking-[\\w-]+)(\\s|$)");
for (const f of files) {
  const src = readFileSync(join(head, f), "utf8");
  const old = execFileSync("git", ["show", `${MERGE_BASE}:autogpt_platform/frontend/${f}`], { cwd: head }).toString();
  const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const walk = (n: ts.Node) => {
    if ((ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)) && TYPO.test(n.text) && !old.includes(n.text)) {
      let p: ts.Node | undefined = n;
      while (p && !ts.isJsxOpeningElement(p) && !ts.isJsxSelfClosingElement(p)) p = p.parent;
      const line = sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
      if (!p) { console.log(`${f}:${line}\t(no JSX host)\t${n.text}`); }
      else {
        const el = p as ts.JsxOpeningElement;
        const props = el.attributes.properties.filter(ts.isJsxAttribute).filter((a) => ["variant", "size", "tone", "as"].includes(a.name.getText(sf))).map((a) => a.getText(sf)).join(" ");
        console.log(`${f}:${line}\t<${el.tagName.getText(sf)} ${props}>\t${n.text}`);
      }
    }
    ts.forEachChild(n, walk);
  };
  walk(sf);
}
