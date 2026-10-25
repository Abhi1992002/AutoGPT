import { execSync } from "node:child_process";
import ts from "typescript";
const [base, head] = process.argv.slice(2);
const files = execSync(
  `git diff --relative=autogpt_platform/frontend --name-only ${base} ${head} -- src/components/ai-elements`,
  { encoding: "utf8" },
)
  .trim()
  .split("\n");
function shape(src: string, name: string) {
  const sf = ts.createSourceFile(
    name,
    src,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const blank = (ctx: ts.TransformationContext) => (root: ts.Node) => {
    const visit = (n: ts.Node): ts.Node => {
      if (ts.isStringLiteral(n)) return ts.factory.createStringLiteral("");
      if (ts.isNoSubstitutionTemplateLiteral(n))
        return ts.factory.createNoSubstitutionTemplateLiteral("");
      if (ts.isJsxText(n)) return n;
      return ts.visitEachChild(n, visit, ctx);
    };
    return ts.visitNode(root, visit);
  };
  const out = ts.transform(sf, [blank]).transformed[0] as ts.SourceFile;
  // Normalise only what React ignores: empty {} left by a {/* comment */}
  // and whitespace-only JSX text between tags.
  return ts
    .createPrinter({ removeComments: true })
    .printFile(out)
    .replace(/\{\s*\}/g, "")
    .replace(/>\s+</g, "><")
    .replace(/>\s+\{/g, ">{")
    .replace(/\}\s+</g, "}<");
}
let same = true;
for (const f of files) {
  const a = execSync(`git show ${base}:autogpt_platform/frontend/${f}`, {
    encoding: "utf8",
  });
  const b = execSync(`git show ${head}:autogpt_platform/frontend/${f}`, {
    encoding: "utf8",
  });
  const ok = shape(a, f) === shape(b, f);
  same &&= ok;
  console.log(
    `${f}: ${ok ? "identical once string literals and comments are blanked" : "DIFFERS"}`,
  );
}
process.exitCode = same ? 0 : 1;
