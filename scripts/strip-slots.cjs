// Usage: node strip-slots.cjs <frontendDir> <baseRef> <file...>
// Serialises each file's TypeScript AST to a canonical form with every
// data-slot JSX attribute removed, JSX text cleaned the way the JSX transform
// cleans it, and adjacent JSX text / string-literal children merged (so a
// prettier re-wrap like `</strong> of` -> `</strong>{" "}of` compares equal).
// Base and head must serialise identically. Also counts data-slot attributes.
const ts = require(require.resolve("typescript", { paths: [process.argv[2]] }));
const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const [dir, baseRef, ...files] = process.argv.slice(2);
const root = execSync("git rev-parse --show-toplevel", { cwd: dir }).toString().trim();

function cleanJsxText(raw) {
  const lines = raw.split(/\r\n|\n|\r/);
  let out = "";
  lines.forEach((line, i) => {
    let l = line.replace(/\t/g, " ");
    if (i !== 0) l = l.replace(/^[ ]+/, "");
    if (i !== lines.length - 1) l = l.replace(/[ ]+$/, "");
    if (l) out += (out ? " " : "") + l;
  });
  return out;
}

function serialise(src, name, counter) {
  const sf = ts.createSourceFile(name, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function textOf(child) {
    if (ts.isJsxText(child)) return cleanJsxText(child.text);
    if (ts.isJsxExpression(child) && child.expression && (ts.isStringLiteral(child.expression) || ts.isNoSubstitutionTemplateLiteral(child.expression))) return child.expression.text;
    return null;
  }
  function ser(node) {
    if (ts.isJsxAttribute(node) && node.name.getText(sf) === "data-slot") { counter.n++; return null; }
    if (ts.isJsxText(node)) return JSON.stringify(cleanJsxText(node.text));
    // Prettier wraps multi-line JSX in parentheses; they do not change the tree.
    if (ts.isParenthesizedExpression(node)) return ser(node.expression);
    const kind = ts.SyntaxKind[node.kind];
    const kids = node.getChildren(sf);
    if (kids.length === 0) return node.getText(sf);
    if (node.kind === ts.SyntaxKind.SyntaxList && kids.some((k) => ts.isJsxText(k) || ts.isJsxElement(k) || ts.isJsxSelfClosingElement(k) || ts.isJsxExpression(k) || ts.isJsxFragment(k))) {
      const parts = []; let buf = null;
      for (const k of kids) {
        const t = textOf(k);
        if (t !== null) { buf = (buf ?? "") + t; continue; }
        if (buf !== null) { if (buf) parts.push(JSON.stringify(buf)); buf = null; }
        const s = ser(k); if (s !== null) parts.push(s);
      }
      if (buf) parts.push(JSON.stringify(buf));
      return `${kind}(${parts.join(",")})`;
    }
    const parts = kids.map(ser).filter((s) => s !== null);
    if (node.kind === ts.SyntaxKind.SyntaxList && parts.length === 0) return null;
    return `${kind}(${parts.join(",")})`;
  }
  return ser(sf);
}

let bad = 0, added = 0;
for (const f of files) {
  const abs = path.resolve(dir, f);
  const rel = path.relative(root, abs);
  const head = fs.readFileSync(abs, "utf8");
  let base;
  try { base = execSync(`git show ${baseRef}:${rel}`, { cwd: root, maxBuffer: 1 << 26 }).toString(); }
  catch { console.log(`NEW FILE ${rel}`); bad++; continue; }
  const cb = { n: 0 }, ch = { n: 0 };
  const a = serialise(base, f, cb), b = serialise(head, f, ch);
  added += ch.n - cb.n;
  if (a !== b) { bad++; console.log(`DIFFERS beyond data-slot: ${rel}`); }
}
console.log(`files=${files.length} differing=${bad} data-slot added=${added}`);
process.exit(bad ? 1 : 0);
