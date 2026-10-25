// usage: tsx compare-text-runs.ts <dirA> <dirB> [reportPath]
// Pixel diff (DS1's comparePngs, threshold 0) for every PNG, and per state an
// exact comparison of every text run in the open panel, in document order:
// text, font-size, line-height, weight, colour, letter-spacing of the element
// that holds it. Tag and box are left out, because a pill or bar that became
// wrapper + Text holds its text one element deeper; the pixels cover boxes.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { comparePngs } from "../../autogpt_platform/frontend/scripts/screenshot-pages";

const [a, b, report] = process.argv.slice(2);
const rows: string[] = ["| state | pixels | computed styles |", "|---|---|---|"];
let px = 0, css = 0, n = 0;
for (const f of readdirSync(a).filter((x) => x.endsWith(".png")).sort()) {
  n++;
  const base = f.replace(/\.png$/, "");
  let pix = "missing";
  if (existsSync(join(b, f))) {
    const r = comparePngs(readFileSync(join(a, f)), readFileSync(join(b, f)));
    pix = r.sizeMismatch ? `size ${r.sizeMismatch}` : String(r.diffPixels);
  }
  let st = "missing";
  if (existsSync(join(a, base + ".json")) && existsSync(join(b, base + ".json"))) {
    const ja = JSON.parse(readFileSync(join(a, base + ".json"), "utf8"));
    const jb = JSON.parse(readFileSync(join(b, base + ".json"), "utf8"));
    const runs = (rows: string[]) => rows
      .map((r) => r.split(" | "))
      .filter((c) => c.length >= 11 && c[1] !== "")
      .map((c) => c.slice(1, 7).join(" | "))
      .concat(rows.filter((r) => /^(placeholder|focused|menu) \|/.test(r)));
    const ra: string[] = runs(ja.rows ?? []), rb: string[] = runs(jb.rows ?? []);
    const diff = ra.filter((r, i) => r !== rb[i]).length + Math.abs(ra.length - rb.length);
    st = diff === 0 ? `identical (${ra.length} runs)` : `${diff} rows differ`;
    if (diff) {
      css++;
      ra.forEach((r, i) => { if (r !== rb[i]) console.log(`  ${base}\n    - ${r}\n    + ${rb[i]}`); });
    }
  }
  if (pix !== "0") px++;
  rows.push(`| ${base} | ${pix} | ${st} |`);
}
if (report) writeFileSync(report, rows.join("\n") + "\n");
console.log(`${n} states: ${px} with pixel differences, ${css} with computed-style differences`);
for (const r of rows.slice(2)) if (!r.includes("| 0 | identical")) console.log(r);
