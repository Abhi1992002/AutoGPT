// For each step: does any base run equal any head run (px, DOM, focus)? And how many distinct outcomes per commit.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
interface Step { label: string; png: string; dom: string; focus: string }
const [basesArg, headsArg] = process.argv.slice(2);
const load = (d: string) => Object.assign({}, ...readdirSync(d).filter((f) => f.startsWith("steps-")).map((f) => JSON.parse(readFileSync(join(d, f), "utf8")))) as Record<string, Step[]>;
const bases = basesArg.split(","), heads = headsArg.split(",");
const sig = (d: string, s: Step) => createHash("sha256").update(readFileSync(join(d, s.png))).digest("hex").slice(0, 12) + "|" + s.dom.slice(0, 12) + "|" + s.focus;
const B = bases.map(load), H = heads.map(load);
let steps = 0, matched = 0; const unmatched: string[] = [];
for (const key of Object.keys(B[0]).sort()) for (const st of B[0][key]) {
  steps++;
  const bs = new Set(B.map((r, i) => { const s = r[key]?.find((x) => x.label === st.label); return s ? sig(bases[i], s) : "missing"; }));
  const hs = new Set(H.map((r, i) => { const s = r[key]?.find((x) => x.label === st.label); return s ? sig(heads[i], s) : "missing"; }));
  if ([...bs].some((x) => hs.has(x))) matched++;
  else unmatched.push(`${key} ${st.label}: base outcomes ${bs.size}, head outcomes ${hs.size}`);
}
console.log(`${steps} steps; ${matched} with an identical base/head outcome (pixels byte-identical, DOM, focus); ${unmatched.length} without`);
for (const u of unmatched) console.log(u);
