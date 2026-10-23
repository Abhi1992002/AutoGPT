// Remaining raw palette tokens whose value equals a role that DS1's codemod
// already uses with the same prefix (bg roles also stand for from/via/to).
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { execSync } from "node:child_process";
const req = createRequire(join(process.cwd(), "package.json"));
const cfg = req("tailwindcss/resolveConfig")(req("tailwindcss/loadConfig")(join(process.cwd(), "tailwind.config.ts")));
const { TOKEN_GROUPS } = await import(join(process.cwd(), "scripts/codemod-tokens.ts"));
const css = readFileSync("src/app/globals.css", "utf8");
const roleRgb: Record<string, string> = {};
for (const m of css.matchAll(/--color-([\w-]+):\s*(\d+) (\d+) (\d+);/g)) roleRgb[m[1]] ??= `${m[2]},${m[3]},${m[4]}`;
const sanctioned = new Set<string>();
for (const g of TOKEN_GROUPS) for (const m of g.mappings) sanctioned.add(m.token.replace(/^placeholder:/, ""));
const hexToRgb = (h: string) => { h = h.trim().replace("#", ""); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(","); };
const src = execSync(`grep -rhoE --include=*.ts --include=*.tsx "(text|bg|border|ring|from|to|via|divide|outline|decoration)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|pink|rose)-[0-9]+" "src/app/(platform)/team" "src/app/(platform)/marketplace"`).toString();
const seen = new Set<string>();
for (const tok of src.split("\n").filter(Boolean)) {
  const m = tok.match(/(text|bg|border|ring|from|to|via|divide|outline|decoration)-([a-z]+)-(\d+)$/)!;
  const key = `${m[1]}-${m[2]}-${m[3]}`;
  if (seen.has(key)) continue; seen.add(key);
  const hex = cfg.theme.colors[m[2]]?.[m[3]];
  if (!hex) continue;
  const rgb = hexToRgb(hex);
  const roles = Object.entries(roleRgb).filter(([, v]) => v === rgb).map(([k]) => k);
  const prefix = ["from", "to", "via"].includes(m[1]) ? "bg" : m[1];
  const ok = roles.filter((r) => sanctioned.has(`${prefix}-${r}`));
  const any = roles.length ? ` (same value as ${roles.join(", ")})` : "";
  console.log(`${ok.length ? "EXACT " : "      "}${key} ${hex}${ok.length ? ` -> ${m[1]}-${ok.join("|")}` : any}`);
}
