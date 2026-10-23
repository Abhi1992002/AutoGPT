// For each remaining raw-colour class, resolve the colour Tailwind renders
// and list every role/shadcn name with the identical RGB (light theme).
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const req = createRequire("/home/vercel-sandbox/autogpt/autogpt_platform/frontend/package.json");
const resolveConfig = req("tailwindcss/resolveConfig");
const config = req("/home/vercel-sandbox/autogpt/autogpt_platform/frontend/tailwind.config.ts");
const theme = resolveConfig(config.default ?? config).theme;
const css = readFileSync("/home/vercel-sandbox/autogpt/autogpt_platform/frontend/src/app/globals.css", "utf8");
const light = css.slice(0, css.indexOf(".dark"));
const roles = new Map<string, string>();
for (const m of light.matchAll(/--color-([a-z-]+):\s*(\d+) (\d+) (\d+);/g)) roles.set(m[1], [m[2], m[3], m[4]].map(Number).map((n) => n.toString(16).padStart(2, "0")).join(""));
function hex(path: string[]) {
  let v: any = theme.colors; for (const p of path) v = v?.[p];
  if (typeof v === "object") v = v?.DEFAULT;
  if (typeof v !== "string") return null;
  v = v.trim().toLowerCase();
  if (v === "#fff" || v === "white") return "ffffff";
  if (v === "#000" || v === "black") return "000000";
  return /^#[0-9a-f]{6}$/.test(v) ? v.slice(1) : v;
}
const lines = readFileSync(process.argv[2], "utf8").split("\n").filter(Boolean);
for (const raw of lines) {
  const cls = raw.replace(/^.*:/, "").replace(/^!/, "");
  const m = cls.match(/^(text|bg|border|ring|divide|fill|stroke|from|via|to|placeholder|scrollbar-thumb|outline|decoration)-(.+?)(\/\d+)?$/);
  if (!m) { console.log(`${raw}\t?`); continue; }
  const parts = m[2].split("-");
  const h = hex(parts.length > 1 ? [parts.slice(0, -1).join("-"), parts.at(-1)!] : [parts[0]]);
  const match = [...roles].filter(([, v]) => v === h).map(([k]) => k);
  console.log(`${raw}\t#${h}\t${match.join(",") || "-"}`);
}
