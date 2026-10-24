// Resolves extract_pairs' unpaired groups: an old string pairs with the new
// string DS1's codemod (plus dark: removal and this PR's hand swaps) turns it
// into; strings that became <Text> are covered by text_pairs.mts.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const { buildReplacementMap, buildSizeMap, rewriteClassList } = await import(join(process.cwd(), "scripts/codemod-tokens.ts"));
const map = buildReplacementMap(), size = buildSizeMap();
const [pairsFile, textFile, out] = process.argv.slice(2);
const d = JSON.parse(readFileSync(pairsFile, "utf8"));
const t = JSON.parse(readFileSync(textFile, "utf8"));
import { execSync } from "node:child_process";
const headSha = process.argv[5];
const textLines = new Map<string, number[]>();
for (const tp of t.pairs) textLines.set(tp.file, [...(textLines.get(tp.file) ?? []), tp.line]);
const srcCache = new Map<string, string>();
const headSrc = (f: string) => {
  if (!srcCache.has(f)) srcCache.set(f, execSync(`git show "${headSha}:autogpt_platform/frontend/${f}"`, { cwd: "/home/vercel-sandbox/autogpt" }).toString());
  return srcCache.get(f)!;
};
let coveredByText = 0;
const pairs = d.pairs.filter((p: { file: string; new: string; tag: string | null }) => {
  const lines = textLines.get(p.file);
  if (!lines || p.tag !== "Text") return true;
  const src = headSrc(p.file);
  const at = src.split("\n").findIndex((l) => l.includes(`"${p.new}"`)) + 1;
  if (lines.some((l) => at >= l && at <= l + 6)) { coveredByText++; return false; }
  return true;
});
let resolved = 0, removedDark = 0;
const left: string[] = [];
for (const u of d.unpaired) {
  const news = [...u.new];
  for (const o of u.old) {
    const noDark = o.split(/\s+/).filter((w: string) => !w.startsWith("dark:")).join(" ");
    const cm = rewriteClassList(noDark, map, size).output;
    const k = news.indexOf(cm);
    if (k >= 0) { pairs.push({ file: u.file.replace("autogpt_platform/frontend/", ""), old: o, new: cm, tag: null }); news.splice(k, 1); resolved++; continue; }
    if (noDark === "") { pairs.push({ file: u.file, old: o, new: "(removed)", tag: null }); removedDark++; continue; }
    left.push(`${u.file.split("build/")[1]}: ${o}`);
  }
}
writeFileSync(out, JSON.stringify({ pairs: [...pairs, ...t.pairs], unpaired: [] }, null, 1));
console.log(`${d.pairs.length} aligned (${coveredByText} of them on a <Text> the Text table covers, dropped) + ${resolved} resolved + ${removedDark} dark-only removed + ${t.pairs.length} Text = ${pairs.length + t.pairs.length} pairs`);
console.log(`old strings left to the Text table (they became <Text>): ${left.length}`);
left.forEach((l) => console.log("  " + l));
