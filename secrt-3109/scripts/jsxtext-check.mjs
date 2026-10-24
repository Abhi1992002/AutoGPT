// Fails if any JSX text node contains a comment marker, i.e. a `//` comment that would render as text.
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
const require = createRequire(process.cwd() + "/package.json");
const ts = require("typescript");
let bad = 0;
for (const file of process.argv.slice(2)) {
  if (!/\.tsx$/.test(file)) continue;
  const sf = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  (function walk(node) {
    if (node.kind === ts.SyntaxKind.JsxText && /\/\/|TODO/.test(node.getText())) {
      bad++; console.log(file, sf.getLineAndCharacterOfPosition(node.getStart()).line + 1, JSON.stringify(node.getText().trim()));
    }
    ts.forEachChild(node, walk);
  })(sf);
}
console.log(`${bad} JSX text node(s) with a comment marker`);
process.exitCode = bad ? 1 : 0;
