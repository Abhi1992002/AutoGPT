// For every distinct old->new class this PR writes, cn(base, old) and
// cn(base, new) must keep exactly the same base classes, for a panel of base
// classes covering what components set (sizes, line-heights, colours, borders,
// rings, tracking, weights, under variants). Proves component merges can't
// diverge between dev and head.
import { readFileSync } from "node:fs";
import { cn } from "../../autogpt_platform/frontend/src/lib/utils";
const rows = readFileSync(process.argv[2], "utf8").split("\n").filter((l) => /^\| \d+ \|/.test(l));
const pairs = rows.map((l) => { const c = l.split(" | "); return { o: c[1].replace(/`/g, ""), n: c[2].replace(/`/g, "") }; });
const BASE = ["text-sm", "text-base", "text-xs", "text-lg", "text-[13px]", "text-body", "text-caption", "leading-5", "leading-6", "leading-none", "leading-tight", "text-black", "text-white", "text-zinc-500", "text-muted-foreground", "text-foreground", "bg-white", "bg-zinc-100", "bg-transparent", "bg-primary", "bg-gradient-to-r", "from-zinc-50", "via-zinc-50", "to-zinc-50", "border", "border-2", "border-zinc-200", "border-input", "border-transparent", "ring-2", "ring-offset-2", "ring-zinc-300", "ring-ring", "tracking-tight", "tracking-wide", "font-medium", "font-semibold", "fill-current", "stroke-current", "divide-y", "divide-zinc-100", "placeholder:text-zinc-400", "scrollbar-thumb-zinc-300", "hover:bg-zinc-100", "hover:text-zinc-900", "focus-visible:ring-2", "focus-visible:ring-zinc-400", "md:text-sm", "md:leading-6", "!text-sm"];
let checked = 0, bad = 0;
for (const { o, n } of pairs) {
  for (const b of BASE) {
    // also check each base class under the pair's own variant prefix
    const v = o.split(" ").at(-1)!.slice(0, o.split(" ").at(-1)!.lastIndexOf(":") + 1);
    for (const base of new Set([b, v ? `${v}${b}` : b])) {
      // A base equal to the pair's own class de-duplicates instead of merging.
      if (o.split(" ").includes(base) || n.split(" ").includes(base)) continue;
      checked++;
      const keptOld = cn(base, o).split(" ").includes(base);
      const keptNew = cn(base, n).split(" ").includes(base);
      if (keptOld !== keptNew) { bad++; console.log(`DIVERGES: base ${base}: cn(base, "${o}") keeps=${keptOld}, cn(base, "${n}") keeps=${keptNew}`); }
    }
  }
}
console.log(`${pairs.length} class pairs x ${BASE.length} base classes (and under the pair's variant): ${checked} merges, ${bad} divergent`);
process.exitCode = bad ? 1 : 0;
