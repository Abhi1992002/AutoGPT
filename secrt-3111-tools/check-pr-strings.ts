// Evidence harness for DS5g part 2 (not committed). Renders every exact class
// string this PR changes, old against the base checkout's Tailwind build and
// new against the head's, and compares EVERY computed CSS property:
// - inside parents at leading-[1.5], leading-[30px] and leading-normal,
// - at 1280px and 390px wide,
// - as written, after cn(), and inside the component merge that renders it
//   (Button ghost/small, MorphingTextAnimation, the capability badge).
//   npx tsx check-pr-strings.ts <base frontend dir> <head frontend dir> <pairs.json> <out.md>
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";

const baseDir = resolve(process.argv[2]);
const headDir = resolve(process.argv[3]);
const pairsFile = resolve(process.argv[4]);
const outFile = resolve(process.argv[5]);

const req = createRequire(join(headDir, "package.json"));
const postcss = req("postcss");
const tailwindcss = req("tailwindcss");
const loadConfig = req("tailwindcss/loadConfig");
const { chromium } = req("@playwright/test");

interface Case {
  label: string;
  tag: string;
  oldClass: string;
  newClass: string;
}

async function main() {
  const { cn: oldCn } = await import(join(baseDir, "src/lib/utils.ts"));
  const { cn: newCn } = await import(join(headDir, "src/lib/utils.ts"));
  const oldButton = await import(
    join(baseDir, "src/components/atoms/Button/helpers.ts")
  );
  const newButton = await import(
    join(headDir, "src/components/atoms/Button/helpers.ts")
  );
  const pairs: { oldClass: string; newClass: string; where: string[] }[] =
    JSON.parse(readFileSync(pairsFile, "utf8"));

  const cases: Case[] = [];
  for (const p of pairs) {
    const tag = p.oldClass.includes("hover:underline")
      ? "a"
      : p.oldClass.startsWith("shrink-0") || p.oldClass.startsWith("text-xs")
        ? "span"
        : p.oldClass.startsWith("mt-1 text") || p.oldClass.includes("max-h-96")
          ? "p"
          : p.oldClass.includes("h-auto px-0")
            ? "button"
            : p.oldClass === "text-red-500" ||
                p.oldClass === "text-blue-500" ||
                p.oldClass.startsWith("animate-spin")
              ? "svg"
              : "div";
    cases.push({
      label: "as written",
      tag,
      oldClass: p.oldClass,
      newClass: p.newClass,
    });
    cases.push({
      label: "cn()",
      tag,
      oldClass: oldCn(p.oldClass),
      newClass: newCn(p.newClass),
    });
  }
  // Component merges that render these strings.
  const morph = "min-w-0 truncate whitespace-nowrap";
  cases.push({
    label: "MorphingTextAnimation",
    tag: "span",
    oldClass: oldCn(morph, "text-red-500"),
    newClass: newCn(morph, "text-error"),
  });
  cases.push({
    label: "MorphingTextAnimation (GenericTool)",
    tag: "span",
    oldClass: oldCn(morph, oldCn("min-w-0 flex-1", "text-red-500")),
    newClass: newCn(morph, newCn("min-w-0 flex-1", "text-error")),
  });
  const btn = (mod: typeof oldButton, cnFn: typeof oldCn, className: string) =>
    cnFn(
      mod.extendedButtonVariants({ variant: "ghost", size: "small", className }),
    );
  cases.push({
    label: "Button ghost/small",
    tag: "button",
    oldClass: btn(
      oldButton,
      oldCn,
      "mt-1 h-auto px-0 py-0.5 text-[11px] text-muted-foreground",
    ),
    newClass: btn(
      newButton,
      newCn,
      "mt-1 h-auto px-0 py-0.5 text-caption-sm leading-inherit text-muted-foreground",
    ),
  });
  for (const [oldBadge, newBadge] of [
    ["bg-amber-100 text-amber-800", "bg-amber-100 text-amber-800"],
    ["bg-green-100 text-green-800", "bg-green-100 text-green-800"],
    ["bg-zinc-100 text-zinc-500", "bg-surface-hover text-foreground-tertiary"],
  ]) {
    cases.push({
      label: "capability badge",
      tag: "span",
      oldClass: "shrink-0 rounded-full px-2 py-0.5 text-[11px] " + oldBadge,
      newClass:
        "shrink-0 rounded-full px-2 py-0.5 text-caption-sm leading-inherit " +
        newBadge,
    });
  }

  const parents = ["leading-[1.5]", "leading-[30px]", "leading-normal"];
  const compile = async (dir: string, classes: string[]) => {
    const config = loadConfig(join(dir, "tailwind.config.ts"));
    const globals = readFileSync(join(dir, "src/app/globals.css"), "utf8");
    const result = await postcss([
      tailwindcss({
        ...config,
        content: [{ raw: [...classes, ...parents].join(" "), extension: "html" }],
      }),
    ]).process(globals, { from: join(dir, "src/app/globals.css") });
    return result.css as string;
  };
  const oldCss = await compile(baseDir, cases.map((c) => c.oldClass));
  const newCss = await compile(headDir, cases.map((c) => c.newClass));

  const browser = await chromium.launch();
  const measure = async (css: string, side: "oldClass" | "newClass", width: number) => {
    const page = await browser.newPage({ viewport: { width, height: 800 } });
    const cells = cases.flatMap((c, i) =>
      parents.map((parent, p) => {
        const inner =
          c.tag === "svg"
            ? `<svg data-i="${i}" data-p="${p}" class="${c[side]}" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M2 12h20"/></svg>`
            : `<${c.tag} data-i="${i}" data-p="${p}" class="${c[side]}"${c.tag === "a" ? ' href="#x"' : ""}>Ag text</${c.tag}>`;
        return `<div class="${parent}" style="font-size:16px">${inner}</div>`;
      }),
    );
    await page.setContent(
      `<html><head><style>${css}</style></head><body>${cells.join("")}</body></html>`,
    );
    const values = await page.evaluate(() =>
      Array.from(document.querySelectorAll("[data-i]")).map((el) => {
        const style = getComputedStyle(el);
        const all: Record<string, string> = {};
        for (let k = 0; k < style.length; k++) {
          const prop = style[k];
          all[prop] = style.getPropertyValue(prop);
        }
        return {
          i: Number((el as HTMLElement).dataset.i),
          p: Number((el as HTMLElement).dataset.p),
          all,
        };
      }),
    );
    const root = await page.evaluate(
      () => getComputedStyle(document.documentElement).fontSize,
    );
    if (root !== "16px") throw new Error(`root font-size ${root}`);
    await page.close();
    return values;
  };

  const rows: string[] = [
    "| context | element | old class string | new class string | computed value (16px root; line-height per parent 1.5 / 30px / normal) | result |",
    "| --- | --- | --- | --- | --- | --- |",
  ];
  let failing = 0;
  let comparisons = 0;
  const results = cases.map(() => ({ problems: new Set<string>(), shown: "" }));
  for (const width of [1280, 390]) {
    const oldV = await measure(oldCss, "oldClass", width);
    const newV = await measure(newCss, "newClass", width);
    oldV.forEach((o, k) => {
      const n = newV[k];
      if (n.i !== o.i || n.p !== o.p) throw new Error("misaligned");
      const props = new Set([...Object.keys(o.all), ...Object.keys(n.all)]);
      for (const prop of props) {
        comparisons++;
        if (o.all[prop] !== n.all[prop]) {
          results[o.i].problems.add(
            `${width}px parent ${parents[o.p]} ${prop}: ${o.all[prop]} != ${n.all[prop]}`,
          );
        }
      }
    });
    if (width === 1280) {
      cases.forEach((c, i) => {
        const cells = newV.filter((v) => v.i === i);
        const v = cells[0].all;
        const show = [
          `color ${v["color"]}`,
          v["background-color"] !== "rgba(0, 0, 0, 0)"
            ? `background ${v["background-color"]}`
            : "",
          v["border-top-width"] !== "0px"
            ? `border ${v["border-top-color"]}`
            : "",
          `font-size ${v["font-size"]}`,
          `line-height ${cells.map((x) => x.all["line-height"]).join(" / ")}`,
          `weight ${v["font-weight"]}`,
          `tracking ${v["letter-spacing"]}`,
        ].filter(Boolean);
        results[i].shown = show.join("; ");
      });
    }
  }
  cases.forEach((c, i) => {
    const r = results[i];
    if (r.problems.size) failing++;
    rows.push(
      `| ${c.label} | \`${c.tag}\` | \`${c.oldClass}\` | \`${c.newClass}\` | ${r.shown} | ${r.problems.size ? "FAIL: " + [...r.problems].slice(0, 6).join("; ") : "identical (" + Math.round(comparisons / cases.length / 6) + " computed properties x 3 parents x 2 viewports)"} |`,
    );
  });
  await browser.close();
  const summary = `${cases.length} class strings (${pairs.length} distinct rewrites as written and through cn(), plus ${cases.length - pairs.length * 2} component merges) x 3 parent line-heights x 2 viewports, every computed property (${comparisons} property comparisons): ${failing} failing`;
  writeFileSync(outFile, rows.join("\n") + "\n\n" + summary + "\n");
  console.log(rows.join("\n"));
  console.log(summary);
  process.exitCode = failing ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
