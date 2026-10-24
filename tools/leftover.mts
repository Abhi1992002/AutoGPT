// Remaining raw colours in the given files: class, hex, roles holding that hex (light :root).
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
const req = createRequire(join(process.cwd(), "package.json"));
const cfg = req("tailwindcss/resolveConfig")(req("tailwindcss/loadConfig")(join(process.cwd(), "tailwind.config.ts")));
const css = readFileSync("src/app/globals.css", "utf8");
const light = css.slice(0, css.indexOf(".dark {"));
const roles: Record<string, string> = {};
for (const m of light.matchAll(/--color-([\w-]+):\s*(\d+) (\d+) (\d+);/g)) roles[m[1]] ??= `${m[2]},${m[3]},${m[4]}`;
const rgbOfHex = (h: string) => { h = h.trim().replace("#", ""); if (h.length === 3) h = [...h].map((c) => c + c).join(""); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(","); };
const files = readFileSync(process.argv[2], "utf8").split("\n").filter(Boolean);
const RE = /(?<![\w-])((?:[\w-]+:|\[[^\]]+\]:|data-\[[^\]]+\]:)*!?)(bg|text|border(?:-[trblxy])?|ring|ring-offset|from|to|via|stroke|fill|divide|outline|shadow|decoration|accent|caret|placeholder)-((?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+|white|black|\[#[0-9a-fA-F]{3,8}\])(\/\d+)?(?![\w-])/g;
const seen = new Map<string, { n: number; where: Set<string> }>();
for (const f of files) {
  const src = readFileSync(f, "utf8");
  src.split("\n").forEach((line, i) => {
    if (/TODO\(tokens\)/.test(line)) return;
    for (const m of line.matchAll(RE)) {
      const key = m[0];
      const e = seen.get(key) ?? { n: 0, where: new Set() };
      e.n++; e.where.add(`${f.replace(/.*\/build\//, "")}:${i + 1}`);
      seen.set(key, e);
    }
  });
}
for (const [key, e] of [...seen.entries()].sort((a, b) => b[1].n - a[1].n)) {
  const m = key.match(/(bg|text|border(?:-[trblxy])?|ring|ring-offset|from|to|via|stroke|fill|divide|outline|shadow|decoration|accent|caret|placeholder)-((?:[a-z]+)-\d+|white|black|\[#[0-9a-fA-F]+\])/)!;
  const c = m[2];
  let hex: string | undefined;
  if (c.startsWith("[#")) hex = c.slice(1, -1);
  else if (c === "white" || c === "black") hex = cfg.theme.colors[c];
  else { const i = c.lastIndexOf("-"); hex = cfg.theme.colors[c.slice(0, i)]?.[c.slice(i + 1)]; }
  const holders = hex ? Object.entries(roles).filter(([, v]) => v === rgbOfHex(hex!)).map(([k]) => k) : [];
  console.log(`${String(e.n).padStart(3)} ${key} ${hex} -> ${holders.join(",") || "(no role)"}   [${[...e.where].slice(0, 3).join(" ")}${e.where.size > 3 ? " …" : ""}]`);
}
