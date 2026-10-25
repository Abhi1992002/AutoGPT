// Atom overrides removed because the atom already sets them: the class set the
// atom renders (cn/twMerge of its own classes and the className) before and
// after must be the same set, so the DOM is unchanged.
//   npx tsx merged_sets.mts <out.md>
import { writeFileSync } from "node:fs";
import { join } from "node:path";
const D = process.cwd();
const { cn } = await import(join(D, "src/lib/utils.ts"));
const desc = (c: string) => cn("text-body leading-5 text-neutral-500 dark:text-neutral-400", c);
const C: [string, string, string, (c: string) => string][] = [
  ["AgentOutputs.tsx `<SheetDescription>`", "mt-1 text-body leading-5 text-muted-foreground", "mt-1 text-muted-foreground", desc],
];
const out = ["| element | `className` before | after | rendered class set | result |", "| --- | --- | --- | --- | --- |"];
let fails = 0;
for (const [w, a, b, f] of C) {
  const A = new Set(f(a).split(/\s+/)), B = new Set(f(b).split(/\s+/));
  const same = A.size === B.size && [...A].every((x) => B.has(x));
  if (!same) fails++;
  out.push(`| ${w} | \`${a}\` | \`${b}\` | \`${[...B].sort().join(" ")}\` | ${same ? "same set" : `**differs**: ${[...A].filter((x) => !B.has(x)).join(" ")} / ${[...B].filter((x) => !A.has(x)).join(" ")}`} |`);
}
writeFileSync(process.argv[2], `${C.length} atom overrides dropped as already set by the atom: ${fails} with a different rendered class set\n\n${out.join("\n")}\n`);
console.log(`${C.length} checked, ${fails} differ`);
