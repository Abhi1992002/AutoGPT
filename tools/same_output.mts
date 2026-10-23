// Compiles every changed file at origin/dev and at the working tree with
// TypeScript to React.createElement calls (comments dropped, JSX text and
// whitespace resolved the way React sees them), applies this PR's
// class-string pairs to the old output, and requires it to equal the new one.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
const FE = "/home/vercel-sandbox/autogpt/autogpt_platform/frontend";
const req = createRequire(join(FE, "package.json"));
const ts = req("typescript");
const files = execSync("git diff --name-only 447fd55be HEAD -- 'autogpt_platform/frontend/src'", { cwd: "/home/vercel-sandbox/autogpt" }).toString().split("\n").filter(Boolean);
const pairs = JSON.parse(readFileSync(process.argv[2], "utf8")).pairs as { file: string; old: string; new: string }[];
const STYLE_EDITS: [string, string, string][] = [
  ["CategoryChip/CategoryChip.tsx", "%, #18181b)`", "%, rgb(var(--color-secondary-foreground)))`"],
  ["CategoryChip/CategoryChip.tsx", "${isSelected ? 30 : 12}%, white)`", "${isSelected ? 30 : 12}%, rgb(var(--color-card)))`"],
  ["CategoryChip/CategoryChip.tsx", "rgba(255,255,255,0.8), rgba(255,255,255,0) 65%)", "rgb(var(--color-card) / 0.8), rgb(var(--color-card) / 0) 65%)"],
  ["CategoryChip/CategoryTag.tsx", "55%, #18181b)`", "55%, rgb(var(--color-secondary-foreground)))`"],
  ["CategoryChip/CategoryTag.tsx", "12%, white)`", "12%, rgb(var(--color-card)))`"],
  ["ExpertBudgetSection.tsx", "55%, #18181b)`", "55%, rgb(var(--color-secondary-foreground)))`"],
  ["SpendMeter.tsx", "45%, white)`", "45%, rgb(var(--color-card)))`"],
  ["SpendMeter.tsx", "60%, #18181b)`", "60%, rgb(var(--color-primary)))`"],
  ["ExpertPageHeader.tsx", "45%, white), transparent 55%)", "45%, rgb(var(--color-card))), transparent 55%)"],
  ["ExpertPageHeader.tsx", "35%, white), transparent 50%)", "35%, rgb(var(--color-card))), transparent 50%)"],
];
let bad = 0;
const compile = (src: string, f: string) =>
  ts.transpileModule(src, {
    fileName: f,
    compilerOptions: { jsx: ts.JsxEmit.React, removeComments: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText;
for (const f of files) {
  const oldSrc = execSync(`git show "447fd55be:${f}"`, { cwd: "/home/vercel-sandbox/autogpt" }).toString();
  const newSrc = readFileSync(join("/home/vercel-sandbox/autogpt", f), "utf8");
  let oldOut = compile(oldSrc, f);
  const newOut = compile(newSrc, f);
  const rel = f.replace("autogpt_platform/frontend/", "");
  for (const p of pairs.filter((p) => p.file === rel)) oldOut = oldOut.replace(p.old, p.new);
  // Inline-style value edits, proven separately by style-equivalence.mts.
  for (const [file, from, to] of STYLE_EDITS) if (rel.endsWith(file)) oldOut = oldOut.split(from).join(to);
  // Whitespace outside string and template literals is insignificant in the
  // compiled JS (JSX text is already a string literal); literals stay exact.
  const toks = (code: string) => {
    const out: string[] = [];
    let i = 0;
    while (i < code.length) {
      const ch = code[i];
      if (ch === '"' || ch === "'" || ch === "`") {
        let j = i + 1;
        while (j < code.length && code[j] !== ch) j += code[j] === "\\" ? 2 : 1;
        out.push(code.slice(i, j + 1));
        i = j + 1;
      } else {
        if (!/\s/.test(ch)) out.push(ch);
        i++;
      }
    }
    return out;
  };
  // A trailing comma before a closing bracket is syntactically inert.
  const dropTrailingCommas = (t: string[]) => t.filter((x, k) => !(x === "," && ["}", "]", ")"].includes(t[k + 1])));
  const ta = dropTrailingCommas(toks(oldOut)), tb = dropTrailingCommas(toks(newOut));
  if (ta.join("\u0000") !== tb.join("\u0000")) {
    bad++;
    const i = ta.findIndex((t, k) => t !== tb[k]);
    console.log(`DIFF ${rel}\n  old: ${ta.slice(i - 3, i + 3).join(" ")}\n  new: ${tb.slice(i - 3, i + 3).join(" ")}`);
  }
}
console.log(`${files.length} files compiled; ${bad} differ beyond their class strings (token streams compared, whitespace ignored, string literals exact)`);
