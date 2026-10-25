/** ButtonGroup inline (#16097): old components/ui/button-group strings (at #16083's head) vs the
 * private organisms/Message/components/ButtonGroup, merged as <Text> merges them. Every computed
 * property of every node, 5 parents x 2 widths, at rest and hovering the group. Uncommitted.
 *   npx tsx .ign-harness/eq-buttongroup.ts <base ref> <out.md> */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { cn } from "../src/lib/utils";
import { variants, tones } from "../src/components/atoms/Text/helpers";
const req = createRequire(join(process.cwd(), "package.json"));
const postcss = req("postcss"),
  tailwindcss = req("tailwindcss"),
  loadConfig = req("tailwindcss/loadConfig");
const [baseRef, outFile] = process.argv.slice(2);
const oldSrc = execSync(
  `git show ${baseRef}:autogpt_platform/frontend/src/components/ui/button-group.tsx`,
  { encoding: "utf8" },
);
const newSrc = readFileSync(
  "src/components/organisms/Message/components/ButtonGroup.tsx",
  "utf8",
);
const pick = (src: string, re: RegExp) => {
  const m = src.match(re);
  if (!m) throw new Error("not found: " + re);
  return m[1];
};
const GROUP_BASE_OLD = pick(oldSrc, /cva\(\s*"([^"]+)"/),
  GROUP_BASE_NEW = pick(newSrc, /cva\(\s*"([^"]+)"/);
const H_OLD = pick(oldSrc, /horizontal:\s*"([^"]+)"/),
  H_NEW = pick(newSrc, /horizontal:\s*"([^"]+)"/);
const TEXT_OLD = pick(oldSrc, /className=\{cn\(\s*"(shadow-xs[^"]+)"/),
  TEXT_NEW_BASE = pick(newSrc, /"(shadow-xs[^"]+)"/);
const SELECTOR =
  "[&>*:not(:first-child)]:rounded-l-md [&>*:not(:last-child)]:rounded-r-md";
const PAGE = "border-none bg-transparent text-neutral-500 shadow-none";
const btn =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-neutral-100 hover:text-neutral-900 h-8 w-8";
const html = (group: string, text: string) =>
  `<div data-n role="group" data-slot="button-group" data-orientation="horizontal" class="${group}"><button data-n class="${btn}">&lsaquo;</button><div data-n class="${text}">1 of 2</div><button data-n class="${btn}">&rsaquo;</button></div>`;
const newText = (caller?: string) =>
  cn(variants["body-medium-tight"], tones.inherit, cn(TEXT_NEW_BASE, caller));
const cases = [
  {
    label:
      "MessageBranchSelector group + MessageBranchPage text (the only use)",
    old: html(cn(cn(GROUP_BASE_OLD, H_OLD), SELECTOR), cn(TEXT_OLD, PAGE)),
    neu: html(cn(cn(GROUP_BASE_NEW, H_NEW), SELECTOR), newText(PAGE)),
  },
  {
    label: "ButtonGroupText with no caller class",
    old: html(cn(GROUP_BASE_OLD, H_OLD), cn(TEXT_OLD)),
    neu: html(cn(GROUP_BASE_NEW, H_NEW), newText()),
  },
  {
    label:
      "NEGATIVE CONTROL: Text body-medium (22px) instead of body-medium-tight",
    old: html(cn(GROUP_BASE_OLD, H_OLD), cn(TEXT_OLD, PAGE)),
    neu: html(
      cn(GROUP_BASE_NEW, H_NEW),
      cn(variants["body-medium"], tones.inherit, cn(TEXT_NEW_BASE, PAGE)),
    ),
    control: true,
  },
];
const PARENTS = [
  '<div class="leading-[1.5]" style="font-size:16px">',
  '<div class="leading-[30px]" style="font-size:16px">',
  '<div class="leading-normal" style="font-size:16px">',
  '<div class="font-sans text-foreground" style="font-size:16px">',
  '<div data-profile-tabs><div role="tabpanel" class="text-sm">',
];
const CLOSE = ["</div>", "</div>", "</div>", "</div>", "</div></div>"];
(async () => {
  const config = loadConfig(join(process.cwd(), "tailwind.config.ts"));
  const globals = readFileSync("src/app/globals.css", "utf8");
  const css = (
    await postcss([
      tailwindcss({
        ...config,
        content: [
          {
            raw:
              cases.map((c) => c.old + c.neu).join(" ") +
              " leading-[1.5] leading-[30px] leading-normal font-sans text-foreground text-sm",
            extension: "html",
          },
        ],
      }),
    ]).process(globals, { from: "src/app/globals.css" })
  ).css;
  const b = await chromium.launch();
  const rows = ["| case | result |", "| --- | --- |"];
  let failing = 0,
    caught = true,
    comps = 0;
  for (const c of cases) {
    const probs = new Set<string>();
    for (const w of [1280, 390])
      for (let pi = 0; pi < PARENTS.length; pi++) {
        const snap = async (h: string) => {
          const p = await b.newPage({ viewport: { width: w, height: 600 } });
          await p.setContent(
            `<!DOCTYPE html><html><head><style>${css}</style></head><body>${PARENTS[pi]}${h}${CLOSE[pi]}</body></html>`,
          );
          const read = () =>
            p.evaluate(() =>
              Array.from(document.querySelectorAll("[data-n]")).map((el) => {
                const s = getComputedStyle(el);
                const o: Record<string, string> = {};
                for (let i = 0; i < s.length; i++)
                  o[s[i]] = s.getPropertyValue(s[i]);
                const r = el.getBoundingClientRect();
                o.rect = `${r.x},${r.y},${r.width},${r.height}`;
                return o;
              }),
            );
          const a = await read();
          await p.hover("[role=group]");
          await p.waitForFunction(() => document.getAnimations().length === 0);
          const bb = await read();
          await p.close();
          return [a, bb];
        };
        const o = await snap(c.old),
          n = await snap(c.neu);
        o.forEach((st, si) =>
          st.forEach((po, ni) => {
            for (const k of new Set([
              ...Object.keys(po),
              ...Object.keys(n[si][ni]),
            ])) {
              comps++;
              if (po[k] !== n[si][ni][k])
                probs.add(
                  `${w}px p${pi} s${si} n${ni} ${k}: ${po[k]} != ${n[si][ni][k]}`,
                );
            }
          }),
        );
      }
    if (c.control) caught = probs.size > 0;
    else if (probs.size) failing++;
    rows.push(
      `| ${c.label} | ${c.control ? (probs.size ? `control FAILS as expected (${probs.size})` : "control did NOT fail") : probs.size ? "FAIL: " + [...probs].slice(0, 4).join("; ") : "identical (every computed property, 5 parents x 2 widths, rest + hover)"} |`,
    );
  }
  await b.close();
  const sum = `${cases.length - 1} cases (+1 negative control), ${comps} property comparisons: ${failing} failing; control caught: ${caught}`;
  const strings = `old group: ${GROUP_BASE_OLD} ${H_OLD}\nnew group: ${GROUP_BASE_NEW} ${H_NEW}\nold text:  ${TEXT_OLD}\nnew text:  ${newText()} (Text body-medium-tight + tone inherit + className)`;
  writeFileSync(
    outFile,
    rows.join("\n") + "\n\n" + sum + "\n\n```\n" + strings + "\n```\n",
  );
  console.log(rows.join("\n"));
  console.log(sum);
  process.exitCode = failing || !caught ? 1 : 0;
})();
