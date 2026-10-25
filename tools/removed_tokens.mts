// QUALITY 46: every class token a commit removes from an element's className,
// and where it comes from now: the <Text> variant or tone the element became,
// the <Text> it now wraps its copy in, the atom's own classes, or a raw class
// kept in its place (QUALITY 41). Anything else is reported as DROPPED.
// Elements are aligned per file on their copy (LCS), as text_pairs.mts does.
//   npx tsx removed_tokens.mts <base sha> <head sha> <out.md>   (cwd: head's frontend)
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
const ROOT = "/home/vercel-sandbox/autogpt", FE = "autogpt_platform/frontend/";
const req = createRequire(join(process.cwd(), "package.json"));
const ts = req("typescript");
const { cn } = await import(join(process.cwd(), "src/lib/utils.ts"));
const { variants, tones } = await import(join(process.cwd(), "src/components/atoms/Text/helpers.ts"));
const { extendedButtonVariants } = await import(join(process.cwd(), "src/components/atoms/Button/helpers.ts"));
const { buttonVariants } = await import(join(process.cwd(), "src/components/__legacy__/ui/button.tsx"));
const [base, head, out] = process.argv.slice(2);
const KEPT_RAW: Record<string, string> = { "bg-surface-active": "bg-zinc-200", "bg-surface-hover": "bg-zinc-100", "active:bg-surface-hover": "active:bg-zinc-100", "!text-brand": "!text-purple-500", "!text-info": "!text-blue-500" };
interface El { tag: string; variant?: string; tone?: string; labelVariant?: string; toks: string[]; line: number; text: string; legacyButton: boolean; atomButton: boolean; btnVariant?: string; btnSize?: string; parentIdx: number }
function elements(src: string, f: string) {
  const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const legacy = /from "@\/components\/__legacy__\/ui\/button"/.test(src), atom = /from "@\/components\/atoms\/Button\/Button"/.test(src);
  const els: El[] = []; const stack: number[] = [];
  const hasJsx = (x: any): boolean => ts.isJsxElement(x) || ts.isJsxSelfClosingElement(x) || ts.isJsxFragment(x) || !!ts.forEachChild(x, (c: any) => hasJsx(c) || undefined);
  const lit = (a: any) => { const out: string[] = []; const c = (x: any) => { if (ts.isStringLiteral(x) || ts.isNoSubstitutionTemplateLiteral(x)) out.push(x.text); else if (ts.isTemplateExpression(x)) { out.push(x.head.text); x.templateSpans.forEach((s: any) => out.push(s.literal.text)); } ts.forEachChild(x, c); }; if (a?.initializer) c(a.initializer); return out.join(" ").split(/\s+/).filter(Boolean); };
  function visit(n: any) {
    if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) {
      const get = (name: string) => n.attributes.properties.find((p: any) => ts.isJsxAttribute(p) && p.name.getText(sf) === name);
      const str = (name: string) => { const a = get(name); return a?.initializer && ts.isStringLiteral(a.initializer) ? a.initializer.text : a?.initializer && ts.isJsxExpression(a.initializer) && a.initializer.expression && ts.isStringLiteral(a.initializer.expression) ? a.initializer.expression.text : undefined; };
      const text: string[] = [];
      const grab = (x: any) => { if (ts.isJsxAttributes(x)) return; if (ts.isJsxText(x)) text.push(x.getText(sf)); else if (ts.isJsxExpression(x) && x.expression && !hasJsx(x.expression)) text.push(x.expression.getText(sf)); else ts.forEachChild(x, grab); };
      if (ts.isJsxOpeningElement(n)) n.parent.children.forEach(grab);
      const tag = n.tagName.getText(sf);
      els.push({ tag, variant: str("variant"), tone: str("tone"), labelVariant: str("labelVariant"), toks: [...lit(get("className")), ...lit(get("labelClassName"))], line: sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1, text: text.join(" ").replace(/\s+/g, " ").trim(), legacyButton: tag === "Button" && legacy, atomButton: tag === "Button" && atom, btnVariant: str("variant"), btnSize: str("size"), parentIdx: stack.length ? stack[stack.length - 1] : -1 });
      if (ts.isJsxOpeningElement(n)) { stack.push(els.length - 1); n.parent.children.forEach(visit); stack.pop(); }
      return;
    }
    if (ts.isJsxElement(n)) { visit(n.openingElement); return; }
    ts.forEachChild(n, visit);
  }
  visit(sf);
  return els;
}
const ATOM: Record<string, string> = {
  SheetDescription: "text-body leading-5 text-neutral-500 dark:text-neutral-400",
  SheetTitle: "text-lg font-semibold text-neutral-950 dark:text-neutral-50",
  Label: "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
};
const files = execSync(`git diff --name-only ${base}..${head} -- '${FE}src'`, { cwd: ROOT }).toString().split("\n").filter((f) => f.endsWith(".tsx"));
const rows: string[] = []; let dropped = 0, total = 0;
for (const f of files) {
  let a: El[];
  try { a = elements(execSync(`git show "${base}:${f}"`, { cwd: ROOT, stdio: ["pipe", "pipe", "ignore"] }).toString(), f); } catch { continue; }
  const b = elements(execSync(`git show "${head}:${f}"`, { cwd: ROOT }).toString(), f);
  const key = (e: El) => e.text;
  const L = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) L[i][j] = key(a[i]) === key(b[j]) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const matches: [number, number][] = [];
  for (let i = 0, j = 0; i < a.length && j < b.length; ) {
    if (key(a[i]) === key(b[j]) && L[i][j] === L[i + 1][j + 1] + 1) { matches.push([i, j]); i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++;
  }
  const matchedB = new Set(matches.map(([, j]) => j));
  for (const [i, j] of matches) {
    {
      const x = a[i], y = b[j];
      const removed = x.toks.filter((t) => !y.toks.includes(t));
      if (!removed.length) continue;
      const child = b.find((e, k) => e.parentIdx === j && e.tag === "Text" && !matchedB.has(k));
      const where = removed.map((t) => {
        total++;
        // An important size beat the element's own size; on the <Text> that now
        // holds the copy nothing competes, so the plain class is the same.
        const bare = t.replace(/^!/, ""), bang = bare !== t ? " (the `!` only beat the element's own size, which no longer styles this copy)" : "";
        if (y.labelVariant && variants[y.labelVariant]?.split(" ").includes(bare)) return `\`${t}\` → \`labelVariant="${y.labelVariant}"\` (its label renders through \`<Text>\`)`;
        if (y.tag === "Text" && y.variant && variants[y.variant]?.split(" ").includes(bare)) return `\`${t}\` → variant \`${y.variant}\`${bang}`;
        if (y.tag === "Text" && y.tone && tones[y.tone] === t) return `\`${t}\` → tone \`${y.tone}\``;
        if (child?.variant && variants[child.variant]?.split(" ").includes(bare)) return `\`${t}\` → the \`<Text variant="${child.variant}">\` it wraps${bang}`;
        if (child?.tone && tones[child.tone] === t) return `\`${t}\` → that \`<Text>\`'s tone \`${child.tone}\``;
        const par = y.parentIdx >= 0 ? b[y.parentIdx] : undefined;
        if (par?.tag === "Text" && par.variant && variants[par.variant]?.split(" ").includes(bare)) return `\`${t}\` → the \`<Text variant="${par.variant}">\` around it (inherited)`;
        if (KEPT_RAW[t] && y.toks.includes(KEPT_RAW[t])) return `\`${t}\` → kept raw as \`${KEPT_RAW[t]}\` (QUALITY 41)`;
        const atomCls = y.atomButton ? cn(extendedButtonVariants({ variant: y.btnVariant as any, size: y.btnSize as any })) : y.legacyButton ? cn(buttonVariants({ variant: y.btnVariant as any, size: y.btnSize as any })) : ATOM[y.tag] ?? (x.tag !== y.tag && ATOM[x.tag] ? "" : "");
        if (atomCls.split(" ").includes(t)) return `\`${t}\` → the ${y.legacyButton ? "legacy " : ""}\`<${y.tag}${y.btnVariant ? ` variant="${y.btnVariant}"` : ""}>\`'s own classes`;
        dropped++; return `\`${t}\` → **DROPPED**`;
      });
      rows.push(`| \`${f.replace(/.*\/src\//, "")}:${y.line}\` | \`<${x.tag}>\` → \`<${y.tag}${y.variant ? ` variant="${y.variant}"` : ""}${y.tone ? ` tone="${y.tone}"` : ""}>\`${child ? ` wrapping a new \`<Text variant="${child.variant}"${child.tone ? ` tone="${child.tone}"` : ""}>\`` : ""} | ${where.join("; ")} |`);
    }
  }
}
const head1 = `${total} class tokens removed from ${rows.length} elements between \`${base}\` and \`${head}\`: ${total - dropped} come from somewhere else now, ${dropped} dropped`;
writeFileSync(out, `${head1}\n\n| element (head) | element | each removed token → where it comes from now |\n| --- | --- | --- |\n${rows.join("\n")}\n`);
console.log(head1); rows.filter((r) => r.includes("DROPPED")).forEach((r) => console.log(r));
