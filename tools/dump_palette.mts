import { createRequire } from "node:module";
import { join } from "node:path";
const req = createRequire(join(process.cwd(), "package.json"));
const cfg = req("tailwindcss/resolveConfig")(req("tailwindcss/loadConfig")(join(process.cwd(), "tailwind.config.ts")));
const out: Record<string, string> = {};
for (const [fam, v] of Object.entries(cfg.theme.colors)) {
  if (typeof v === "string") out[fam] = v;
  else for (const [shade, hex] of Object.entries(v as Record<string, string>)) out[`${fam}-${shade}`] = hex;
}
console.log(JSON.stringify(out));
