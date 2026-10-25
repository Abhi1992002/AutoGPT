import { createRequire } from "node:module";
import { join } from "node:path";
import { readFileSync, realpathSync } from "node:fs";
import { cn } from "../src/lib/utils";
const sdDir = realpathSync("node_modules/streamdown");
const req = createRequire(join(sdDir, "package.json"));
const { twMerge } = req("tailwind-merge");
const ver = JSON.parse(
  readFileSync(join(sdDir, "..", "tailwind-merge", "package.json"), "utf8"),
).version;
console.log(`tailwind-merge (Streamdown's copy): ${ver}`);
const ROOT = "space-y-4 whitespace-normal *:first:mt-0 *:last:mb-0";
const src = readFileSync(
  process.argv[2] ?? "src/components/ai-elements/message.tsx",
  "utf8",
);
const lines = [
  ...src.matchAll(/"(\[&_(?:table_th|th|td|td_code|table|table_td)[^"]*)"/g),
].map((m) => m[1]);
const all = cn(...lines);
const out = twMerge(ROOT, all);
const want = [
  "[&_table_th]:text-caption-sm",
  "[&_table_th]:leading-5",
  "[&_table_td]:text-body-sm",
  "[&_table_td_code]:text-caption",
  "[&_table_td_code]:leading-5",
  "[&_td]:text-foreground-body",
  "[&_td_code]:text-foreground-body",
  "[&_table]:text-body-sm",
  "[&_table]:leading-inherit",
];
for (const w of want)
  console.log(`${out.split(" ").includes(w) ? "kept   " : "DROPPED"} ${w}`);
console.log(
  `pre-existing on dev, unchanged: [&_th]:text-indigo-950/70 is ${out.split(" ").includes("[&_th]:text-indigo-950/70") ? "kept" : "dropped"} (tailwind-merge reads the later [&_th]:text-shadow-message-table-indigo as a text colour; dev's own cn drops it too)`,
);
console.log("same-scope proof (why the sizes moved):");
for (const s of [
  "[&_th]:text-caption-sm [&_th]:text-indigo-950/70",
  "[&_table_th]:text-caption-sm [&_th]:text-indigo-950/70",
])
  console.log(`  in:  ${s}\n  out: ${twMerge(s)}`);
process.exitCode = want.every((w) => out.split(" ").includes(w)) ? 0 : 1;
