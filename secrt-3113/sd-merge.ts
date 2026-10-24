import { createRequire } from "node:module";
import { join } from "node:path";
import { realpathSync } from "node:fs";
const req = createRequire(
  join(realpathSync("node_modules/streamdown"), "package.json"),
);
const { twMerge } = req("tailwind-merge");
console.log(
  "tailwind-merge (Streamdown's copy):",
  JSON.parse(
    require("node:fs").readFileSync(
      join(
        realpathSync("node_modules/streamdown"),
        "..",
        "tailwind-merge",
        "package.json",
      ),
      "utf8",
    ),
  ).version,
);
for (const s of [
  "[&_th]:text-caption-sm [&_th]:leading-5 [&_th]:tracking-eyebrow [&_th]:text-indigo-950/70",
  "[&_td]:text-body-sm [&_td]:leading-5 [&_td]:text-foreground-body",
  "[&_td_code]:text-caption [&_td_code]:leading-5 [&_td_code]:text-foreground-body",
  "[&_table]:text-body-sm [&_table]:tabular-nums [&_table]:leading-inherit",
  "[&_td]:text-[13px] [&_td]:leading-5 [&_td]:text-foreground-body",
])
  console.log(
    `in:  ${s}\nout: ${twMerge("space-y-4 whitespace-normal *:first:mt-0 *:last:mb-0", s).replace("space-y-4 whitespace-normal *:first:mt-0 *:last:mb-0 ", "")}`,
  );
