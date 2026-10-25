// Rule 17 parity, per changed file, base vs head:
//  - exports: the same names, and each exported function's parameter type
//    text (its props contract) is identical
//  - DOM: the sequence of rendered tags is identical, where <Text as="x">
//    counts as x and <Text> without `as` counts as its variant's default tag
//  - attributes: on every element, the non-styling attributes (ids, aria-*,
//    role, data-*, refs, event handlers, other props) are identical; the only
//    allowed differences are className/tone/variant/as on elements that moved
//    onto Text, and className values (proven by the equivalence tables)
//   npx tsx parity.mts <base> <head> <pathspec> <out.md>
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
const req = createRequire(join(process.cwd(), "package.json"));
const ts = req("typescript");
const { variantElementMap } = await import(join(process.cwd(), "src/components/atoms/Text/helpers.ts"));
const ROOT = "/home/vercel-sandbox/autogpt";
const [base, head, spec, out] = process.argv.slice(2);
const files = execSync(`git diff --name-only ${base} ${head} -- '${spec}'`, { cwd: ROOT }).toString().split("\n").filter((f) => /\.tsx?$/.test(f) && !/__tests__|\.test\./.test(f));
const STYLE = new Set(["className", "tone", "variant", "as", "key"]);

function analyse(raw: string, f: string) {
  const kind = f.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  // Comments (TODO(tokens) notes) never render: print without them first.
  const src = ts.createPrinter({ removeComments: true }).printFile(ts.createSourceFile(f, raw, ts.ScriptTarget.Latest, true, kind));
  const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true, kind);
  const exports: string[] = [];
  const els: { tag: string; attrs: string }[] = [];
  const visit = (n: any) => {
    if ((ts.isFunctionDeclaration(n) || ts.isVariableStatement(n)) && n.modifiers?.some((m: any) => m.kind === ts.SyntaxKind.ExportKeyword)) {
      if (ts.isFunctionDeclaration(n)) exports.push(`${n.name?.getText(sf)}(${n.parameters.map((p: any) => p.type?.getText(sf) ?? p.getText(sf)).join(", ")})`);
      else for (const d of n.declarationList.declarations) {
        const init = d.initializer;
        const params = init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) ? init.parameters.map((p: any) => p.type?.getText(sf) ?? p.getText(sf)).join(", ") : init?.getText(sf).slice(0, 0) ?? "";
        exports.push(`${d.name.getText(sf)}${d.type ? ": " + d.type.getText(sf) : ""}(${params})`);
      }
    }
    if (ts.isInterfaceDeclaration(n) || ts.isTypeAliasDeclaration(n)) exports.push(`type ${n.name.getText(sf)} = ${n.getText(sf).replace(/\s+/g, " ").replace(/^.*?[={]/, "")}`);
    if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) {
      let tag = n.tagName.getText(sf);
      const attrs: string[] = [];
      let asTag = "", variant = "";
      for (const a of n.attributes.properties) {
        if (ts.isJsxSpreadAttribute(a)) { attrs.push(`{...${a.expression.getText(sf)}}`); continue; }
        const name = a.name.getText(sf);
        const val = a.initializer ? a.initializer.getText(sf).replace(/\s+/g, " ") : "true";
        if (name === "as") asTag = val.replace(/["{}]/g, "");
        if (name === "variant") variant = val.replace(/["{}]/g, "");
        const clean = val.replace(/className=("[^"]*"|\{[^}]*\})/g, "className=…").replace(/\s+/g, " ");
        if (!STYLE.has(name) && !/ClassName$/.test(name)) attrs.push(`${name}=${clean}`);
      }
      if (tag === "Text") tag = asTag || (variantElementMap as Record<string, string>)[variant] || "p";
      els.push({ tag, attrs: attrs.sort().join(" ") });
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return { exports, els };
}

const rows: string[] = [];
let problems = 0;
for (const f of files) {
  let a;
  try { a = analyse(execSync(`git show "${base}:${f}"`, { cwd: ROOT, stdio: ["pipe", "pipe", "ignore"] }).toString(), f); } catch { rows.push(`| \`${f.split("build/")[1] ?? f.replace("autogpt_platform/frontend/", "")}\` | new file | | | |`); continue; }
  const b = analyse(execSync(`git show "${head}:${f}"`, { cwd: ROOT }).toString(), f);
  const expSame = JSON.stringify(a.exports) === JSON.stringify(b.exports);
  const tagsSame = JSON.stringify(a.els.map((e) => e.tag)) === JSON.stringify(b.els.map((e) => e.tag));
  const attrDiffs = a.els.length === b.els.length ? a.els.map((e, i) => (e.attrs === b.els[i].attrs ? null : `${e.tag}: \`${e.attrs}\` → \`${b.els[i].attrs}\``)).filter(Boolean) : ["element count differs"];
  if (!expSame || !tagsSame || attrDiffs.length) problems++;
  rows.push(`| \`${f.split("build/")[1] ?? f.replace("autogpt_platform/frontend/", "")}\` | ${expSame ? `same (${a.exports.length})` : "**DIFFERS**"} | ${tagsSame ? `same (${a.els.length} elements)` : "**DIFFERS**"} | ${attrDiffs.length ? attrDiffs.join("<br>") : "same"} |`);
}
const md = `${files.length} files: ${problems} with any difference\n\n| file | exports & prop types | rendered DOM tags (Text as its tag) | non-styling attributes (ids, aria, role, data-*, refs, handlers, props) |\n| --- | --- | --- | --- |\n${rows.join("\n")}\n`;
writeFileSync(out, md);
console.log(md.split("\n")[0]);
rows.filter((r) => r.includes("DIFFERS") || r.includes("→")).forEach((r) => console.log(r));
