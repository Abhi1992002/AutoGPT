// For each file under the admin dir, lists raw palette classes and hex literals
// and inserts a TODO(tokens) header naming each with its value. --write to apply.
const fs = require("fs");
const path = require("path");
const fe = "/home/vercel-sandbox/autogpt/autogpt_platform/frontend";
const req = require("module").createRequire(path.join(fe, "package.json"));
const theme = req("tailwindcss/resolveConfig")(req("tailwindcss/loadConfig")(path.join(fe, "tailwind.config.ts"))).theme;
const P = "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const CLASS = new RegExp(`(?<=^|["'\`\\s])((?:[a-z-]+:)*!?)(text|bg|border|divide|ring|from|to|via|fill|stroke|outline|decoration|placeholder|caret|accent)-(${P})-(\\d+)(?:/\\d+)?(?=$|["'\`\\s])`, "g");
const HEX = /["'](#[0-9a-fA-F]{3,8})["']/g;
// Raw classes whose value equals a role meant for another use.
const TWINS = {
  "text-red-600": "error-hover (a hover fill)",
  "bg-blue-600": "info-foreground (a text colour)",
  "text-purple-600": "brand-hover (a hover fill)",
};
const write = process.argv.includes("--write");
const dir = path.join(fe, "src/app/(platform)/admin");
function walk(d, out) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== "__tests__") walk(p, out); }
    else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)) out.push(p);
  }
  return out;
}
function wrap(prefix, items) {
  const lines = []; let cur = prefix;
  for (const [i, it] of items.entries()) {
    const piece = it + (i === items.length - 1 ? "." : ",");
    if ((cur + " " + piece).length > 80) { lines.push(cur); cur = "//"; }
    cur += " " + piece;
  }
  lines.push(cur);
  return lines;
}
for (const file of walk(dir, [])) {
  const src = fs.readFileSync(file, "utf8");
  if (src.includes("TODO(tokens): no role")) continue;
  const code = src.split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n");
  const classes = new Map();
  for (const m of code.matchAll(CLASS)) {
    const base = `${m[2]}-${m[3]}-${m[4]}`;
    const hex = theme.colors[m[3]]?.[m[4]];
    classes.set(base, hex.trim().toUpperCase());
  }
  const hexes = new Set();
  for (const m of code.matchAll(HEX)) hexes.add(m[1].toUpperCase());
  if (!classes.size && !hexes.size) continue;
  const lines = [];
  if (classes.size) {
    const items = [...classes].sort().map(([c, h]) => `${c} ${h}`);
    lines.push(...wrap("// TODO(tokens): no role for these colours yet, so they stay raw:", items));
    const twins = [...classes.keys()].filter((c) => TWINS[c]).map((c) => `${c} = ${TWINS[c]}`);
    if (twins.length) lines.push(...wrap("// Same value as a role with another meaning, so not swapped:", twins));
  }
  if (hexes.size) {
    lines.push(...wrap("// TODO(tokens): chart and canvas colours, which have no tokens yet:", [...hexes]));
  }
  const rel = path.relative(fe, file);
  console.log(`== ${rel}\n${lines.join("\n")}`);
  if (write) {
    const all = src.split("\n");
    // After a leading "use client"/"use server" directive, else at the top.
    let at = /^["']use (client|server)["'];?$/.test(all[0]) ? 1 : 0;
    const insert = at === 1 ? ["", ...lines] : [...lines, ""];
    all.splice(at, 0, ...insert);
    fs.writeFileSync(file, all.join("\n"));
  }
}
