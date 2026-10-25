// Interactive-state evidence (deterministic setup from ../pr3/det.cjs) for #16081 (QUALITY 17 b): drives the same
// scenarios against two Storybook builds and records, per step, a screenshot
// and the DOM state (focused element, open popups, aria/data-state), with
// data-slot attributes and Radix-generated ids stripped so base and head can
// be compared exactly.
//
// usage: tsx interactive.ts capture <storybookUrl> <outDir>
//        tsx interactive.ts compare <dirA> <dirB>
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import type { Page } from "@playwright/test";

const { chromium } = createRequire(
  "/home/vercel-sandbox/autogpt/autogpt_platform/frontend/package.json",
)("@playwright/test") as typeof import("@playwright/test");
import {
  VIEWPORTS,
  comparePngs,
} from "../../autogpt_platform/frontend/scripts/screenshot-pages";

const ARGS = [
  "--disable-gpu",
  "--disable-gpu-rasterization",
  "--disable-partial-raster",
  "--num-raster-threads=1",
  "--disable-skia-runtime-opts",
  "--force-color-profile=srgb",
  "--font-render-hinting=none",
  "--disable-lcd-text",
];

type Step =
  | { hover: string }
  | { click: string }
  | { focus: string }
  | { press: string }
  | { tab: number }
  | { mouseAway: true }
  | { wait: number }
  | { shot: string };

interface Scenario {
  story: string;
  steps: Step[];
}

const ROOT = "#storybook-root";
const FIRST_BUTTON = `${ROOT} button >> nth=0`;

function tooltipFlow(story: string, trigger = FIRST_BUTTON): Scenario {
  return {
    story,
    steps: [
      { shot: "closed" },
      { hover: trigger },
      { shot: "hover-open" },
      { press: "Escape" },
      { shot: "hover-esc" },
      { mouseAway: true },
      { focus: "body" },
      { tab: 1 },
      { shot: "focus-open" },
      { press: "Escape" },
      { shot: "focus-esc" },
    ],
  };
}

const SCENARIOS: Scenario[] = [
  tooltipFlow("atoms-tooltip--default"),
  tooltipFlow("atoms-tooltip--with-icon"),
  tooltipFlow("atoms-tooltip--long-content"),
  tooltipFlow("atoms-tooltip--with-delay"),
  tooltipFlow("atoms-tooltip--multiple-tooltips"),
  tooltipFlow("atoms-tooltip--different-sides"),
  tooltipFlow("atoms-button--icon-only"),
  tooltipFlow("atoms-togglechip--basic"),
  {
    story: "atoms-overflowtext--long-text",
    steps: [
      { hover: `${ROOT} [data-state], ${ROOT} span >> nth=0` },
      { shot: "hover" },
    ],
  },
  {
    story: "atoms-button--primary",
    steps: [
      { hover: FIRST_BUTTON },
      { shot: "hover" },
      { mouseAway: true },
      { focus: "body" },
      { tab: 1 },
      { shot: "focus-visible" },
      { press: "Enter" },
      { shot: "after-enter" },
    ],
  },
  {
    story: "atoms-button--disabled",
    steps: [{ hover: FIRST_BUTTON }, { shot: "hover" }],
  },
  {
    story: "atoms-button--loading",
    steps: [{ hover: FIRST_BUTTON }, { shot: "hover" }],
  },
  {
    story: "atoms-link--primary",
    steps: [
      { hover: `${ROOT} a >> nth=0` },
      { shot: "hover" },
      { mouseAway: true },
      { focus: "body" },
      { tab: 1 },
      { shot: "focus-visible" },
    ],
  },
  {
    story: "atoms-input--default",
    steps: [
      { hover: `${ROOT} input >> nth=0` },
      { shot: "hover" },
      { mouseAway: true },
      { focus: "body" },
      { tab: 1 },
      { shot: "focus-visible" },
    ],
  },
  {
    story: "atoms-input--with-error",
    steps: [{ focus: "body" }, { tab: 1 }, { shot: "focus-error" }],
  },
  {
    story: "atoms-input--disabled",
    steps: [{ hover: `${ROOT} input >> nth=0` }, { shot: "hover" }],
  },
  {
    story: "atoms-input--input-types",
    steps: [
      { click: `${ROOT} button[aria-label="Show password"] >> nth=0` },
      { shot: "password-shown" },
      { press: "Tab" },
      { shot: "password-blur" },
    ],
  },
  {
    story: "atoms-input--textarea-input",
    steps: [{ focus: "body" }, { tab: 1 }, { shot: "focus-visible" }],
  },
  ...[
    "atoms-select--default",
    "atoms-select--with-value",
    "atoms-select--with-icons-and-separators",
    "atoms-select--small",
  ].map(
    (story): Scenario => ({
      story,
      steps: [
        { hover: `${ROOT} button[role=combobox] >> nth=0` },
        { shot: "hover" },
        { click: `${ROOT} button[role=combobox] >> nth=0` },
        { shot: "open" },
        { press: "ArrowDown" },
        // Radix Select moves focus on the next tick (setTimeout in
        // SelectContent's keydown), so a key pressed in the same tick races it.
        { wait: 200 },
        { shot: "arrow-down" },
        { press: "Escape" },
        { shot: "esc-closed" },
        { press: "Enter" },
        { shot: "enter-open" },
        { press: "ArrowDown" },
        { wait: 200 },
        { press: "Enter" },
        { shot: "selected" },
      ],
    }),
  ),
  {
    story: "atoms-select--with-error",
    steps: [{ focus: "body" }, { tab: 1 }, { shot: "focus-error" }],
  },
  {
    story: "atoms-select--disabled",
    steps: [
      { hover: `${ROOT} button[role=combobox] >> nth=0` },
      { shot: "hover" },
    ],
  },
  {
    story: "atoms-switch--basic",
    steps: [
      { hover: `${ROOT} button[role=switch] >> nth=0` },
      { shot: "hover" },
      { mouseAway: true },
      { focus: "body" },
      { tab: 1 },
      { shot: "focus-visible" },
      { press: "Space" },
      { shot: "toggled" },
    ],
  },
  {
    story: "atoms-switch--disabled",
    steps: [
      { hover: `${ROOT} button[role=switch] >> nth=0` },
      { shot: "hover" },
    ],
  },
  {
    story: "atoms-fileinput--default",
    steps: [
      { hover: FIRST_BUTTON },
      { shot: "hover" },
      { mouseAway: true },
      { focus: "body" },
      { tab: 1 },
      { shot: "focus-visible" },
    ],
  },
  {
    story: "atoms-fileinput--compact",
    steps: [
      { hover: FIRST_BUTTON },
      { shot: "hover" },
      { mouseAway: true },
      { focus: "body" },
      { tab: 1 },
      { shot: "focus-visible" },
    ],
  },
  ...[
    "renderers-formrenderer-primitive-fields--date-field",
    "renderers-formrenderer-primitive-fields--date-time-field",
  ].map(
    (story): Scenario => ({
      story,
      steps: [
        { click: `${ROOT} button[aria-haspopup=dialog] >> nth=0` },
        { shot: "popover-open" },
        { press: "Escape" },
        { shot: "popover-esc" },
      ],
    }),
  ),
  {
    story: "renderers-formrenderer-primitive-fields--time-field",
    steps: [
      { focus: "body" },
      { tab: 1 },
      { shot: "focus-visible" },
    ],
  },
];

// Determinism shared with every #16131 / #16134 evidence script.
const det = createRequire(__filename)("../pr3/det.cjs") as {
  settle: (page: Page) => Promise<void>;
  stableShot: (page: Page) => Promise<{ image: Buffer; stable: boolean }>;
  newPage: (ctx: import("@playwright/test").BrowserContext) => Promise<Page>;
};
const { settle, stableShot } = det;

// The DOM a user and assistive tech see, minus slots and generated ids.
const DOM_STATE_SCRIPT = `(() => {
  const ids = /radix-[^\\s"]+|«[^»]+»|:r[0-9a-z]+:|_r_[0-9a-z]+_/g;
  const describe = (el) => {
    if (!el) return null;
    if (el === document.body) return "body";
    const attrs = Array.from(el.attributes)
      .filter((a) => a.name !== "data-slot")
      .map((a) => a.name + "=" + a.value.replace(ids, "ID"))
      .sort();
    return el.tagName.toLowerCase() + " " + attrs.join(" ") + ' "' + (el.textContent || "").trim().slice(0, 60) + '"';
  };
  const popups = Array.from(
    document.querySelectorAll("[role=tooltip],[role=listbox],[role=dialog],[data-radix-popper-content-wrapper] > *"),
  ).map(describe);
  const clone = document.body.cloneNode(true);
  clone.querySelectorAll("[data-slot]").forEach((n) => n.removeAttribute("data-slot"));
  clone.querySelectorAll("script,style").forEach((n) => n.remove());
  return { focused: describe(document.activeElement), popups, html: clone.innerHTML.replace(ids, "ID") };
})()`;

// The DOM a user and assistive tech see, minus slots and generated ids.
async function domState(page: Page) {
  return page.evaluate(DOM_STATE_SCRIPT);
}

async function capture(storybook: string, outDir: string) {
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ args: ARGS });
  const unstable: string[] = [];
  const failed: string[] = [];
  try {
    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        reducedMotion: "reduce",
        colorScheme: "light",
        locale: "en-US",
        timezoneId: "UTC",
      });
      for (const scenario of SCENARIOS) {
        const page = await det.newPage(context);
        await page.goto(
          `${storybook}/iframe.html?id=${scenario.story}&viewMode=story`,
          { waitUntil: "load" },
        );
        await settle(page);
        const states: Record<string, unknown> = {};
        for (const step of scenario.steps) {
          try {
            if ("hover" in step)
              await page.locator(step.hover).first().hover({ force: true, timeout: 5_000 });
            else if ("click" in step)
              await page.locator(step.click).first().click({ timeout: 5_000 });
            else if ("focus" in step)
              await page.evaluate("document.activeElement && document.activeElement.blur()");
            else if ("press" in step) await page.keyboard.press(step.press);
            else if ("tab" in step)
              for (let i = 0; i < step.tab; i++) await page.keyboard.press("Tab");
            else if ("wait" in step) await page.waitForTimeout(step.wait);
            else if ("mouseAway" in step)
              await page.mouse.move(1, viewport.height - 1);
            else if ("shot" in step) {
              await page.waitForTimeout(250);
              const name = `${scenario.story}__${step.shot}__${viewport.name}`;
              const { image, stable } = await stableShot(page);
              if (!stable) unstable.push(name);
              writeFileSync(join(outDir, `${name}.png`), image);
              states[step.shot] = await domState(page);
            }
          } catch (error) {
            const message = `step ${JSON.stringify(step)} failed: ${(error as Error).message.split("\n")[0]}`;
            failed.push(`${scenario.story} ${viewport.name}: ${message}`);
            states[`error:${JSON.stringify(step)}`] = { focused: message, popups: [], html: "" };
          }
        }
        writeFileSync(
          join(outDir, `${scenario.story}__${viewport.name}.json`),
          JSON.stringify(states, null, 1),
        );
        await page.close();
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
  console.log(`${SCENARIOS.length} scenarios captured to ${outDir}`);
  if (unstable.length) console.log(`unstable: ${unstable.join(", ")}`);
  if (failed.length) console.log(`failed steps:\n${failed.join("\n")}`);
}

function compare(a: string, b: string) {
  const files = readdirSync(a).sort();
  let px = 0, dom = 0, shots = 0, jsons = 0;
  for (const f of files) {
    const left = readFileSync(join(a, f));
    let right: Buffer;
    try {
      right = readFileSync(join(b, f));
    } catch {
      console.log(`| ${f} | missing in ${b} |`);
      px++;
      continue;
    }
    if (f.endsWith(".png")) {
      shots++;
      const { diffPixels } = comparePngs(left, right);
      if (diffPixels) {
        px++;
        console.log(`| ${f} | ${diffPixels} px |`);
      }
    } else {
      jsons++;
      if (!left.equals(right)) {
        dom++;
        const l = JSON.parse(left.toString()), r = JSON.parse(right.toString());
        for (const k of Object.keys(l))
          for (const field of ["focused", "popups", "html"])
            if (JSON.stringify(l[k][field]) !== JSON.stringify(r[k]?.[field]))
              console.log(`| ${f} | step ${k}: ${field} differs |`);
      }
    }
  }
  console.log(
    `${shots} screenshots: ${px} differ; ${jsons} DOM-state files: ${dom} differ`,
  );
}

async function main() {
  const [cmd, x, y] = process.argv.slice(2);
  if (cmd === "capture") await capture(x, y);
  else compare(x, y);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
