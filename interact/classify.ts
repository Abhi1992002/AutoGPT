import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { comparePngs } from "../scripts/screenshot-pages";
interface Step { label: string; png: string; dom: string; focus: string }
const [b, h1, h2, out] = process.argv.slice(2);
const load = (d: string) => Object.assign({}, ...readdirSync(d).filter((f) => f.startsWith("steps-")).map((f) => JSON.parse(readFileSync(join(d, f), "utf8")))) as Record<string, Step[]>;
const B = load(b), H1 = load(h1), H2 = load(h2);
const px = (d1: string, s1: Step, d2: string, s2: Step) => comparePngs(readFileSync(join(d1, s1.png)), readFileSync(join(d2, s2.png))).diffPixels;
const counts = { steps: 0, identical: 0, matchesOtherHeadRun: 0, nondeterministic: 0, real: 0, missing: 0 };
const lines: string[] = [];
for (const key of Object.keys(B).sort()) {
  const sb = B[key], s1 = H1[key] ?? [], s2 = H2[key] ?? [];
  for (let i = 0; i < sb.length; i++) {
    counts.steps++;
    const x = sb[i], y = s1.find((s) => s.label === x.label), z = s2.find((s) => s.label === x.label);
    if (!y || !z || x.label.startsWith("error")) { counts.missing++; lines.push(`MISSING ${key} ${x.label}`); continue; }
    const same = (p: Step, dp: string, q: Step, dq: string) => p.dom === q.dom && p.focus === q.focus && px(dp, p, dq, q) === 0;
    if (same(x, b, y, h1)) { counts.identical++; continue; }
    if (same(x, b, z, h2)) { counts.matchesOtherHeadRun++; continue; }
    const hh = same(y, h1, z, h2);
    if (!hh) { counts.nondeterministic++; lines.push(`varies-between-head-runs ${key} ${x.label}`); continue; }
    counts.real++;
    lines.push(`REAL ${key} ${x.label}: px=${px(b, x, h1, y)} dom=${x.dom === y.dom ? "same" : "differs"} focus=${x.focus === y.focus ? "same" : `${x.focus} | ${y.focus}`}`);
  }
}
writeFileSync(out, [JSON.stringify(counts), ...lines].join("\n"));
console.log(JSON.stringify(counts));
