// flow.css and tutorial.css, base against head: each compiled with Tailwind
// (its own checkout's tailwind.config.ts and globals.css, so @apply and the
// role variables resolve) next to xyflow's and shepherd's stylesheets, then
// rendered in Chromium at a 16px root on a mock canvas and tour. Every
// computed property of every element is compared in default, :hover and
// :active, and the pulse keyframes are compared at 0%, 50% and 100%.
//
//   npx tsx css-equivalence.mts <base frontend dir> <out.md>
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const HEAD = process.cwd();
const req = createRequire(join(HEAD, "package.json"));
const postcss = req("postcss");
const tailwindcss = req("tailwindcss");
const loadConfig = req("tailwindcss/loadConfig");
const { chromium } = req("@playwright/test");
const [baseDir, outFile] = process.argv.slice(2);
const FLOW = "src/app/(platform)/build/components/FlowEditor/Flow/flow.css";
const TOUR = "src/app/(platform)/build/components/FlowEditor/tutorial/tutorial.css";
const XY = readFileSync(join(HEAD, "node_modules/@xyflow/react/dist/style.css"), "utf8");
const SHEPHERD = readFileSync(join(HEAD, "node_modules/shepherd.js/dist/css/shepherd.css"), "utf8");

async function build(dir: string) {
  const config = loadConfig(join(dir, "tailwind.config.ts"));
  const run = (css: string, from: string) =>
    postcss([tailwindcss({ ...config, content: [{ raw: "", extension: "html" }] })]).process(css, { from }).then((r: { css: string }) => r.css);
  const globals = await run(readFileSync(join(dir, "src/app/globals.css"), "utf8"), join(dir, "src/app/globals.css"));
  const flow = await run(readFileSync(join(dir, FLOW), "utf8"), join(dir, FLOW));
  const tour = await run(readFileSync(join(dir, TOUR), "utf8"), join(dir, TOUR));
  // Same order as the app: globals, xyflow, flow.css, shepherd, tutorial.css.
  return { css: [globals, XY, flow, SHEPHERD, tour].join("\n"), flow, tour };
}

const DOM = `
<div style="width:600px;height:300px" class="react-flow" id="rf">
  <svg class="react-flow__background" id="bg" style="position:absolute;width:100%;height:100%;top:0;left:0">
    <pattern id="p" patternUnits="userSpaceOnUse" width="20" height="20"><circle class="react-flow__background-pattern dots" id="dot" cx="1" cy="1" r="1"></circle></pattern>
    <rect width="100%" height="100%" fill="url(#p)"></rect>
  </svg>
  <svg><g class="react-flow__edge"><path class="react-flow__edge-path" id="edge" d="M0 0L10 10"></path></g>
       <g class="react-flow__edge selected"><path class="react-flow__edge-path" id="edgesel" d="M0 0L10 10"></path></g></svg>
  <div class="react-flow__handle" id="handle"></div>
</div>
<div class="new-builder-tutorial-disable" id="disable">x</div>
<div class="new-builder-tutorial-highlight" id="hl"><span id="hlc">x</span></div>
<div class="new-builder-tutorial-pulse" id="pulse">x</div>
${["top", "bottom", "left", "right"].map((p) => `
<div class="shepherd-element new-builder-tour shepherd-enabled" data-popper-placement="${p}" id="tour-${p}">
  <div class="shepherd-content">
    <div class="shepherd-arrow" id="arrow-${p}"></div>
    <header class="shepherd-header" id="header-${p}"><h3 class="shepherd-title" id="title-${p}">Title</h3><button class="shepherd-cancel-icon" id="cancel-${p}"><span>×</span></button></header>
    <div class="shepherd-text" id="text-${p}"><p>Body</p></div>
    <footer class="shepherd-footer" id="footer-${p}"><button class="shepherd-button shepherd-button-secondary" id="sec-${p}">Back</button><button class="shepherd-button" id="pri-${p}">Next</button></footer>
  </div>
</div>`).join("")}`;

function forceable(css: string) {
  return css.replace(/(?<!\\):hover/g, ".fs-hover").replace(/(?<!\\):active/g, ".fs-active");
}

async function measure(page: any, css: string, state: string) {
  await page.setContent(`<!DOCTYPE html><html><head><style>${forceable(css)}</style><style>*{transition:none!important;animation-play-state:paused!important;animation-delay:0s!important}</style></head><body style="font-size:16px">${DOM}</body></html>`);
  if (state !== "default") await page.evaluate(`document.querySelectorAll("[id]").forEach((el) => el.classList.add("fs-${state}"))`);
  // tutorial.css sets `transition: all 150ms !important` at a specificity the
  // reset above cannot beat, so let every transition finish before reading.
  await page.waitForTimeout(600);
  return page.evaluate(`(() => {
    const out = {};
    for (const el of document.querySelectorAll("[id]")) {
      for (const pseudo of ["", "::before"]) {
        const s = getComputedStyle(el, pseudo || null);
        const o = {};
        for (let i = 0; i < s.length; i++) { const p = s[i]; if (!p.startsWith("--")) o[p] = s.getPropertyValue(p); }
        out[el.id + pseudo] = o;
      }
    }
    // Keyframes: resolve each frame's box-shadow on a probe element.
    const probe = document.createElement("div");
    document.body.appendChild(probe);
    for (const sheet of document.styleSheets) for (const rule of sheet.cssRules) {
      if (rule.type === CSSRule.KEYFRAMES_RULE && rule.name === "new-builder-tutorial-pulse") {
        for (const f of rule.cssRules) { probe.style.boxShadow = f.style.getPropertyValue("box-shadow"); out["keyframe " + f.keyText] = { "box-shadow": getComputedStyle(probe).boxShadow }; }
      }
    }
    return out;
  })()`);
}

const base = await build(baseDir);
const head = await build(HEAD);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
let diffs = 0, measured = 0;
const lines: string[] = [];
const shown: Record<string, string> = {};
for (const state of ["default", "hover", "active"]) {
  const a = await measure(page, base.css, state);
  const b = await measure(page, head.css, state);
  for (const id of Object.keys(a)) {
    for (const p of Object.keys(a[id])) {
      measured++;
      if (a[id][p] !== b[id]?.[p]) { diffs++; lines.push(`- DIFF ${state} ${id} ${p}: ${a[id][p]} -> ${b[id]?.[p]}`); }
    }
  }
  if (state === "default") {
    for (const [id, p] of [["bg", "background-color"], ["dot", "fill"], ["tour-top", "background-color"], ["title-top", "font-size"], ["title-top", "line-height"], ["title-top", "font-weight"], ["title-top", "color"], ["text-top", "color"], ["footer-top", "border-top-color"], ["pri-top", "font-size"], ["pri-top", "line-height"], ["pri-top", "font-weight"], ["pri-top", "color"], ["pri-top", "background-color"], ["sec-top", "background-color"], ["sec-top", "border-top-color"], ["arrow-top::before", "background-color"], ["keyframe 50%", "box-shadow"]] as const)
      shown[`${id} ${p}`] = b[id][p];
  }
  if (state === "hover") for (const [id, p] of [["pri-top", "background-color"], ["pri-top", "border-top-color"], ["sec-top", "background-color"], ["sec-top", "border-top-color"]] as const) shown[`${id}:hover ${p}`] = b[id][p];
}
await browser.close();
const changedDecls = (css: string) => css.split("\n").filter((l) => /var\(--color|@apply/.test(l)).length;
const summary = `flow.css + tutorial.css: ${measured} computed values (every property of ${Object.keys(shown).length ? "every mock element" : ""} in default/hover/active, plus keyframes) compared base vs head: ${diffs} differences`;
writeFileSync(outFile, `${summary}\n\n| element property | value at head (computed, 16px root) |\n| --- | --- |\n${Object.entries(shown).map(([k, v]) => `| \`${k}\` | ${v} |`).join("\n")}\n\n${lines.slice(0, 200).join("\n")}\n`);
console.log(summary);
lines.slice(0, 30).forEach((l) => console.log(l));
process.exitCode = diffs ? 1 : 0;
void changedDecls;
