// Usage: node usages.cjs <frontendDir> <Name> [<Name>...]  -> prints every JSX usage of the named components and its className expression
const path = require("path"), fs = require("fs");
const dir = process.argv[2]; const names = new Set(process.argv.slice(3));
const ts = require(require.resolve("typescript", { paths: [dir] }));
function walk(d, out) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (e.name !== "node_modules" && e.name !== "__generated__") walk(p, out); } else if (/\.tsx$/.test(e.name)) out.push(p); } return out; }
for (const file of walk(path.join(dir, "src"), [])) {
  const sf = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  (function visit(n) {
    if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) {
      const tag = n.tagName.getText(sf);
      if (names.has(tag)) {
        const attrs = n.attributes.properties.filter(a => ts.isJsxAttribute(a) && /className|class$/i.test(a.name.getText(sf)) || ts.isJsxSpreadAttribute(a));
        const { line } = sf.getLineAndCharacterOfPosition(n.getStart(sf));
        const txt = attrs.map(a => a.getText(sf).replace(/\s+/g, " ")).join(" | ") || "(no className)";
        console.log(`${path.relative(dir, file)}:${line + 1} <${tag}> ${txt}`);
      }
    }
    ts.forEachChild(n, visit);
  })(sf);
}
