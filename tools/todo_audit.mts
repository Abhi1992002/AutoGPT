// For every colour named in a TODO(tokens) comment in scope: its hex, and every
// globals.css role (light theme) that holds exactly that hex.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { execSync } from "node:child_process";
const req = createRequire(join(process.cwd(), "package.json"));
const cfg = req("tailwindcss/resolveConfig")(req("tailwindcss/loadConfig")(join(process.cwd(), "tailwind.config.ts")));
const css = readFileSync("src/app/globals.css", "utf8");
const light = css.slice(0, css.indexOf(".dark"));
const roles: Record<string, string> = {};
for (const m of light.matchAll(/--color-([\w-]+):\s*(\d+) (\d+) (\d+);/g)) roles[m[1]] ??= `${m[2]},${m[3]},${m[4]}`;
const rgbOfHex = (h: string) => { h = h.trim().replace("#", ""); if (h.length === 3) h = [...h].map((c) => c + c).join(""); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(","); };
const lines = execSync(`grep -rn "TODO(tokens)" "src/app/(platform)/team" "src/app/(platform)/marketplace"`).toString().trim().split("\n");
const report = new Map<string, string>();
for (const line of lines) {
  const toks = new Set<string>();
  for (const m of line.matchAll(/(?:^|[\s,:])((?:[\w-]+:)*!?(?:text|bg|border|ring|from|to|via|outline|decoration|divide)-([a-z]+)-(\d+)(?:\/\d+)?)/g)) toks.add(`${m[2]}-${m[3]}`);
  for (const m of line.matchAll(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) toks.add(`#${m[1]}`);
  if (/\bwhite\b/.test(line)) toks.add("#FFFFFF");
  for (const t of toks) {
    const hex = t.startsWith("#") ? t : (() => { const i = t.lastIndexOf("-"); return cfg.theme.colors[t.slice(0, i)]?.[t.slice(i + 1)]; })();
    if (!hex) continue;
    const rgb = rgbOfHex(hex);
    const holders = Object.entries(roles).filter(([, v]) => v === rgb).map(([k]) => k);
    report.set(t, `${t} ${hex.trim()} -> ${holders.length ? holders.join(", ") : "(no role)"}`);
  }
}
for (const v of [...report.values()].sort()) console.log(v);
