// The two OutputHandler <Text>s whose variant and className depend on isBroken,
// measured in both states: dev's cn(variant, className) vs head's.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
const { cn } = await import(join(process.cwd(), "src/lib/utils.ts"));
const { variants } = await import(join(process.cwd(), "src/components/atoms/Text/helpers.ts"));
const f = "src/app/(platform)/build/components/FlowEditor/nodes/OutputHandler.tsx";
const colour = "!text-info"; // a typed output's label colour (getTypeDisplayInfo); the same class on both sides
const pairs = [];
for (const broken of [false, true]) {
  pairs.push({ file: f, line: 135, tag: "Text-merged", variant: broken ? "body-line-through" : "body", state: broken ? "broken" : "connected",
    old: cn(variants["body"], "text-slate-700", broken && "text-red-500 line-through"),
    new: cn(variants[broken ? "body-line-through" : "body"], "text-slate-700", broken && "text-error") });
  pairs.push({ file: f, line: 145, tag: "Text-merged", variant: broken ? "small-line-through" : "small", state: broken ? "broken" : "connected",
    old: cn(variants["small"], colour, broken && "!text-red-500 line-through"),
    new: cn(variants[broken ? "small-line-through" : "small"], colour, broken && "!text-error") });
}
writeFileSync("/tmp/dyn-pairs.json", JSON.stringify({ pairs }, null, 1));
pairs.forEach((p) => console.log(p.line, p.state, "|", p.old, "->", p.new));
