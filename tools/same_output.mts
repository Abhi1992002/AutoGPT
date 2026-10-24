// Compiles every changed file at <base> and in the working tree with
// TypeScript (comments dropped, JSX resolved to createElement calls, JSX
// text trimmed the way React sees it) and diffs the token streams. A hunk
// where one string literal became another is a class-string change (proven by
// the equivalence tables); every other hunk is printed for review.
//
//   npx tsx same_output.mts <base-sha> <pathspec>
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
const ROOT = "/home/vercel-sandbox/autogpt";
const req = createRequire(join(process.cwd(), "package.json"));
const ts = req("typescript");
const [base, spec] = process.argv.slice(2);
const files = execSync(`git diff --name-only ${base} -- '${spec}'`, { cwd: ROOT }).toString().split("\n").filter((f) => /\.(ts|tsx)$/.test(f));
const compile = (src: string, f: string) =>
  ts.transpileModule(src, { fileName: f, compilerOptions: { jsx: ts.JsxEmit.React, removeComments: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
function toks(code: string) {
  const out: string[] = [];
  let i = 0;
  while (i < code.length) {
    const ch = code[i];
    if (ch === '"' || ch === "'" || ch === "`") {
      let j = i + 1;
      while (j < code.length && code[j] !== ch) j += code[j] === "\\" ? 2 : 1;
      out.push(code.slice(i, j + 1));
      i = j + 1;
    } else if (/\s/.test(ch)) i++;
    else if (/[\w$]/.test(ch)) {
      let j = i;
      while (j < code.length && /[\w$]/.test(code[j])) j++;
      out.push(code.slice(i, j));
      i = j;
    } else { out.push(ch); i++; }
  }
  return out.filter((x, k, t) => !(x === "," && ["}", "]", ")"].includes(t[k + 1])));
}
// Myers-free LCS on tokens via diff of joined lines.
function hunks(a: string[], b: string[]) {
  const n = a.length, m = b.length;
  const res: { a: string[]; b: string[] }[] = [];
  let i = 0, j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) { i++; j++; continue; }
    // find the nearest resync point
    let best: [number, number] | null = null;
    for (let d = 1; d < 400 && !best; d++) {
      for (let x = 0; x <= d; x++) {
        const y = d - x;
        if (i + x < n && j + y < m && a[i + x] === b[j + y] && a[i + x + 1] === b[j + y + 1] && a[i + x + 2] === b[j + y + 2]) { best = [i + x, j + y]; break; }
      }
    }
    const [ni, nj] = best ?? [n, m];
    res.push({ a: a.slice(i, ni), b: b.slice(j, nj) });
    i = ni; j = nj;
  }
  return res;
}
let other = 0, classOnly = 0, textConv = 0;
for (const f of files) {
  let oldSrc = "";
  try { oldSrc = execSync(`git show "${base}:${f}"`, { cwd: ROOT, stdio: ["pipe", "pipe", "ignore"] }).toString(); } catch { console.log(`NEW FILE ${f}`); continue; }
  const newSrc = readFileSync(join(ROOT, f), "utf8");
  const hs = hunks(toks(compile(oldSrc, f)), toks(compile(newSrc, f)));
  for (const h of hs) {
    const isStr = (t: string[]) => t.every((x) => /^["'`]/.test(x) || ["+", ",", "(", ")"].includes(x));
    if (isStr(h.a) && isStr(h.b)) { classOnly++; continue; }
    // <tag className="x"> -> <Text variant="v" as="tag" className="y">, checked by the Text table.
    const ja = h.a.join(" "), jb = h.b.join(" ");
    if (/^"(p|span|div|li)" , \{( className : "[^"]*")?$/.test(ja) && /^Text , \{ variant : "[\w-]+" ,( as : "\w+" ,)? className : "[^"]*"$/.test(jb)) { textConv++; continue; }
    if (ja === "" && /^import \{ Text \} from "@\/components\/atoms\/Text\/Text" ;$/.test(jb)) { textConv++; continue; }
    other++;
    console.log(`HUNK ${f.replace(/.*\/build\//, "build/")}\n  - ${h.a.join(" ").slice(0, 300)}\n  + ${h.b.join(" ").slice(0, 300)}`);
  }
}
console.log(`${files.length} files compiled; ${classOnly} string-literal hunks (class strings); ${textConv} Text-atom hunks; ${other} other hunks`);
