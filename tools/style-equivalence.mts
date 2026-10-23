/**
 * The PR's inline-style value changes, old against new, for every category
 * colour the app can pass in (EXPERT_PALETTE), rendered in Chromium against
 * the head stylesheet's role variables. Compares computed values and pixels.
 *
 *   npx tsx style-equivalence.mts <out.md>
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const FE = process.cwd();
const req = createRequire(join(FE, "package.json"));
const { chromium } = req("@playwright/test");
const { EXPERT_PALETTE } = await import(join(FE, "src/components/molecules/ExpertAvatar/helpers.ts"));
const { comparePngs } = await import(join(FE, "scripts/screenshot-pages.ts"));

const hexes: string[] = [...new Set(Object.values(EXPERT_PALETTE as Record<string, { hex: string }>).map((v) => v.hex))];
// Role variables exactly as globals.css defines them (light theme).
const css = readFileSync(join(FE, "src/app/globals.css"), "utf8");
const rootVars = css.slice(css.indexOf(":root"), css.indexOf("}", css.indexOf(":root")) + 1);

interface Change {
  where: string;
  prop: string;
  old: (c: string) => string;
  new: (c: string) => string;
}
const CHANGES: Change[] = [
  ...[45, 55].map((p) => ({
    where: `CategoryChip color (${p}%)`, prop: "color",
    old: (c: string) => `color-mix(in srgb, ${c} ${p}%, #18181b)`,
    new: (c: string) => `color-mix(in srgb, ${c} ${p}%, rgb(var(--color-secondary-foreground)))`,
  })),
  ...[30, 12].map((p) => ({
    where: `CategoryChip backgroundColor (${p}%)`, prop: "background-color",
    old: (c: string) => `color-mix(in srgb, ${c} ${p}%, white)`,
    new: (c: string) => `color-mix(in srgb, ${c} ${p}%, rgb(var(--color-card)))`,
  })),
  {
    where: "CategoryChip background (gloss)", prop: "background-image",
    old: () => "linear-gradient(to bottom, rgba(255,255,255,0.8), rgba(255,255,255,0) 65%)",
    new: () => "linear-gradient(to bottom, rgb(var(--color-card) / 0.8), rgb(var(--color-card) / 0) 65%)",
  },
  {
    where: "CategoryTag color", prop: "color",
    old: (c) => `color-mix(in srgb, ${c} 55%, #18181b)`,
    new: (c) => `color-mix(in srgb, ${c} 55%, rgb(var(--color-secondary-foreground)))`,
  },
  {
    where: "CategoryTag backgroundColor", prop: "background-color",
    old: (c) => `color-mix(in srgb, ${c} 12%, white)`,
    new: (c) => `color-mix(in srgb, ${c} 12%, rgb(var(--color-card)))`,
  },
  {
    where: "ExpertBudgetSection color", prop: "color",
    old: (c) => `color-mix(in srgb, ${c} 55%, #18181b)`,
    new: (c) => `color-mix(in srgb, ${c} 55%, rgb(var(--color-secondary-foreground)))`,
  },
  {
    where: "SpendMeter --meter-track (read as background-color)", prop: "background-color",
    old: (c) => `color-mix(in srgb, ${c} 45%, white)`,
    new: (c) => `color-mix(in srgb, ${c} 45%, rgb(var(--color-card)))`,
  },
  {
    where: "SpendMeter --meter-fill (read as background-color)", prop: "background-color",
    old: (c) => `color-mix(in srgb, ${c} 60%, #18181b)`,
    new: (c) => `color-mix(in srgb, ${c} 60%, rgb(var(--color-primary)))`,
  },
  {
    where: "ExpertPageHeader backgroundImage", prop: "background-image",
    old: (c) => `radial-gradient(circle at 15% 0%, color-mix(in srgb, ${c} 45%, white), transparent 55%), radial-gradient(circle at 90% 110%, color-mix(in srgb, ${c} 35%, white), transparent 50%)`,
    new: (c) => `radial-gradient(circle at 15% 0%, color-mix(in srgb, ${c} 45%, rgb(var(--color-card))), transparent 55%), radial-gradient(circle at 90% 110%, color-mix(in srgb, ${c} 35%, rgb(var(--color-card))), transparent 50%)`,
  },
];

function page(side: "old" | "new") {
  const cells = CHANGES.flatMap((ch, i) =>
    hexes.map((c, j) => {
      const value = ch[side](c);
      const style = ch.prop === "color"
        ? `color:${value}`
        : `${ch.prop}:${value}`;
      return `<div data-k="${i}-${j}" style="width:40px;height:24px;display:inline-block;font:700 20px/24px sans-serif;${style}">Ag</div>`;
    }),
  );
  return `<html><head><style>${rootVars}</style></head><body style="margin:0;width:800px">${cells.join("")}</body></html>`;
}

const browser = await chromium.launch();
const results: Record<string, { old: string; new: string }> = {};
const shots: Record<string, Buffer> = {};
for (const side of ["old", "new"] as const) {
  const p = await browser.newPage({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 1 });
  await p.setContent(page(side));
  const vals = (await p.evaluate(`Array.from(document.querySelectorAll("[data-k]")).map((el) => {
      const s = getComputedStyle(el);
      return [el.dataset.k, "color " + s.color + "; background-color " + s.backgroundColor + "; background-image " + s.backgroundImage];
    })`)) as [string, string][];
  for (const [k, v] of vals) (results[k] ??= { old: "", new: "" })[side] = v;
  shots[side] = await p.screenshot({ fullPage: true });
  await p.close();
}
await browser.close();

const lines = ["| inline style | category colours | old value | new value | computed (first colour) | result |", "| --- | --- | --- | --- | --- | --- |"];
let failures = 0;
CHANGES.forEach((ch, i) => {
  const bad = hexes.filter((_, j) => results[`${i}-${j}`].old !== results[`${i}-${j}`].new);
  failures += bad.length;
  lines.push(`| ${ch.where} | ${hexes.length} | \`${ch.old("C")}\` | \`${ch.new("C")}\` | ${results[`${i}-0`].new} | ${bad.length ? `FAIL for ${bad.join(", ")}` : "identical"} |`);
});
const px = comparePngs(shots.old, shots.new);
const summary = `${CHANGES.length} inline-style changes x ${hexes.length} category colours: ${failures} computed differences, ${px.diffPixels} differing pixels`;
writeFileSync(process.argv[2], `${summary}\n\n${lines.join("\n")}\n`);
console.log(summary);
process.exitCode = failures || px.diffPixels ? 1 : 0;
