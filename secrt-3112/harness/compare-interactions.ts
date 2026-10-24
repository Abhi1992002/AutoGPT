/**
 *   npx tsx compare-interactions.ts <before dir> <after dir> <diff dir>
 * Pixels at threshold 0 (DS1's comparePngs) and the facts.json entries
 * (attributes, Tab order, Escape, focus) of every scenario.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { comparePngs } from "/home/vercel-sandbox/autogpt/autogpt_platform/frontend/scripts/screenshot-pages";

const [a, b, d] = process.argv.slice(2);
mkdirSync(d, { recursive: true });
const fa = JSON.parse(readFileSync(join(a, "facts.json"), "utf8"));
const fb = JSON.parse(readFileSync(join(b, "facts.json"), "utf8"));
const rows = ["| scenario | pixels | facts |", "| --- | --- | --- |"];
let bad = 0;
const keys = Array.from(new Set([...Object.keys(fa), ...Object.keys(fb)])).sort();
for (const k of keys) {
  const pa = join(a, `${k}.png`), pb = join(b, `${k}.png`);
  let px = "missing";
  if (existsSync(pa) && existsSync(pb)) {
    const r = comparePngs(readFileSync(pa), readFileSync(pb));
    px = r.diffPixels === 0 ? "0 px" : `${r.diffPixels} px`;
    if (r.diffPixels && r.diff) writeFileSync(join(d, `${k}.png`), r.diff);
  } else if (!existsSync(pa) && !existsSync(pb)) px = "none (both)";
  const strip = (o: Record<string, unknown> = {}) => { const { stable: _s, ...rest } = o; return JSON.stringify(rest); };
  const same = strip(fa[k]) === strip(fb[k]);
  if (px !== "0 px" || !same) bad++;
  rows.push(`| ${k} | ${px} | ${same ? "identical" : "DIFFER"} |`);
  if (!same) writeFileSync(join(d, `${k}.facts.txt`), `before: ${strip(fa[k])}\nafter:  ${strip(fb[k])}\n`);
}
console.log(rows.join("\n"));
console.log(`\n${keys.length} scenario(s), ${bad} differing`);
process.exitCode = bad ? 1 : 0;
