/**
 * SECRT-3155 evidence: screenshots of the three surfaces whose cn() merge
 * changed, opened the way a user opens them, in the RUNNING app (and the
 * TextInputExpanderModal also from its Storybook story). Same deterministic
 * Chromium setup as DS1's scripts/screenshot-pages.ts (which only captures
 * routes and stories, so it cannot open a dialog), plus a fake microphone.
 *
 *   SCREENSHOT_EMAIL=… SCREENSHOT_PASSWORD=… npx tsx capture-dialogs.ts \
 *     --out <dir> --base-url http://localhost:3000 --storybook-url http://localhost:6006
 *
 * Compare two runs with `npx tsx scripts/screenshot-pages.ts compare a b --diff d`.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";

const req = createRequire(join(process.cwd(), "package.json"));
const { chromium } = req("@playwright/test");

const argv = process.argv.slice(2);
const flag = (n: string) => {
  const i = argv.indexOf(n);
  return i >= 0 ? argv[i + 1] : undefined;
};
const outDir = resolve(flag("--out") || "shots");
const baseUrl = flag("--base-url") || "http://localhost:3000";
const storybookUrl = flag("--storybook-url");
const only = (flag("--only") || "").split(",").filter(Boolean);

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
  "--use-fake-ui-for-media-stream",
  "--use-fake-device-for-media-stream",
];

async function settle(page: any) {
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.evaluate(
    () => new Promise((d) => requestAnimationFrame(() => requestAnimationFrame(d))),
  );
}

async function stable(page: any, target?: any) {
  const opts = { animations: "disabled", caret: "hide", scale: "css" } as const;
  const shot = () => (target ? target.screenshot(opts) : page.screenshot({ ...opts, fullPage: true }));
  const deadline = Date.now() + 45_000;
  let prev = await shot();
  let n = 1;
  while (Date.now() < deadline) {
    await page.waitForTimeout(750);
    await settle(page);
    const next = await shot();
    n = next.equals(prev) ? n + 1 : 1;
    prev = next;
    if (n >= 3) return { image: prev, stable: true };
  }
  return { image: prev, stable: false };
}

async function save(page: any, name: string, vp: string, target?: any) {
  const { image, stable: ok } = await stable(page, target);
  writeFileSync(join(outDir, `${name}--${vp}.png`), image);
  console.log(`${ok ? "ok      " : "UNSTABLE"} ${name}--${vp}`);
}

async function newContext(browser: any, vp: (typeof VIEWPORTS)[number]) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
    colorScheme: "light",
    locale: "en-US",
    timezoneId: "UTC",
    permissions: ["microphone"],
  });
  return ctx;
}

async function signIn(ctx: any, email: string, password: string, signUp = false) {
  if (signUp) {
    await ctx.request.post(`${baseUrl}/api/auth/sign-up/email`, {
      data: { email, password, name: "Evidence User" },
      headers: { Origin: baseUrl },
    });
  }
  const r = await ctx.request.post(`${baseUrl}/api/auth/sign-in/email`, { data: { email, password }, headers: { Origin: baseUrl } });
  if (!r.ok()) throw new Error(`sign-in ${r.status()} ${await r.text()}`);
}


// Interactive states and a keyboard check for an open dialog/popover:
// hover on each footer button, focus-visible after each Tab, the Tab order,
// Esc closes, and where focus lands after closing. The log is written as JSON
// so base and head can be diffed as text.
async function states(page: any, surface: any, name: string, vp: string, trigger: any, opts: { textarea?: boolean } = {}) {
  const log: Record<string, unknown> = {};
  const buttons = surface.getByRole("button");
  const count = await buttons.count();
  for (let i = 0; i < count; i++) {
    const b = buttons.nth(i);
    if (!(await b.isVisible().catch(() => false))) continue;
    try {
      await b.hover({ timeout: 3_000 });
    } catch {
      console.log(`hover-skip ${name}-hover-${i}--${vp} (covered by another element)`);
      continue;
    }
    await save(page, `${name}-hover-${i}`, vp, surface);
  }
  await page.mouse.move(0, 0);
  if (opts.textarea) {
    await surface.locator("textarea").first().click();
    await save(page, `${name}-textarea-focus`, vp, surface);
  }
  const order: string[] = [];
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    const label = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return "none";
      return `${el.tagName.toLowerCase()}[${el.getAttribute("aria-label") || el.textContent?.trim().slice(0, 30) || el.getAttribute("placeholder") || ""}]`;
    });
    order.push(label);
    if (i < 3) await save(page, `${name}-focus-visible-${i}`, vp, surface);
  }
  log.tabOrder = order;
  log.role = await surface.getAttribute("role");
  log.ariaModal = await surface.getAttribute("aria-modal");
  log.dataState = await surface.getAttribute("data-state");
  await page.keyboard.press("Escape");
  await surface.waitFor({ state: "hidden", timeout: 5_000 }).then(() => (log.escCloses = true)).catch(() => (log.escCloses = false));
  await page.waitForTimeout(300);
  log.focusAfterClose = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    return el ? `${el.tagName.toLowerCase()}[${el.getAttribute("aria-label") || el.textContent?.trim().slice(0, 30) || ""}]` : "none";
  });
  log.focusReturnsToTrigger = trigger ? await trigger.evaluate((t: HTMLElement) => t === document.activeElement || t.contains(document.activeElement)) : "n/a";
  await page.mouse.move(0, 0);
  await save(page, `${name}-closed`, vp);
  writeFileSync(join(outDir, `keyboard-${name}--${vp}.json`), JSON.stringify(log, null, 2));
  console.log(`keyboard ${name}--${vp} ${JSON.stringify(log)}`);
}

// BlockMenu: the builder's "Blocks" popover (legacy PopoverContent).
async function blockMenu(browser: any, vp: (typeof VIEWPORTS)[number]) {
  const ctx = await newContext(browser, vp);
  await signIn(ctx, process.env.SCREENSHOT_EMAIL!, process.env.SCREENSHOT_PASSWORD!);
  const page = await ctx.newPage();
  await page.clock.setFixedTime(FIXED_TIME);
  await page.goto(`${baseUrl}/build`, { waitUntil: "load", timeout: 90_000 });
  await settle(page);
  const gotIt = page.getByRole("button", { name: "Got it", exact: true });
  if (await gotIt.first().isVisible().catch(() => false)) {
    await gotIt.first().click();
    await gotIt.first().waitFor({ state: "hidden", timeout: 5_000 }).catch(() => undefined);
    await page.reload({ waitUntil: "load", timeout: 90_000 });
    await settle(page);
  }
  const anyway = page.getByRole("button", { name: "Continue anyway", exact: true });
  if (await anyway.first().isVisible().catch(() => false)) {
    await anyway.first().click();
    await anyway.first().waitFor({ state: "hidden", timeout: 5_000 }).catch(() => undefined);
  }
  const trigger = page.getByTestId("blocks-control-blocks-button");
  await trigger.waitFor({ timeout: 60_000 });
  if (process.env.DEBUG_SHOTS) writeFileSync(join(outDir, `debug-build-${vp.name}.png`), await page.screenshot());
  await trigger.click();
  const pop = page.locator('[data-id="blocks-control-popover-content"]');
  await pop.waitFor({ timeout: 30_000 });
  await page.mouse.move(0, vp.height - 1);
  await save(page, "app-build-blockmenu", vp.name);
  await save(page, "app-build-blockmenu-element", vp.name, pop);
  await states(page, pop, "app-build-blockmenu", vp.name, trigger);
  await trigger.click();
  await pop.waitFor({ timeout: 30_000 });
  // TextInputExpanderModal in the builder: add a block with a text field
  // from the open menu, then expand that field.
  await pop.getByText("Input blocks", { exact: true }).click();
  await page.waitForTimeout(2500);
  if (process.env.DEBUG_SHOTS) writeFileSync(join(outDir, `debug-search-${vp.name}.png`), await page.screenshot());
  await pop.getByText(/Short Text Input/).first().evaluate((el: HTMLElement) => el.click());
  await page.keyboard.press("Escape");
  const expand = page.getByRole("button", { name: "Expand input" }).first();
  await expand.waitFor({ timeout: 30_000 });
  await expand.click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ timeout: 15_000 });
  await page.mouse.move(0, vp.height - 1);
  await save(page, "app-build-text-expander", vp.name);
  await save(page, "app-build-text-expander-element", vp.name, dialog);
  await states(page, dialog, "app-build-text-expander", vp.name, expand, { textarea: true });
  await ctx.close();
}

// CancelRecordingDialog: onboarding brain dump → Talk → Cancel recording.
// Onboarding only runs once per user, so every capture signs up a new one.
async function cancelRecording(browser: any, vp: (typeof VIEWPORTS)[number]) {
  const ctx = await newContext(browser, vp);
  const email = `radius-${Date.now()}-${vp.name}@example.com`;
  await signIn(ctx, email, "radius-evidence-pw-123", true);
  const page = await ctx.newPage();
  await page.clock.setFixedTime(FIXED_TIME);
  await page.goto(`${baseUrl}/onboarding`, { waitUntil: "load", timeout: 90_000 });
  await settle(page);
  const role = page.getByText("What best describes you");
  const subscription = page.getByText(/choose the plan that.s right/i);
  for (let i = 0; i < 6 && !(await role.isVisible().catch(() => false)); i++) {
    if (await subscription.isVisible().catch(() => false)) {
      await page.getByRole("button", { name: "Get Pro" }).click();
    } else {
      await page.getByRole("button", { name: "Next", exact: true }).click().catch(() => undefined);
    }
    await page.waitForTimeout(1500);
  }
  await role.waitFor({ timeout: 15_000 });
  await page.getByText("Engineering", { exact: false }).first().click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Talk", exact: true }).click({ timeout: 30_000 });
  const cancel = page.getByRole("button", { name: "Cancel recording" });
  await cancel.waitFor({ timeout: 30_000 });
  await page.mouse.move(0, 0);
  await save(page, "app-onboarding-cancel-recording-dialog-before-open", vp.name);
  await cancel.click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ timeout: 15_000 });
  await page.mouse.move(0, 0);
  await save(page, "app-onboarding-cancel-recording-dialog", vp.name, dialog);
  await states(page, dialog, "app-onboarding-cancel-recording-dialog", vp.name, cancel);
  await ctx.close();
}

// TextInputExpanderModal through its Storybook story (Primitive Fields).
async function expanderStory(browser: any, vp: (typeof VIEWPORTS)[number], storyId: string) {
  const ctx = await newContext(browser, vp);
  const page = await ctx.newPage();
  await page.clock.setFixedTime(FIXED_TIME);
  await page.goto(`${storybookUrl}/iframe.html?id=${storyId}&viewMode=story`, { waitUntil: "load", timeout: 60_000 });
  await settle(page);
  const expand = page.getByRole("button", { name: "Expand input" }).first();
  await expand.waitFor({ timeout: 30_000 });
  await save(page, `story-${storyId}-expander-before-open`, vp.name);
  await expand.click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ timeout: 15_000 });
  await page.mouse.move(0, 0);
  await save(page, `story-${storyId}-expander`, vp.name);
  await save(page, `story-${storyId}-expander-element`, vp.name, dialog);
  await states(page, dialog, `story-${storyId}-expander`, vp.name, expand, { textarea: true });
  await ctx.close();
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ args: ARGS });
  const want = (k: string) => only.length === 0 || only.includes(k);
  for (const vp of VIEWPORTS) {
    for (const [key, run] of [
      ["blockmenu", () => blockMenu(browser, vp)],
      ["cancel", () => cancelRecording(browser, vp)],
      ...(storybookUrl
        ? (flag("--expander-stories") || "").split(",").filter(Boolean).map((id) => [
            "expander",
            () => expanderStory(browser, vp, id),
          ])
        : []),
    ] as [string, () => Promise<void>][]) {
      if (!want(key)) continue;
      try {
        await run();
      } catch (e) {
        console.log(`FAILED  ${key}--${vp.name}: ${(e as Error).message.split("\n")[0]}`);
      }
    }
  }
  await browser.close();
}
main();
