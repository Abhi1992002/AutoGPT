/**
 * Interactive-state captures for DS3a part 3 (QUALITY rule 17 b/c/e).
 *
 *   SCREENSHOT_EMAIL=… SCREENSHOT_PASSWORD=… npx tsx interactions.ts \
 *     --out <dir> --base-url http://localhost:3000 --storybook-url http://localhost:6006
 *
 * Uses the same determinism as DS1's scripts/screenshot-pages.ts (software
 * raster, fixed clock, reduced motion, UTC/en-US, 3 identical shots in a row).
 * Every scenario writes a PNG per viewport and a facts entry: the tag, role,
 * aria-* and other attributes of the touched elements, the Tab order, whether
 * Escape closed the layer and where focus went. compare-interactions.ts diffs
 * two runs on pixels (threshold 0) and on facts.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";

const req = createRequire(
  join("/home/vercel-sandbox/autogpt/autogpt_platform/frontend", "package.json"),
);
const { chromium } = req("@playwright/test");
type Page = any;

function flag(name: string) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const outDir = resolve(flag("--out")!);
const baseUrl = flag("--base-url") ?? "http://localhost:3000";
const sbUrl = flag("--storybook-url") ?? "http://localhost:6006";
const only = flag("--only");
mkdirSync(outDir, { recursive: true });

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];
const FIXED_TIME = new Date("2026-01-15T12:00:00.000Z");
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

async function settle(page: Page) {
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.evaluate(
    () => new Promise((d) => requestAnimationFrame(() => requestAnimationFrame(d))),
  );
}

async function stableShot(page: Page) {
  const options = { fullPage: false, animations: "disabled", caret: "hide", scale: "css" };
  const deadline = Date.now() + 30_000;
  let prev = await page.screenshot(options);
  let n = 1;
  while (Date.now() < deadline) {
    await page.waitForTimeout(500);
    await settle(page);
    const next = await page.screenshot(options);
    n = next.equals(prev) ? n + 1 : 1;
    prev = next;
    if (n >= 3) return { image: next, stable: true };
  }
  return { image: prev, stable: false };
}

// Attributes that describe behaviour and accessibility, not generated ids.
async function describe(page: Page, selector: string) {
  return page.evaluate((sel: string) => {
    const els = Array.from(document.querySelectorAll(sel)).slice(0, 40);
    return els.map((el) => {
      const attrs: Record<string, string> = {};
      for (const a of Array.from(el.attributes)) {
        if (a.name === "id" || a.name === "for" || a.name.startsWith("aria-controls") || a.name === "aria-labelledby" || a.name === "aria-describedby") {
          attrs[a.name] = a.value ? "<id>" : "";
          continue;
        }
        if (a.name === "style" || a.name === "data-sentry-component" || a.name === "data-sentry-element" || a.name === "data-sentry-source-file") continue;
        attrs[a.name] = a.name === "class" ? "<class>" : a.value;
      }
      return {
        tag: el.tagName.toLowerCase(),
        attrs,
        text: (el.textContent ?? "").trim().slice(0, 60),
        children: Array.from(el.children).map((c) => c.tagName.toLowerCase()).join(","),
      };
    });
  }, selector);
}

async function active(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return "body";
    return `${el.tagName.toLowerCase()}[${el.getAttribute("role") ?? ""}] ${(el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 40)}`;
  });
}

async function tabOrder(page: Page, stops = 30) {
  const order: string[] = [];
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  for (let i = 0; i < stops; i++) {
    await page.keyboard.press("Tab");
    order.push(await active(page));
  }
  return order;
}

async function tabTo(page: Page, matcher: (a: string) => boolean, max = 60) {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  for (let i = 0; i < max; i++) {
    await page.keyboard.press("Tab");
    if (matcher(await active(page))) return true;
  }
  return false;
}

interface Scenario {
  name: string;
  app: boolean;
  url: string;
  viewports?: string[];
  steps: (page: Page, facts: Record<string, unknown>) => Promise<void>;
}

const BTN = "button, [role=button], [role=menuitem], input";

const SCENARIOS: Scenario[] = [
  // ---- Admin marketplace: SearchFilterForm (BaseInput + outline) ----
  { name: "admin-marketplace-rest", app: true, url: "/admin/marketplace", steps: async (p, f) => { f.controls = await describe(p, "main " + BTN); f.tab = await tabOrder(p, 20); } },
  { name: "admin-marketplace-typed", app: true, url: "/admin/marketplace", steps: async (p, f) => {
    const i = p.getByPlaceholder(/Search agents/);
    await i.click(); await p.keyboard.type("weather");
    f.focus = await active(p);
  } },
  { name: "admin-marketplace-search-hover", app: true, url: "/admin/marketplace", steps: async (p) => { await p.getByPlaceholder(/Search agents/).locator("xpath=following::button[1]").hover(); } },
  { name: "admin-marketplace-search-focus", app: true, url: "/admin/marketplace", steps: async (p, f) => { await p.getByPlaceholder(/Search agents/).focus(); await p.keyboard.press("Tab"); f.focus = await active(p); f.button = await p.getByPlaceholder(/Search agents/).locator("xpath=following::button[1]").evaluate((el: HTMLElement) => ({ tag: el.tagName, type: el.getAttribute("type"), aria: el.getAttribute("aria-label"), focused: el === document.activeElement })); } },
  { name: "admin-marketplace-approve-hover", app: true, url: "/admin/marketplace", steps: async (p) => { await p.getByRole("button", { name: "Approve" }).first().hover(); } },
  { name: "admin-marketplace-reject-focus", app: true, url: "/admin/marketplace", steps: async (p, f) => { f.reached = await tabTo(p, (a) => /^button.*Reject/.test(a)); } },
  { name: "admin-marketplace-approve-open", app: true, url: "/admin/marketplace", steps: async (p, f) => {
    await p.getByRole("button", { name: "Approve" }).first().click();
    await p.getByRole("dialog").waitFor();
    f.dialog = await describe(p, "[role=dialog] " + BTN + ", [role=dialog] textarea");
    f.focusOnOpen = await active(p);
    f.tabInDialog = await (async () => { const o: string[] = []; for (let i = 0; i < 5; i++) { await p.keyboard.press("Tab"); o.push(await active(p)); } return o; })();
  } },
  { name: "admin-marketplace-approve-esc", app: true, url: "/admin/marketplace", steps: async (p, f) => {
    await p.getByRole("button", { name: "Approve" }).first().click();
    await p.getByRole("dialog").waitFor();
    await p.keyboard.press("Escape");
    await p.getByRole("dialog").waitFor({ state: "hidden" }).catch(() => undefined);
    f.focusAfterEsc = await active(p);
  } },
  { name: "admin-marketplace-reject-open", app: true, url: "/admin/marketplace", steps: async (p, f) => {
    await p.getByRole("button", { name: "Reject" }).first().click();
    await p.getByRole("dialog").waitFor();
    f.dialog = await describe(p, "[role=dialog] " + BTN + ", [role=dialog] textarea");
    await p.getByRole("dialog").getByRole("button", { name: "Reject" }).hover();
  } },
  { name: "admin-marketplace-row-open", app: true, url: "/admin/marketplace", steps: async (p, f) => {
    await p.locator("main table tbody tr").first().click();
    await p.waitForTimeout(500);
    f.rowButtons = await describe(p, "main table " + BTN);
  } },
  { name: "admin-marketplace-download-hover", app: true, url: "/admin/marketplace", steps: async (p) => {
    await p.locator("main table tbody tr").first().click();
    await p.getByRole("button", { name: "Download" }).first().hover();
  } },
  { name: "admin-marketplace-pagination-hover", app: true, url: "/admin/marketplace", steps: async (p, f) => { const b = p.getByRole("button", { name: "Next" }).first(); f.pager = await p.getByRole("button", { name: /^(Previous|Next)$/ }).evaluateAll((els: HTMLButtonElement[]) => els.map((el) => ({ tag: el.tagName, disabled: el.disabled, type: el.getAttribute("type"), aria: el.getAttribute("aria-label") }))); await b.hover({ force: true }); } },
  // ---- Admin spending: AdminUserSearch (BaseInput), AddMoneyButton (default sm, outline, BaseInput) ----
  { name: "admin-spending-rest", app: true, url: "/admin/spending", steps: async (p, f) => { f.controls = await describe(p, "main " + BTN); f.tab = await tabOrder(p, 20); } },
  { name: "admin-spending-add-focus", app: true, url: "/admin/spending", steps: async (p, f) => { f.reached = await tabTo(p, (a) => /Add Dollars/.test(a)); } },
  { name: "admin-spending-add-cancel-hover", app: true, url: "/admin/spending", steps: async (p) => {
    await p.getByRole("button", { name: /add dollars/i }).first().click();
    await p.getByRole("dialog").getByRole("button", { name: "Cancel" }).hover();
  } },
  { name: "admin-spending-search-typed", app: true, url: "/admin/spending", steps: async (p) => { const i = p.locator("main input").first(); await i.click(); await p.keyboard.type("evidence"); } },
  { name: "admin-spending-add-hover", app: true, url: "/admin/spending", steps: async (p) => { await p.getByRole("button", { name: /add dollars/i }).first().hover(); } },
  { name: "admin-spending-add-open", app: true, url: "/admin/spending", steps: async (p, f) => {
    await p.getByRole("button", { name: /add dollars/i }).first().click();
    await p.getByRole("dialog").waitFor();
    f.dialog = await describe(p, "[role=dialog] " + BTN);
    const amount = p.locator("#dollarAmount"); await amount.click(); await p.keyboard.type("12.50");
    f.focus = await active(p);
  } },
  { name: "admin-spending-add-esc", app: true, url: "/admin/spending", steps: async (p, f) => {
    await p.getByRole("button", { name: /add dollars/i }).first().click();
    await p.getByRole("dialog").waitFor();
    await p.keyboard.press("Escape");
    await p.getByRole("dialog").waitFor({ state: "hidden" }).catch(() => undefined);
    f.focusAfterEsc = await active(p);
  } },
  // ---- Admin execution analytics: ExecutionAnalyticsForm (BaseInput) ----
  { name: "admin-analytics-rest", app: true, url: "/admin/execution-analytics", steps: async (p, f) => { f.controls = await describe(p, "main input, main button"); f.tab = await tabOrder(p, 20); } },
  { name: "admin-analytics-typed", app: true, url: "/admin/execution-analytics", steps: async (p, f) => {
    await p.locator("#graph_id").click(); await p.keyboard.type("graph-123");
    await p.locator("#graph_version").click(); await p.keyboard.type("3");
    f.focus = await active(p);
  } },
  { name: "admin-analytics-disabled-error", app: true, url: "/admin/execution-analytics", steps: async (p, f) => {
    // Submitting with the required graph id empty shows the browser's invalid state.
    f.invalid = await p.locator("#graph_id").first().evaluate((el: HTMLInputElement) => el.validity.valid);
    await p.locator("#user_id").first().focus();
  } },
  // ---- Builder: block menu (BlockMenuSearchBar, Block, MenuItem, chips), graph search ----
  { name: "build-rest", app: true, url: "/build", steps: async (p, f) => { f.controls = await describe(p, "[data-id^=menu-item], [data-id^=block-card]"); } },
  { name: "build-blockmenu-open", app: true, url: "/build", viewports: ["desktop"], steps: async (p, f) => {
    await p.locator('[data-id="blocks-control-popover-trigger"], [data-id="blocks-control-button"], button:has-text("Blocks")').first().click();
    await p.waitForTimeout(500);
    f.menu = await describe(p, "[data-id^=menu-item]");
    f.cards = (await describe(p, "[data-id^=block-card]")).slice(0, 5);
  } },
  { name: "build-blockmenu-typed", app: true, url: "/build", viewports: ["desktop"], steps: async (p, f) => {
    await p.locator('[data-id="blocks-control-popover-trigger"], [data-id="blocks-control-button"], button:has-text("Blocks")').first().click();
    const s = p.getByPlaceholder(/Blocks, Workflows/);
    await s.click(); await p.keyboard.type("zzzz-no-match");
    await p.waitForTimeout(800);
    f.search = await describe(p, "[placeholder^='Blocks, Workflows'] ~ *, [placeholder^='Blocks, Workflows']");
  } },
  { name: "build-blockmenu-hover-item", app: true, url: "/build", viewports: ["desktop"], steps: async (p) => {
    await p.locator('[data-id="blocks-control-popover-trigger"], [data-id="blocks-control-button"], button:has-text("Blocks")').first().click();
    await p.locator("[data-id^=menu-item]").nth(1).hover();
  } },
  { name: "build-blockmenu-esc", app: true, url: "/build", viewports: ["desktop"], steps: async (p, f) => {
    await p.locator('[data-id="blocks-control-popover-trigger"], [data-id="blocks-control-button"], button:has-text("Blocks")').first().click();
    await p.waitForTimeout(300);
    await p.keyboard.press("Escape");
    await p.waitForTimeout(300);
    f.focusAfterEsc = await active(p);
  } },
  // ---- Storybook: DateInput trigger + calendar (legacy ghost), Dialog drawer close (legacy link), Input atom focus ----
  { name: "sb-dateinput-open", app: false, url: "/iframe.html?id=renderers-formrenderer-primitive-fields--date-field&viewMode=story", steps: async (p, f) => {
    const t = p.locator("#root button, #storybook-root button").first();
    f.trigger = await describe(p, "#storybook-root button");
    await t.click();
    await p.waitForTimeout(300);
    f.calendar = (await describe(p, "[role=dialog] button, [role=grid] button")).slice(0, 12);
    f.focusOnOpen = await active(p);
  } },
  { name: "sb-dateinput-hover-day", app: false, url: "/iframe.html?id=renderers-formrenderer-primitive-fields--date-field&viewMode=story", steps: async (p) => {
    await p.locator("#storybook-root button").first().click();
    await p.locator("[role=gridcell] button, [role=grid] button").nth(10).hover();
  } },
  { name: "sb-dateinput-keys", app: false, url: "/iframe.html?id=renderers-formrenderer-primitive-fields--date-field&viewMode=story", steps: async (p, f) => {
    await p.locator("#storybook-root button").first().focus();
    f.triggerFocus = await active(p);
    await p.keyboard.press("Enter");
    await p.waitForTimeout(300);
    await p.keyboard.press("ArrowRight");
    f.afterArrow = await active(p);
    await p.keyboard.press("Escape");
    await p.waitForTimeout(300);
    f.focusAfterEsc = await active(p);
  } },
  { name: "sb-dateinput-trigger-focus", app: false, url: "/iframe.html?id=renderers-formrenderer-primitive-fields--date-field&viewMode=story", steps: async (p, f) => { f.reached = await tabTo(p, (a) => a.startsWith("button")); } },
  { name: "sb-dateinput-trigger-hover", app: false, url: "/iframe.html?id=renderers-formrenderer-primitive-fields--date-field&viewMode=story", steps: async (p) => { await p.locator("#storybook-root button").first().hover(); } },
  { name: "sb-dialog-drawer-open", app: false, url: "/iframe.html?id=molecules-dialog--basic&viewMode=story", viewports: ["mobile"], steps: async (p, f) => {
    await p.locator("#storybook-root button").first().click();
    await p.waitForTimeout(500);
    f.close = await describe(p, "[aria-label=Close]");
    f.focusOnOpen = await active(p);
  } },
  { name: "sb-dialog-drawer-close-focus", app: false, url: "/iframe.html?id=molecules-dialog--basic&viewMode=story", viewports: ["mobile"], steps: async (p, f) => {
    await p.locator("#storybook-root button").first().click();
    await p.waitForTimeout(500);
    f.tab = await (async () => { const o: string[] = []; for (let i = 0; i < 4; i++) { await p.keyboard.press("Tab"); o.push(await active(p)); } return o; })();
  } },
  { name: "sb-dialog-drawer-esc", app: false, url: "/iframe.html?id=molecules-dialog--basic&viewMode=story", viewports: ["mobile"], steps: async (p, f) => {
    const t = p.locator("#storybook-root button").first();
    await t.click();
    await p.waitForTimeout(500);
    await p.keyboard.press("Escape");
    await p.waitForTimeout(500);
    f.focusAfterEsc = await active(p);
  } },
  { name: "sb-input-focus", app: false, url: "/iframe.html?id=atoms-input--default&viewMode=story", steps: async (p, f) => {
    await p.locator("#storybook-root input").first().click();
    await p.keyboard.type("Hello");
    f.input = await describe(p, "#storybook-root input");
  } },
  { name: "sb-input-hover", app: false, url: "/iframe.html?id=atoms-input--default&viewMode=story", steps: async (p) => { await p.locator("#storybook-root input").first().hover(); } },
];

const OPEN_MENU = async (p: Page) => { await p.locator('[data-id="blocks-control-popover-trigger"]').click(); await p.locator('[data-id="blocks-control-popover-content"]').waitFor(); };
for (const item of ["suggestion", "all_blocks", "input_blocks", "integrations", "my_agents", "marketplace_agents"]) {
  SCENARIOS.push({ name: `build2-section-${item}`, app: true, url: "/build", viewports: ["desktop"], steps: async (p, f) => {
    await OPEN_MENU(p);
    await p.locator(`[data-id="menu-item-${item}"]`).click();
    await p.waitForTimeout(1500);
    f.buttons = (await describe(p, '[data-id="blocks-control-popover-content"] button')).slice(0, 25);
  } });
}
SCENARIOS.push({ name: "build2-section-all_blocks-hover-card", app: true, url: "/build", viewports: ["desktop"], steps: async (p) => {
  await OPEN_MENU(p);
  await p.locator('[data-id="menu-item-all_blocks"]').click();
  await p.waitForTimeout(1500);
  await p.locator('[data-id="blocks-control-popover-content"] [data-id^="block-card"]').first().hover();
} });
SCENARIOS.push({ name: "build2-section-all_blocks-focus-card", app: true, url: "/build", viewports: ["desktop"], steps: async (p, f) => {
  await OPEN_MENU(p);
  await p.locator('[data-id="menu-item-all_blocks"]').click();
  await p.waitForTimeout(1500);
  await p.locator('[data-id="blocks-control-popover-content"] [data-id^="block-card"]').first().focus();
  await p.keyboard.press("Shift+Tab"); await p.keyboard.press("Tab");
  f.focus = await active(p);
} });
SCENARIOS.push({ name: "build2-integration-open", app: true, url: "/build", viewports: ["desktop"], steps: async (p, f) => {
  await OPEN_MENU(p);
  await p.locator('[data-id="menu-item-integrations"]').click();
  await p.waitForTimeout(1500);
  await p.locator('[data-id="blocks-control-popover-content"] button.group').first().click();
  await p.waitForTimeout(1500);
  f.buttons = (await describe(p, '[data-id="blocks-control-popover-content"] button')).slice(0, 20);
} });
SCENARIOS.push({ name: "build2-search-results", app: true, url: "/build", viewports: ["desktop"], steps: async (p, f) => {
  await OPEN_MENU(p);
  await p.getByPlaceholder(/Blocks, Workflows/).click();
  await p.keyboard.type("Text");
  await p.waitForTimeout(2500);
  f.buttons = (await describe(p, '[data-id="blocks-control-popover-content"] button')).slice(0, 25);
} });
SCENARIOS.push({ name: "build2-search-clear-hover", app: true, url: "/build", viewports: ["desktop"], steps: async (p) => {
  await OPEN_MENU(p);
  await p.getByPlaceholder(/Blocks, Workflows/).click();
  await p.keyboard.type("Text");
  await p.waitForTimeout(2500);
  await p.getByPlaceholder(/Blocks, Workflows/).locator("xpath=following::button[1]").hover();
} });
SCENARIOS.push({ name: "build2-graph-search-open", app: true, url: "/build", viewports: ["desktop"], steps: async (p, f) => {
  await p.locator('[data-id="graph-search-control-popover-trigger"]').click();
  await p.waitForTimeout(800);
  f.input = await describe(p, "input[placeholder^='Search this workflow']");
  f.focus = await active(p);
} });
SCENARIOS.push({ name: "build2-graph-search-typed", app: true, url: "/build", viewports: ["desktop"], steps: async (p, f) => {
  await p.locator('[data-id="graph-search-control-popover-trigger"]').click();
  await p.getByPlaceholder(/Search this workflow/).click();
  await p.keyboard.type("input");
  await p.waitForTimeout(800);
  f.after = await describe(p, "input[placeholder^='Search this workflow'], input[placeholder^='Search this workflow'] ~ button");
  await p.keyboard.press("Escape");
  await p.waitForTimeout(300);
  f.focusAfterEsc = await active(p);
} });
const LEGACY_URL = "/iframe.html?id=atoms-button--legacy-variants&viewMode=story";
for (let i = 0; i < 20; i++) {
  SCENARIOS.push({ name: `sb-legacy-hover-${String(i).padStart(2, "0")}`, app: false, url: LEGACY_URL, viewports: ["desktop"], steps: async (p) => { await p.locator("#storybook-root button").nth(i).hover({ force: true }); } });
}
SCENARIOS.push({ name: "sb-legacy-tab", app: false, url: LEGACY_URL, steps: async (p, f) => {
  f.buttons = await describe(p, "#storybook-root button");
  f.tab = await tabOrder(p, 16);
} });
for (let i = 0; i < 15; i++) {
  SCENARIOS.push({ name: `sb-legacy-focus-${String(i).padStart(2, "0")}`, app: false, url: LEGACY_URL, viewports: ["desktop"], steps: async (p, f) => {
    await p.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    for (let k = 0; k <= i; k++) await p.keyboard.press("Tab");
    f.focus = await active(p);
  } });
}

async function main() {
  const browser = await chromium.launch({ args: ARGS });
  const facts: Record<string, unknown> = {};
  const list = only ? SCENARIOS.filter((s) => only.split(",").some((o) => s.name.startsWith(o))) : SCENARIOS.filter((s) => !s.name.startsWith("sb-legacy") && !s.name.startsWith("build2-"));
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
      colorScheme: "light",
      locale: "en-US",
      timezoneId: "UTC",
    });
    if (list.some((s) => s.app)) {
    const r = await context.request.post(`${baseUrl}/api/auth/sign-in/email`, {
      data: { email: process.env.SCREENSHOT_EMAIL, password: process.env.SCREENSHOT_PASSWORD },
      headers: { "Content-Type": "application/json", Origin: baseUrl },
    });
    if (!r.ok()) throw new Error(`sign-in ${r.status()}`);
    }
    for (const s of list) {
      if (s.viewports && !s.viewports.includes(vp.name)) continue;
      const key = `${s.name}__${vp.name}`;
      let f: Record<string, unknown> = {};
      for (let attempt = 0; attempt < 2; attempt++) {
        f = {};
        const page = await context.newPage();
        try {
          await page.clock.setFixedTime(FIXED_TIME);
          await page.goto((s.app ? baseUrl : sbUrl) + s.url, { waitUntil: "load", timeout: 60_000 });
          await settle(page);
          await (await stableShot(page)).image;
          await s.steps(page, f);
          await settle(page);
          const { image, stable } = await stableShot(page);
          writeFileSync(join(outDir, `${key}.png`), image);
          f.stable = stable;
        } catch (e) {
          f.error = String(e).split("\n")[0].slice(0, 200);
        }
        await page.close();
        if (!f.error) break;
      }
      facts[key] = f;
      console.log(key, f.error ? `ERROR ${f.error}` : f.stable ? "ok" : "not stable");
    }
    await context.close();
  }
  writeFileSync(join(outDir, "facts.json"), JSON.stringify(facts, null, 1));
  await browser.close();
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
