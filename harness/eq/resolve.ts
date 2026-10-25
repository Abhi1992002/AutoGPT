// Turns gen-pairs.py output into compare.ts input: a <Text> replacement's new
// string is what Text composes (variants[variant] + tones[tone] + className,
// merged with the head's cn()). Run with cwd = the PR's head checkout.
// cva/cn compositions (compose_old/compose_new) are merged with cn() on both sides.
// usage: resolve.ts <gen.json> <pairs.json>
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const H = require(join(process.cwd(), "src/components/atoms/Text/helpers"));
const { cn } = require(join(process.cwd(), "src/lib/utils"));
type G = { file: string; tag: string; old: string; new?: string; text?: { variant: string; tone?: string; className?: string }; compose_old?: string[]; compose_new?: string[] };
const gen: G[] = JSON.parse(readFileSync(process.argv[2], "utf8"));
const out = gen.map((g) => {
  let cls = g.new as string;
  if (g.text) {
    if (!H.variants[g.text.variant]) throw new Error(`${g.file}: unknown variant ${g.text.variant}`);
    cls = cn(H.variants[g.text.variant], g.text.tone && H.tones[g.text.tone], g.text.className);
  }
  // cva/cn compositions: both sides merged with cn() as the component merges
  // them (src/lib/utils.ts is the same file at every SHA of this stack).
  const old = g.compose_old ? cn(...g.compose_old) : g.old;
  if (g.compose_new) cls = cn(...g.compose_new);
  const tag = g.tag;
  return { file: g.file + (g.text ? ` (Text ${g.text.variant}${g.text.tone ? ", " + g.text.tone : ""})` : ""), old: `${tag}|${old}`, new: `${tag}|${cls}` };
});
writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
console.log(`${out.length} pairs resolved`);
