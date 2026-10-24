// usage: tsx min-pair.ts <shotsDir> <beforeRuns,comma> <afterRuns,comma>
// For each file in the first before run: min pixel diff across every
// before x after pair, plus whether same-commit runs differ (flaky).
import { readdirSync, readFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { comparePngs } from "../../autogpt_platform/frontend/scripts/screenshot-pages";

const [dir, b, a] = process.argv.slice(2);
const before = b.split(","), after = a.split(",");
const files = readdirSync(join(dir, before[0])).filter((f) => f.endsWith(".png")).sort();
function diff(x: string, y: string, f: string) {
  const p = join(dir, x, f), q = join(dir, y, f);
  if (!existsSync(p) || !existsSync(q)) return null;
  return comparePngs(readFileSync(p), readFileSync(q)).diffPixels;
}
const rows: string[] = [];
let failures = 0, flaky = 0;
for (const f of files) {
  let best = Infinity, bestPair = "";
  for (const x of before) for (const y of after) {
    const d = diff(x, y, f);
    if (d !== null && d < best) { best = d; bestPair = `${x}/${y}`; }
  }
  const same: number[] = [];
  for (const runs of [before, after]) for (let i = 0; i < runs.length; i++) for (let j = i + 1; j < runs.length; j++) {
    const d = diff(runs[i], runs[j], f); if (d !== null) same.push(d);
  }
  const varies = same.some((d) => d > 0);
  if (best !== 0) failures++;
  if (varies) flaky++;
  rows.push(`| ${f} | ${best} | ${bestPair} | ${varies ? "varies on same commit (" + same.join("/") + ")" : "0"} |`);
}
writeFileSync(join(dir, `min-pair-${before[0]}.md`), ["| screenshot | min dev/head diff | pair | same-commit diffs |", "|---|---|---|---|", ...rows].join("\n") + "\n");
console.log(`${files.length} shots, ${failures} with no 0-px dev/head pair, ${flaky} vary between runs of the same commit`);
for (const r of rows) if (!r.includes("| 0 | ") || r.includes("varies")) console.log(r);
