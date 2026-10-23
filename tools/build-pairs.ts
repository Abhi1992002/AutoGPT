// Turns extract_pairs.py output into harness pairs. <Text> pairs become the
// class list Text renders: cn(variants[variant], tones[tone], className),
// with the base checkout's Text helpers for old and this checkout's for new.
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const CLASSY = /^[!a-zA-Z0-9:\-[\]./_&%(),#>*=@'~+ ]+$/;
const TONE_NAMES = new Set(["primary", "secondary", "muted", "danger"]);

async function main() {
  const [input, baseArg, out] = process.argv.slice(2);
  const head = process.cwd();
  const { cn } = await import(join(head, "src/lib/utils.ts"));
  const helpers = (dir: string) => import(join(dir, "src/components/atoms/Text/helpers.ts"));
  const oldH = await helpers(resolve(baseArg));
  const newH = await helpers(head);
  const { pairs, extras } = JSON.parse(readFileSync(input, "utf8"));
  const seen = new Set<string>();
  const result: unknown[] = [];
  const push = (p: { file: string; kind: string; old: { cls: string; style?: string }; new: { cls: string; style?: string }; note?: string }) => {
    const key = JSON.stringify([p.old, p.new]);
    if (seen.has(key)) return;
    seen.add(key);
    result.push(p);
  };
  for (const p of pairs) {
    if (p.kind === "literal") {
      if (!CLASSY.test(p.old) || !CLASSY.test(p.new) || TONE_NAMES.has(p.new)) continue;
      // Text variant names are props, not classes; the text pair covers them.
      if (p.old in newH.variants && p.new in newH.variants) continue;
      push({ file: p.file, kind: "literal", old: { cls: p.old }, new: { cls: p.new } });
    } else {
      const render = (h: typeof oldH, t: { variant: string; tone: string | null; cls: string }) =>
        cn(h.variants[t.variant], t.tone && h.tones[t.tone], t.cls);
      push({ file: p.file, kind: "text", note: `<Text variant="${p.old.variant}"${p.old.tone ? ` tone="${p.old.tone}"` : ""}> -> <Text variant="${p.new.variant}"${p.new.tone ? ` tone="${p.new.tone}"` : ""}>`, old: { cls: render(oldH, p.old) }, new: { cls: render(newH, p.new) } });
    }
  }
  for (const e of extras) push(e);
  writeFileSync(out, JSON.stringify(result, null, 1));
  console.log(`${result.length} pairs`);
}
main();
