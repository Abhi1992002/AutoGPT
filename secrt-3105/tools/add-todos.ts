// Reads lint hits (unix format) and inserts one `// TODO(tokens): ...` per
// source line, placed where a JS comment is legal:
// - the line starts in a JS/attribute context -> comment line above it;
// - the line opens a JSX tag (`<span className=...`) -> comment inside the
//   tag, right after the tag name, so JSX children are never touched.
import { readFileSync, writeFileSync } from "node:fs";
import ts from "../../autogpt_platform/frontend/node_modules/typescript";

const SHADOW = /^shadow-\[/;
const RARE = /(^|:)text-\[(5|6|9|17|23|26|35|36|48|64)px\]$|(^|:)text-\[[0-9.]+rem\]$/;
const hex: Record<string, string> = JSON.parse(readFileSync(process.argv[3], "utf8"));
const hits = readFileSync(process.argv[2], "utf8").split("\n").filter(Boolean);
const byFile = new Map<string, Map<number, Set<string>>>();
for (const h of hits) {
  const m = h.match(/^(.+?):(\d+):\d+: "([^"]+)"/);
  if (!m) continue;
  const [, file, line, cls] = m;
  if (SHADOW.test(cls)) continue;
  const lines = byFile.get(file) ?? new Map();
  byFile.set(file, lines);
  const set = lines.get(Number(line)) ?? new Set<string>();
  set.add(cls);
  lines.set(Number(line), set);
}
function reason(classes: string[]) {
  const rare = classes.filter((c) => RARE.test(c));
  const typo = classes.filter((c) => !rare.includes(c) && /(^|:)(text-\[[0-9.]+(px|rem|em)\]|leading-\[|tracking-\[|font-\[)/.test(c));
  const color = classes.filter((c) => !rare.includes(c) && !typo.includes(c));
  const parts: string[] = [];
  if (color.length) parts.push(`no exact role (${color.map((c) => (hex[c] ? `${c} ${hex[c]}` : c)).join(", ")})`);
  if (typo.length) parts.push(`no exact text token (${typo.join(", ")})`);
  if (rare.length) parts.push(`SECRT-3152 rare size (${rare.join(", ")})`);
  return `TODO(tokens): ${parts.join("; ")}`;
}
let inserted = 0;
for (const [file, lines] of byFile) {
  const src = readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const out = src.split("\n");
  const starts: number[] = [];
  { let p = 0; for (const l of out) { starts.push(p); p += l.length + 1; } }
  const nodeAt = (pos: number) => {
    let found: ts.Node = sf;
    const visit = (n: ts.Node) => { if (n.getStart(sf) <= pos && pos < n.getEnd()) { found = n; ts.forEachChild(n, visit); } };
    ts.forEachChild(sf, visit);
    return found;
  };
  const edits: { line: number; kind: "above" | "intag"; text: string }[] = [];
  for (const [line, classes] of lines) {
    const text = out[line - 1];
    const indent = text.match(/^\s*/)![0];
    const first = starts[line - 1] + indent.length;
    const n = nodeAt(first);
    // Inside a multi-line string/template that started on an earlier line: unsafe.
    if ((ts.isStringLiteral(n) || ts.isTemplateLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n) || ts.isTemplateHead(n) || n.kind === ts.SyntaxKind.JsxText) && n.getStart(sf) < first) {
      console.error(`UNSAFE ${file}:${line} (${n.kind})`); continue;
    }
    const tagOpen = /^<[A-Za-z]/.test(text.trimStart());
    edits.push({ line, kind: tagOpen ? "intag" : "above", text: reason([...classes]) });
  }
  edits.sort((a, b) => b.line - a.line);
  for (const e of edits) {
    const t = out[e.line - 1];
    const indent = t.match(/^\s*/)![0];
    if (e.kind === "above") out.splice(e.line - 1, 0, `${indent}// ${e.text}`);
    else {
      const m = t.match(/^(\s*<[A-Za-z][\w.]*)(\s+)(.*)$/);
      if (!m) { console.error(`NO TAG SPLIT ${file}:${e.line}`); continue; }
      out.splice(e.line - 1, 1, m[1], `${indent}  // ${e.text}`, `${indent}  ${m[3]}`);
    }
    inserted++;
  }
  writeFileSync(file, out.join("\n"));
}
console.log(`inserted ${inserted} TODO comments`);
