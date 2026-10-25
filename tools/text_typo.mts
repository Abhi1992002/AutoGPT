// Lists every <Text> whose className carries typography (size, leading, weight,
// family, tracking, style/decoration/case), with its variant/tone, and whether
// the className line is added relative to <base>.
//   npx tsx text_typo.mts <base> <file...>
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
const req = createRequire(join(process.cwd(), "package.json"));
const ts = req("typescript");
const TYPO = /^(?:[\w\-\[\]&>:=]+:)?!?(text-(?:xs|sm|base|lg|xl|\d?xl|body(?:-\w+)?|caption(?:-\w+)?|tiny|lead|title|heading(?:-\w+)?|display|\[[\d.]+(?:px|rem|em)\])|leading-\S+|font-(?:sans|mono|poppins|serif|thin|extralight|light|normal|medium|semibold|bold|extrabold|black)|tracking-\S+|italic|not-italic|uppercase|lowercase|capitalize|underline|line-through|no-underline)$/;
const [base, ...files] = process.argv.slice(2);
for (const f of files) {
  const src = readFileSync(f, "utf8");
  let added = new Set<number>();
  try {
    const d = execSync(`git diff -U0 ${base} -- "${f}"`, { cwd: process.cwd() }).toString();
    for (const m of d.matchAll(/^@@ -\S+ \+(\d+)(?:,(\d+))? @@/gm)) { const s = +m[1], n = m[2] === undefined ? 1 : +m[2]; for (let i = s; i < s + n; i++) added.add(i); }
  } catch {}
  const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const visit = (n: any) => {
    if ((ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) && n.tagName.getText(sf) === "Text") {
      const get = (name: string) => n.attributes.properties.find((a: any) => ts.isJsxAttribute(a) && a.name.getText(sf) === name);
      const c = get("className");
      if (c?.initializer) {
        const raw = c.initializer.getText(sf);
        const strs = [...raw.matchAll(/"([^"]*)"/g)].map((m) => m[1]).join(" ");
        const typo = strs.split(/\s+/).filter((k) => TYPO.test(k));
        if (typo.length) {
          const line = sf.getLineAndCharacterOfPosition(c.getStart(sf)).line + 1;
          const v = get("variant")?.initializer?.getText(sf), t = get("tone")?.initializer?.getText(sf), as = get("as")?.initializer?.getText(sf);
          console.log(`${added.has(line) ? "ADDED" : "old  "} ${f.replace(/.*\/build\//, "")}:${line} v=${v} t=${t ?? "-"} as=${as ?? "-"} typo=[${typo.join(" ")}] cls=${raw.replace(/\s+/g, " ").slice(0, 160)}`);
        }
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
}
