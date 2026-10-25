// QUALITY 43: every dark: class a PR removed reappears verbatim. Aligns the
// JSX elements of each file at <base> and in the working tree in document
// order (the parity check proves the counts match), aligns the string literals
// of each element's className in order, and appends to the head literal every
// dark: class the base literal had and the head literal lacks. An element
// whose className was dropped gets className="<the dark: classes>" back.
//   npx tsx restore_dark.mts <base> <file...>
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
const req = createRequire(join(process.cwd(), "package.json"));
const ts = req("typescript");
const [base, ...files] = process.argv.slice(2);
const ROOT = execSync("git rev-parse --show-toplevel").toString().trim();

function elements(src: string, f: string) {
  const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const out: { node: any; lits: any[]; cls: any; sf: any }[] = [];
  const visit = (n: any) => {
    if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) {
      const c = n.attributes.properties.find((a: any) => ts.isJsxAttribute(a) && a.name.getText(sf) === "className");
      const lits: any[] = [];
      const collect = (x: any) => { if (ts.isStringLiteral(x) || ts.isNoSubstitutionTemplateLiteral(x)) lits.push(x); ts.forEachChild(x, collect); };
      if (c?.initializer) collect(c.initializer);
      out.push({ node: n, lits, cls: c, sf });
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
}
const darkOf = (s: string) => s.split(/\s+/).filter((k) => /(^|:)dark:/.test(k) || k.startsWith("dark:"));

let restored = 0;
const manual: string[] = [];
for (const f of files) {
  const rel = f.startsWith("/") ? f.slice(ROOT.length + 1) : join("autogpt_platform/frontend", f);
  let baseSrc: string;
  try { baseSrc = execSync(`git show "${base}:${rel}"`, { cwd: ROOT, stdio: ["pipe", "pipe", "ignore"] }).toString(); } catch { continue; }
  if (!baseSrc.includes("dark:")) continue;
  let src = readFileSync(f, "utf8");
  const a = elements(baseSrc, f), b = elements(src, f);
  if (a.length !== b.length) { manual.push(`${f}: ${a.length} vs ${b.length} JSX elements`); continue; }
  const edits: { at: number; end: number; text: string }[] = [];
  a.forEach((x, i) => {
    const y = b[i];
    const want = x.lits.map((l: any) => darkOf(l.text));
    if (!want.some((w: string[]) => w.length)) return;
    if (!y.cls) {
      const all = want.flat();
      edits.push({ at: y.node.tagName.getEnd(), end: y.node.tagName.getEnd(), text: ` className="${all.join(" ")}"` });
      restored += all.length;
      console.log(`ADD  ${f}:${y.sf.getLineAndCharacterOfPosition(y.node.getStart(y.sf)).line + 1} className="${all.join(" ")}"`);
      return;
    }
    if (x.lits.length !== y.lits.length) { manual.push(`${f}:${y.sf.getLineAndCharacterOfPosition(y.node.getStart(y.sf)).line + 1}: ${x.lits.length} vs ${y.lits.length} literals, wants ${want.flat().join(" ")}`); return; }
    want.forEach((w: string[], k: number) => {
      const lit = y.lits[k];
      const have = new Set(lit.text.split(/\s+/));
      const miss = w.filter((d) => !have.has(d));
      if (!miss.length) return;
      const q = lit.getText(y.sf)[0];
      const text = `${q}${[lit.text.trim(), ...miss].filter(Boolean).join(" ")}${q}`;
      edits.push({ at: lit.getStart(y.sf), end: lit.getEnd(), text });
      restored += miss.length;
      console.log(`KEEP ${f}:${y.sf.getLineAndCharacterOfPosition(lit.getStart(y.sf)).line + 1} + ${miss.join(" ")}`);
    });
  });
  for (const e of edits.sort((p, q) => q.at - p.at)) src = src.slice(0, e.at) + e.text + src.slice(e.end);
  if (edits.length) writeFileSync(f, src);
}
console.log(`${restored} dark: classes restored; ${manual.length} for hand work`);
manual.forEach((m) => console.log(`MANUAL ${m}`));
