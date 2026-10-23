/**
 * Interactive states that scripts/screenshot-pages.ts (route-only) cannot
 * reach: the dialogs and modals under components/contextual. Same
 * determinism as DS1's harness (args, viewports, reduced motion, pinned
 * clock, UTC/en-US, three identical shots in a row).
 *
 *   SCREENSHOT_EMAIL=… SCREENSHOT_PASSWORD=… GRAPH_ID=… \
 *   npx tsx capture-extra.ts --out <dir> [--base-url http://localhost:3000]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";

const req = createRequire(join(process.cwd(), "package.json"));
const { chromium } = req("@playwright/test");

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Page = any;

async function settle(page: Page) {
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.evaluate(
    () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
  );
}

async function stable(page: Page) {
  const opts = { fullPage: true, animations: "disabled", caret: "hide", scale: "css" };
  const deadline = Date.now() + 45_000;
  let prev = await page.screenshot(opts);
  let matches = 1;
  while (Date.now() < deadline) {
    await page.waitForTimeout(750);
    await settle(page);
    const next = await page.screenshot(opts);
    matches = next.equals(prev) ? matches + 1 : 1;
    prev = next;
    if (matches >= 3) return { image: prev, ok: true };
  }
  return { image: prev, ok: false };
}

async function open(page: Page, url: string) {
  await page.clock.setFixedTime(FIXED_TIME);
  await page.goto(url, { waitUntil: "load", timeout: 60_000 });
  await settle(page);
  const gotIt = page.getByRole("button", { name: "Got it", exact: true }).first();
  if (await gotIt.isVisible().catch(() => false)) {
    await gotIt.click();
    await page.reload({ waitUntil: "load", timeout: 60_000 });
    await settle(page);
  }
  // Let the page behind a dialog finish settling before opening it.
  await stable(page);
}

async function clickVisible(page: Page, role: string, name: RegExp | string) {
  const all = page.getByRole(role, { name });
  const n = await all.count();
  for (let i = 0; i < n; i++) {
    const el = all.nth(i);
    if (await el.isVisible().catch(() => false)) {
      await el.click();
      return;
    }
  }
  throw new Error(`no visible ${role} ${name}`);
}

async function stableElement(locator: any) {
  const deadline = Date.now() + 45_000;
  let prev = await locator.screenshot({ animations: "disabled", caret: "hide", scale: "css" });
  let matches = 1;
  while (Date.now() < deadline) {
    await locator.page().waitForTimeout(750);
    const next = await locator.screenshot({ animations: "disabled", caret: "hide", scale: "css" });
    matches = next.equals(prev) ? matches + 1 : 1;
    prev = next;
    if (matches >= 3) return { image: prev, ok: true };
  }
  return { image: prev, ok: false };
}

const SCENARIOS: { id: string; desktopOnly?: boolean; target?: (page: Page) => any; run: (page: Page, base: string) => Promise<void> }[] = [
  {
    id: "integrations-connect-dialog",
    run: async (page, base) => {
      await open(page, `${base}/settings/integrations`);
      await clickVisible(page, "button", "Connect Service");
      await page.getByRole("dialog").waitFor();
    },
  },
  {
    id: "integrations-connect-detail-github",
    run: async (page, base) => {
      await open(page, `${base}/settings/integrations`);
      await clickVisible(page, "button", "Connect Service");
      const dialog = page.getByRole("dialog");
      await dialog.waitFor();
      await dialog.getByPlaceholder(/search/i).first().fill("GitHub");
      await settle(page);
      await dialog.getByRole("button", { name: /GitHub/ }).first().click();
    },
  },
  {
    id: "marketplace-publish-select",
    run: async (page, base) => {
      await open(page, `${base}/marketplace`);
      await clickVisible(page, "button", /Publish/);
      await page.getByRole("dialog").waitFor();
    },
  },
  {
    id: "marketplace-publish-info",
    run: async (page, base) => {
      await open(page, `${base}/marketplace`);
      await clickVisible(page, "button", /Publish/);
      const dialog = page.getByRole("dialog");
      await dialog.waitFor();
      await dialog.getByText("Evidence workflow").first().click();
      await dialog.getByRole("button", { name: "Continue" }).click();
    },
  },
  {
    id: "build-agent-outputs",
    desktopOnly: true,
    run: async (page, base) => {
      await open(page, `${base}/build?flowID=${process.env.GRAPH_ID}&flowVersion=1`);
      await page.locator('[data-id="agent-outputs-button"], button[aria-label*="output" i]').first().click();
      await page.getByRole("dialog").waitFor();
    },
  },
  {
    id: "build-run-dialog",
    desktopOnly: true,
    run: async (page, base) => {
      await open(page, `${base}/build?flowID=${process.env.GRAPH_ID}&flowVersion=1`);
      await page.locator('[data-id="run-graph-button"]').first().click();
      await page.getByRole("dialog").waitFor();
    },
  },
  {
    // The dialog alone: the blurred builder canvas behind the overlay
    // rasterises differently on every run, the dialog does not.
    id: "build-run-dialog-only",
    desktopOnly: true,
    target: (page) => page.getByRole("dialog"),
    run: async (page, base) => {
      await open(page, `${base}/build?flowID=${process.env.GRAPH_ID}&flowVersion=1`);
      await page.locator('[data-id="run-graph-button"]').first().click();
      await page.getByRole("dialog").waitFor();
    },
  },
  {
    // LibraryAgentCard (framer layoutId, will-change: transform) settles on
    // a different sub-pixel transform each run; pin it so the page compares.
    id: "library-card-pinned",
    run: async (page, base) => {
      await open(page, `${base}/library`);
      await page.addStyleTag({
        content: '[data-testid="library-agent-card"]{transform:none!important;will-change:auto!important}',
      });
    },
  },
];

async function main() {
  const argv = process.argv.slice(2);
  const outDir = resolve(argv[argv.indexOf("--out") + 1]);
  const i = argv.indexOf("--base-url");
  const base = i >= 0 ? argv[i + 1] : "http://localhost:3000";
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ args: ARGS });
  const problems: string[] = [];
  try {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
        reducedMotion: "reduce",
        colorScheme: "light",
        locale: "en-US",
        timezoneId: "UTC",
      });
      const res = await context.request.post(`${base}/api/auth/sign-in/email`, {
        data: { email: process.env.SCREENSHOT_EMAIL, password: process.env.SCREENSHOT_PASSWORD },
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok()) throw new Error(`sign-in failed ${res.status()}`);
      const only = argv.includes("--only") ? argv[argv.indexOf("--only") + 1].split(",") : null;
      for (const s of SCENARIOS) {
        if (only && !only.includes(s.id)) continue;
        // The builder's run and output controls are not shown at 390px.
        if (s.desktopOnly && vp.name !== "desktop") continue;
        const page = await context.newPage();
        const file = join(outDir, `extra__${s.id}__${vp.name}.png`);
        try {
          await s.run(page, base);
          await settle(page);
          const { image, ok } = s.target ? await stableElement(s.target(page)) : await stable(page);
          writeFileSync(file, image);
          if (!ok) problems.push(`unstable ${file}`);
          console.log(`ok ${file}`);
        } catch (e) {
          problems.push(`${s.id} ${vp.name}: ${(e as Error).message.split("\n")[0]}`);
        }
        await page.close();
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
  if (problems.length) {
    console.error(problems.join("\n"));
    process.exitCode = 1;
  }
}

main();
