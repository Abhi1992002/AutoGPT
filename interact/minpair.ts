import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { comparePngs } from "../scripts/screenshot-pages";
const [root, basesArg, headsArg, out] = process.argv.slice(2);
const bases = basesArg.split(","), heads = headsArg.split(",");
const files = readdirSync(`${root}/${bases[0]}`).filter((f) => f.endsWith(".png")).sort();
const d = (a: string, b: string, f: string) => comparePngs(readFileSync(`${root}/${a}/${f}`), readFileSync(`${root}/${b}/${f}`)).diffPixels;
const rows = ["| screenshot | min base↔head px (pair) | max base↔base px | max head↔head px |", "| --- | --- | --- | --- |"];
let bad = 0, flaky = 0;
for (const f of files) {
  let min = Infinity, pair = "";
  for (const b of bases) for (const h of heads) { const v = d(b, h, f); if (v < min) { min = v; pair = `${b}↔${h}`; } }
  let bb = 0; for (let i = 0; i < bases.length; i++) for (let j = i + 1; j < bases.length; j++) bb = Math.max(bb, d(bases[i], bases[j], f));
  let hh = 0; for (let i = 0; i < heads.length; i++) for (let j = i + 1; j < heads.length; j++) hh = Math.max(hh, d(heads[i], heads[j], f));
  if (min > 0) bad++;
  if (bb > 0 || hh > 0) flaky++;
  rows.push(`| ${f} | ${min} (${pair}) | ${bb} | ${hh} |`);
}
rows.push("", `${files.length} screenshots; ${bad} with no 0 px base↔head pair; ${flaky} that also vary between runs of one commit`);
writeFileSync(out, rows.join("\n"));
console.log(rows.slice(-1)[0]);
