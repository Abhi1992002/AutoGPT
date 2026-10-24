/**
 * For screenshots that differ between single runs: is every head rendering
 * pixel-identical (threshold 0, DS1's comparePngs) to some base rendering,
 * and every base rendering to some head rendering?
 *
 *   npx tsx match-sets.ts --base dirA,dirB --head dirC,dirD name1.png name2.png …
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { comparePngs } from "/home/vercel-sandbox/autogpt/autogpt_platform/frontend/scripts/screenshot-pages";

function flag(name: string) {
  const i = process.argv.indexOf(name);
  return process.argv[i + 1].split(",");
}
const baseDirs = flag("--base");
const headDirs = flag("--head");
const names = process.argv.slice(2).filter((a) => a.endsWith(".png"));

function load(dirs: string[], name: string) {
  return dirs.filter((d) => existsSync(join(d, name))).map((d) => ({ d, png: readFileSync(join(d, name)) }));
}

const rows = ["| screenshot | base runs | head runs | every head run matches a base run | every base run matches a head run |", "| --- | --- | --- | --- | --- |"];
let bad = 0;
for (const name of names) {
  const base = load(baseDirs, name);
  const head = load(headDirs, name);
  const matches = (a: Buffer, set: { png: Buffer }[]) => set.some((s) => comparePngs(a, s.png).diffPixels === 0);
  const headOk = head.every((h) => matches(h.png, base));
  const baseOk = base.every((b) => matches(b.png, head));
  if (!headOk || !baseOk) bad++;
  rows.push(`| ${name} | ${base.length} | ${head.length} | ${headOk ? "yes (0 px)" : "NO"} | ${baseOk ? "yes (0 px)" : "NO"} |`);
}
console.log(rows.join("\n"));
console.log(`\n${names.length} screenshot(s), ${bad} without a pixel-identical counterpart`);
process.exitCode = bad ? 1 : 0;
