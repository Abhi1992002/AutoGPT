/**
 * Renders every class string this branch changed, old next to new, and
 * compares every computed property (getComputedStyle, all of them) of the
 * element, its two children and its ::placeholder.
 *
 *   npx tsx <this file> <pairs.json> <out dir>      (cwd: frontend dir)
 *
 * Each case sits inside parents at leading-[1.5], leading-[30px] and
 * leading-normal (16px font), as the second child of its parent (for even:),
 * at 1280px and 390px, in four states: plain; every pseudo-class forced on
 * the element and its parent (hover, focus, focus-visible, active,
 * focus-within: covers hover:, focus:, group-hover:, group-active:, ...);
 * the data-/aria- attributes its variants name set; and disabled (button and
 * input copies, for disabled:). Classes go through the same merge the
 * component does: as written, cn(), the Text variant for <Text>, Button's
 * cva for <Button>, and cn(probe, ...) for other components.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";


const FRONTEND = process.cwd();
const req = createRequire(join(FRONTEND, "package.json"));
const postcss = req("postcss");
const tailwindcss = req("tailwindcss");
const loadConfig = req("tailwindcss/loadConfig");
const { chromium } = req("@playwright/test");

interface Pair {
  file: string;
  line: number;
  old: string;
  new: string;
  ctx: { tag: string; variant: string | null; size: string | null; tone: string | null } | null;
}

interface Case {
  label: string;
  mode: string;
  where: string[];
  old: string;
  new: string;
}

const PARENTS = ["leading-[1.5]", "leading-[30px]", "leading-normal"];
const VIEWPORTS = [1280, 390];
// What a typical design-system component already carries before className.
const PROBE =
  "bg-popover text-popover-foreground border border-border text-sm leading-5 ring-ring shadow-md";

async function main() {
  const [pairsPath, outDir] = process.argv.slice(2);
  mkdirSync(outDir, { recursive: true });
  const { cn } = await import(join(FRONTEND, "src/lib/utils.ts"));
  console.log("loading helpers");
  const text = await import(join(FRONTEND, "src/components/atoms/Text/helpers.ts"));
  const button = await import(join(FRONTEND, "src/components/atoms/Button/helpers.ts"));
  const pairs: Pair[] = JSON.parse(readFileSync(pairsPath, "utf8")).pairs.filter(
    (p: Pair) => !p.new.includes("//"),
  );
  const extra: Pair[] = JSON.parse(readFileSync(pairsPath, "utf8")).extra ?? [];

  const byKey = new Map<string, Case>();
  function add(mode: string, oldC: string, newC: string, where: string, label: string) {
    const key = `${mode}\u0000${oldC}\u0000${newC}`;
    const existing = byKey.get(key);
    if (existing) {
      if (!existing.where.includes(where)) existing.where.push(where);
      return;
    }
    byKey.set(key, { label, mode, where: [where], old: oldC, new: newC });
  }
  for (const p of [...pairs, ...extra]) {
    const where = `${p.file.replace("src/components/", "")}:${p.line}`;
    const label = `${p.old} => ${p.new}`;
    const tag = p.ctx?.tag ?? "";
    // A <Text>/<Button> className never renders without the atom's own
    // classes, and a cn() combination never renders unmerged.
    const atomOnly = tag === "Text" || tag === "Button";
    if (!atomOnly && !(p as { cnOnly?: boolean }).cnOnly) add("as written", p.old, p.new, where, label);
    if (!atomOnly) add("cn()", cn(p.old), cn(p.new), where, label);
    if (tag === "Text") {
      const v = text.variants[p.ctx!.size || p.ctx!.variant || "body"] ?? text.variants.body;
      const tone = p.ctx!.tone ? text.tones[p.ctx!.tone] : undefined;
      add(`<Text ${p.ctx!.size || p.ctx!.variant}>`, cn(v, tone, p.old), cn(v, tone, p.new), where, label);
    } else if (tag === "Button") {
      const args = { variant: p.ctx!.variant ?? undefined, size: p.ctx!.size ?? undefined };
      add(
        `<Button ${args.variant ?? "default"}/${args.size ?? "default"}>`,
        button.extendedButtonVariants({ ...args, className: p.old }),
        button.extendedButtonVariants({ ...args, className: p.new }),
        where,
        label,
      );
    } else if (/^[A-Z]/.test(tag)) {
      add(`<${tag}> cn(probe, …)`, cn(PROBE, p.old), cn(PROBE, p.new), where, label);
    }
  }
  const cases = [...byKey.values()];

  // tailwind.config.ts, globals.css and colors.ts are identical on base and
  // head, so one stylesheet holds every old and every new class.
  const config = loadConfig(join(FRONTEND, "tailwind.config.ts"));
  const globals = readFileSync(join(FRONTEND, "src/app/globals.css"), "utf8");
  const raw = [...cases.flatMap((c) => [c.old, c.new]), ...PARENTS, "group peer"].join(" ");
  const css = (
    await postcss([tailwindcss({ ...config, content: [{ raw, extension: "html" }] })]).process(
      globals,
      { from: join(FRONTEND, "src/app/globals.css") },
    )
  ).css as string;

  const attrsFor = (cls: string) => {
    const attrs: Record<string, string> = {};
    for (const m of cls.matchAll(/(data|aria)-\[([\w-]+)(?:=([\w-]+))?\]:/g)) {
      attrs[`${m[1]}-${m[2]}`] = m[3] ?? "true";
    }
    return attrs;
  };
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

  function cell(i: number, side: "o" | "n", cls: string, parent: string) {
    const id = `${i}-${side}-${parent}`;
    return `<div class="group peer ${parent}" style="font-size:16px" data-parent="${id}"><i>x</i><div class="${esc(cls)}" data-el="${id}" data-kind="div"><span>Ag</span><span>b</span></div><input class="${esc(cls)}" data-el="${id}" data-kind="input" placeholder="Ag"><button class="${esc(cls)}" data-el="${id}" data-kind="button">Ag</button></div>`;
  }
  const BATCH = 40;
  const batches: number[][] = [];
  for (let s = 0; s < cases.length; s += BATCH) {
    batches.push(cases.slice(s, s + BATCH).map((_, k) => s + k));
  }
  console.log(`css ${css.length} bytes, ${cases.length} cases, ${batches.length} batches`);

  const browser = await chromium.launch();
  const failures = new Map<number, Set<string>>();
  const shown = new Map<number, string>();
  let checks = 0;
  for (const ids of batches) {
  const body = ids
    .flatMap((i) => PARENTS.flatMap((p) => [cell(i, "o", cases[i].old, p), cell(i, "n", cases[i].new, p)]))
    .join("");
  console.log(`batch ${ids[0]}..${ids[ids.length - 1]}`);
  for (const width of VIEWPORTS) {
    for (const state of ["plain", "forced", "attrs", "disabled"] as const) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.setContent(`<html><head><style>${css}</style><style>*,*::before,*::after,*::placeholder{transition:none!important;animation:none!important}</style></head><body>${body}</body></html>`);
      await page.evaluate("window.__name = (f) => f");
      if (state === "attrs") {
        await page.evaluate(
          (list) => {
            list.forEach(([i, attrs]) => {
              document.querySelectorAll(`[data-el^="${i}-"]`).forEach((el) => {
                for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
              });
            });
          },
          ids.map((i) => [i, attrsFor(`${cases[i].old} ${cases[i].new}`)] as const),
        );
      }
      if (state === "disabled") {
        await page.evaluate(() =>
          document.querySelectorAll("input[data-el],button[data-el]").forEach((el) => el.setAttribute("disabled", "")),
        );
      }
      if (state === "forced") {
        const cdp = await page.context().newCDPSession(page);
        await cdp.send("DOM.enable");
        await cdp.send("CSS.enable");
        const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
        const { nodeIds } = await cdp.send("DOM.querySelectorAll", {
          nodeId: root.nodeId,
          selector: "[data-el],[data-parent]",
        });
        for (const nodeId of nodeIds) {
          await cdp.send("CSS.forcePseudoState", {
            nodeId,
            forcedPseudoClasses: ["hover", "focus", "focus-visible", "active", "focus-within"],
          });
        }
      }
      const result = await page.evaluate(
        ({ ids, parents }) => {
          const all = (el: Element, pseudo?: string) => {
            const s = getComputedStyle(el, pseudo);
            const out: Record<string, string> = {};
            for (let k = 0; k < s.length; k++) out[s[k]] = s.getPropertyValue(s[k]);
            return out;
          };
          const diffs: { i: number; what: string }[] = [];
          const values: Record<number, Record<string, string>> = {};
          let compared = 0;
          for (const i of ids) {
            for (const parent of parents) {
              const olds = document.querySelectorAll(`[data-el="${i}-o-${parent}"]`);
              const news = document.querySelectorAll(`[data-el="${i}-n-${parent}"]`);
              olds.forEach((o, k) => {
                const nw = news[k];
                const kind = (o as HTMLElement).dataset.kind!;
                const nodes: [string, Element, Element, string?][] = [[kind, o, nw]];
                if (kind === "div") {
                  nodes.push(["div>span:1", o.children[0], nw.children[0]]);
                  nodes.push(["div>span:2", o.children[1], nw.children[1]]);
                }
                if (kind === "input") nodes.push(["input::placeholder", o, nw, "::placeholder"]);
                for (const [label, a, b, pseudo] of nodes) {
                  const va = all(a, pseudo);
                  const vb = all(b, pseudo);
                  compared++;
                  for (const prop of new Set([...Object.keys(va), ...Object.keys(vb)])) {
                    if (va[prop] !== vb[prop]) {
                      diffs.push({ i, what: `${parent} ${label} ${prop}: ${va[prop]} != ${vb[prop]}` });
                    }
                  }
                }
              });
              if (parent === "leading-[30px]") {
                const el = document.querySelector(`[data-el="${i}-n-${parent}"][data-kind="div"]`)!;
                const s = getComputedStyle(el);
                values[i] = Object.fromEntries(
                  [
                    "font-size", "line-height", "font-weight", "letter-spacing", "color",
                    "background-color", "border-top-color", "box-shadow", "text-decoration-color",
                  ].map((p) => [p, s.getPropertyValue(p)]),
                );
              }
            }
          }
          return { diffs, values, compared };
        },
        { ids, parents: PARENTS },
      );
      checks += result.compared;
      for (const d of result.diffs) {
        if (!failures.has(d.i)) failures.set(d.i, new Set());
        failures.get(d.i)!.add(`${width}px ${state} ${d.what}`);
      }
      if (width === 1280 && state === "plain") {
        for (const [i, v] of Object.entries(result.values)) {
          shown.set(
            Number(i),
            Object.entries(v)
              .filter(([p, val]) => !(p.endsWith("color") && val === "rgba(0, 0, 0, 0)") && !(p === "box-shadow" && val === "none"))
              .map(([p, val]) => `${p}: ${val}`)
              .join("; "),
          );
        }
      }
      await page.close();
    }
  }
  }
  await browser.close();

  const lines = [
    "| # | merge | old class string | new class string | computed (new, 1280px, parent leading-[30px], plain) | result | where |",
    "| --- | --- | --- | --- | --- | --- | --- |",
  ];
  cases.forEach((c, i) => {
    const f = failures.get(i);
    const result = f ? `FAIL: ${[...f].slice(0, 6).join("; ")}` : "identical (2 viewports × 4 states × 3 parents × div/span/span/input/::placeholder/button)";
    lines.push(
      `| ${i + 1} | ${c.mode} | \`${c.old}\` | \`${c.new}\` | ${shown.get(i)} | ${result} | ${c.where.join(", ")} |`,
    );
  });
  writeFileSync(join(outDir, "equivalence.md"), lines.join("\n") + "\n");
  const unique = new Set(cases.map((c) => `${c.old}\u0000${c.new}`)).size;
  const summary = `${pairs.length + extra.length} changed class strings, ${cases.length} cases (${unique} distinct old/new strings across merges), ${checks} node comparisons of every computed property: ${failures.size} failing`;
  writeFileSync(join(outDir, "summary.txt"), summary + "\n");
  console.log(summary);
  for (const [i, f] of failures) console.log(`FAIL ${cases[i].mode} | ${cases[i].old} | ${cases[i].new} | ${[...f].slice(0, 4).join(" ; ")}`);
  process.exitCode = failures.size ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
