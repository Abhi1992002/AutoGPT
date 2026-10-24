// Usage: node slot-coverage.cjs <frontendDir> <file...>
// Lists every element an organism renders itself (lowercase host tags,
// motion.*, next/link Link, next/image Image) that has no data-slot, every
// data-slot placed on a capitalised component, and duplicate-free slug stats.
const ts = require(require.resolve("typescript", { paths: [process.argv[2]] }));
const fs = require("node:fs");
const [, , dir, ...files] = process.argv;
let hosts = 0, missing = 0, onComponent = 0; const slugs = new Map();
const SVG_CHILD = new Set(["path","circle","g","rect","line","polyline","polygon","defs","linearGradient","stop","clipPath","mask","use","ellipse"]);
for (const f of files) {
  const src = fs.readFileSync(f, "utf8");
  const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const nextNames = new Set();
  sf.statements.forEach((s) => {
    if (ts.isImportDeclaration(s) && /^next\/(link|image)$/.test(s.moduleSpecifier.text) && s.importClause?.name) nextNames.add(s.importClause.name.text);
  });
  const visit = (node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(sf);
      const isHost = (/^[a-z]/.test(tag) && !SVG_CHILD.has(tag)) || tag.startsWith("motion.") || nextNames.has(tag);
      const slot = node.attributes.properties.find((p) => ts.isJsxAttribute(p) && p.name.getText(sf) === "data-slot");
      if (slot) { const v = slot.initializer.getText(sf); slugs.set(v, (slugs.get(v) || 0) + 1); }
      if (isHost) { hosts++; if (!slot) { missing++; console.log(`MISSING ${f}:${sf.getLineAndCharacterOfPosition(node.getStart()).line + 1} <${tag}>`); } }
      else if (slot) { onComponent++; console.log(`ON COMPONENT ${f}: <${tag}> ${slot.initializer.getText(sf)}`); }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
}
const reserved = /^"(input-group|button-group|select-trigger|button|input|dialog|menu|tabs|text|card|badge|tooltip|popover|sheet|select)(-|")/;
const clash = [...slugs.keys()].filter((s) => reserved.test(s));
console.log(`host elements=${hosts} missing=${missing} slot-on-component=${onComponent} distinct slugs=${slugs.size} reserved-name clashes=${clash.join(",") || 0}`);
