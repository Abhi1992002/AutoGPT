import { writeFileSync } from "node:fs";
import { join } from "node:path";
const { cn } = await import(join(process.cwd(), "src/lib/utils.ts"));
const { variants } = await import(join(process.cwd(), "src/components/atoms/Text/helpers.ts"));
const NEW: [string, string, string][] = [
  ["body-tight", "body", "leading-5"],
  ["body-medium-tight", "body-medium", "leading-5"],
  ["body-semibold-tight", "body", "font-semibold leading-5"],
  ["small-tight", "small", "leading-4"],
  ["small-medium-tight", "small-medium", "leading-4"],
  ["small-mono-tight", "small", "font-mono leading-4"],
  ["small-medium-mono-tight", "body-medium", "font-mono text-caption leading-4"],
  ["small-loose", "small", "leading-5"],
  ["small-medium-loose", "small-medium", "leading-5"],
  ["small-relaxed", "small", "leading-relaxed"],
  ["large-medium-tight", "large-medium", "leading-6"],
  ["h3-tracking-tight", "h3", "tracking-tight"],
  ["body-semibold", "body", "font-semibold"],
  ["small-semibold", "small", "font-semibold"],
  ["body-line-through", "body", "line-through"],
  ["small-line-through", "small", "line-through"],
  ["body-tight-italic", "body", "italic leading-5"],
  ["small-medium-loose-underline", "small-medium", "leading-5 underline"],
];
const pairs = NEW.map(([nv, bv, extra]) => ({ file: `<Text variant="${nv}"> vs <Text variant="${bv}" className="${extra}">`, old: cn(variants[bv], extra), new: variants[nv], tag: null }));
pairs.push({ file: 'tone="inherit" vs className="text-inherit"', old: cn(variants["small"], "text-inherit"), new: cn(variants["small"], "text-inherit"), tag: null });
writeFileSync("/tmp/variant-pairs.json", JSON.stringify({ pairs, unpaired: [] }, null, 1));
pairs.forEach((p) => console.log(p.file, "|", p.old, "->", p.new));
