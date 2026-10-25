// Rule 32: a <Text> className keeps layout, shape and colour only. Moves the
// leading/weight/family/tracking of each <Text> into the variant that renders
// the same merged class set, colours that a tone holds onto `tone`, and drops
// classes that only repeat the variant. Only the combinations in MAP are
// rewritten; anything else is printed for a hand decision.
//   npx tsx text_rule32.mts <file...>
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
const req = createRequire(join(process.cwd(), "package.json"));
const ts = req("typescript");
const { variants, variantElementMap } = await import(join(process.cwd(), "src/components/atoms/Text/helpers.ts"));

// [variant, typography classes (sorted)] -> new variant
const MAP: Record<string, string> = {
  "body|leading-5": "body-tight",
  "body|font-semibold leading-5": "body-semibold-tight",
  "small|leading-4": "small-tight",
  "small|font-mono leading-4": "small-mono-tight",
  "small-medium|leading-4": "small-medium-tight",
  "small|leading-5": "small-loose",
  "small-medium|leading-5": "small-medium-loose",
  "small|leading-relaxed": "small-relaxed",
  "large-medium|leading-6": "large-medium-tight",
  "body-medium|font-mono leading-4 text-caption": "small-medium-mono-tight",
  "h3|tracking-tight": "h3-tracking-tight",
  "body|!font-semibold": "body-semibold",
  "body-medium|!font-semibold": "body-semibold",
  "small-medium|!font-semibold": "small-semibold",
  "small|!font-semibold": "small-semibold",
  "small|!font-medium": "small-medium",
  "body-tight|italic": "body-tight-italic",
  "small-medium-loose|underline": "small-medium-loose-underline",
};
// Kept on className: not size, line-height, weight, family or tracking.
const KEEP = new Set<string>(["line-through"]);
const TYPO = /^!?(text-(?:xs|sm|base|lg|xl|body|caption|tiny|lead)|leading-\S+|font-(?:sans|mono|poppins|normal|medium|semibold|bold)|tracking-\S+|italic|underline|line-through)$/;
const TONE: Record<string, string> = { "text-inherit": "inherit", "text-warning-foreground": "warning", "text-success": "success", "text-foreground-secondary": "secondary", "text-foreground-tertiary": "muted", "text-foreground-subtle": "subtle", "text-foreground-emphasis": "emphasis", "text-foreground-body": "body", "text-foreground-strong": "primary" };

for (const f of process.argv.slice(2)) {
  let src = readFileSync(f, "utf8");
  const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits: { start: number; end: number; text: string }[] = [];
  const visit = (n: any) => {
    if ((ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) && n.tagName.getText(sf) === "Text") {
      const attr = (name: string) => n.attributes.properties.find((a: any) => ts.isJsxAttribute(a) && a.name.getText(sf) === name);
      const v = attr("variant"), c = attr("className"), t = attr("tone"), as = attr("as");
      const where = `${f.replace(/.*\/build\//, "")}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1}`;
      let lit: any = c?.initializer && ts.isStringLiteral(c.initializer) ? c.initializer : null;
      if (!lit && c?.initializer && ts.isJsxExpression(c.initializer)) {
        const e = c.initializer.expression;
        if (e && ts.isCallExpression(e) && e.expression.getText(sf) === "cn" && e.arguments.length === 1 && ts.isStringLiteral(e.arguments[0])) lit = e.arguments[0];
      }
      const vLit = v?.initializer && ts.isStringLiteral(v.initializer) ? v.initializer : null;
      if (!lit || !vLit) { ts.forEachChild(n, visit); return; }
      const classes = lit.text.split(/\s+/).filter(Boolean);
      const typo = classes.filter((k: string) => TYPO.test(k));
      const moving = typo.filter((k: string) => !KEEP.has(k));
      if (!moving.length) { ts.forEachChild(n, visit); return; }
      const key = `${vLit.text}|${[...moving].sort().join(" ")}`;
      const nv = MAP[key];
      if (!nv) { console.log(`SKIP ${where} ${key} :: ${lit.text}`); ts.forEachChild(n, visit); return; }
      let rest = classes.filter((k: string) => !moving.includes(k));
      let tone = t?.initializer && ts.isStringLiteral(t.initializer) ? t.initializer.text : undefined;
      if (!tone) {
        const col = rest.find((k: string) => TONE[k]);
        if (col) { tone = TONE[col]; rest = rest.filter((k: string) => k !== col); }
      }
      if (!tone) rest = rest.filter((k: string) => k !== "text-foreground-base");
      // the variant's default element must not change the rendered tag
      const oldTag = as ? null : (variantElementMap as any)[vLit.text];
      const newTag = (variantElementMap as any)[nv];
      if (!(nv in variants)) throw new Error(`no variant ${nv}`);
      edits.push({ start: vLit.getStart(sf), end: vLit.getEnd(), text: `"${nv}"` });
      if (oldTag && oldTag !== newTag) edits.push({ start: v.getEnd(), end: v.getEnd(), text: ` as="${oldTag}"` });
      if (tone && !t) edits.push({ start: v.getEnd(), end: v.getEnd(), text: ` tone="${tone}"` });
      if (rest.length) edits.push({ start: lit.getStart(sf), end: lit.getEnd(), text: `"${rest.join(" ")}"` });
      else edits.push({ start: c.getFullStart(), end: c.getEnd(), text: "" });
      console.log(`OK   ${where} ${vLit.text} -> ${nv}${tone && !t ? ` tone=${tone}` : ""}${oldTag && oldTag !== newTag ? ` as=${oldTag}` : ""} :: "${lit.text}" -> "${rest.join(" ")}"`);
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  for (const e of edits.sort((a, b) => b.start - a.start || b.end - a.end)) src = src.slice(0, e.start) + e.text + src.slice(e.end);
  if (edits.length) writeFileSync(f, src);
}
