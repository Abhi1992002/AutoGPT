// Every TODO(tokens) comment is inert: each file compiled with comments
// removed equals the same file with every TODO(tokens) line stripped.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
const req = createRequire(join(process.cwd(), "package.json"));
const ts = req("typescript");
const compile = (src: string, f: string) =>
  ts.transpileModule(src, { fileName: f, compilerOptions: { jsx: ts.JsxEmit.React, removeComments: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText.replace(/\s+/g, " ");
const strip = (src: string) =>
  src.split("\n").filter((l) => !/^\s*(\/\/|\{\/\*)\s*TODO\(tokens\)/.test(l)).map((l) => l.replace(/\s*\/\/\s*TODO\(tokens\).*$/, "")).join("\n");
let bad = 0, n = 0;
for (const f of readFileSync(process.argv[2], "utf8").split("\n").filter(Boolean)) {
  const src = readFileSync(f, "utf8");
  if (!src.includes("TODO(tokens)")) continue;
  n++;
  if (compile(src, f) !== compile(strip(src), f)) { bad++; console.log("NOT INERT", f); }
}
console.log(`${n} files with TODO(tokens); ${bad} not inert`);
