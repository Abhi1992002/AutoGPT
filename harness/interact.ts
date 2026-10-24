// Interaction + keyboard captures for DS3b-2 (QUALITY rule 17 b), same
// determinism settings as scripts/screenshot-pages.ts. Writes
// interact__<name>__<viewport>.png and keyboard.json into --out.
// Usage: npx tsx interact.ts --out <dir> [--storybook <url>]
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const { chromium } = require(join(process.cwd(), "node_modules/@playwright/test"));

const ARGS = ["--disable-gpu","--disable-gpu-rasterization","--disable-partial-raster","--num-raster-threads=1","--disable-skia-runtime-opts","--force-color-profile=srgb","--font-render-hinting=none","--disable-lcd-text"];
const FIXED_TIME = new Date("2026-01-15T12:00:00.000Z");
const argv = process.argv;
const out = argv[argv.indexOf("--out") + 1];
const sb = argv.includes("--storybook") ? argv[argv.indexOf("--storybook") + 1] : "";
const base = "http://localhost:3000";
mkdirSync(out, { recursive: true });
const keyboard: Record<string, unknown> = {};

async function settle(page: any) {
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.evaluate(async () => { await document.fonts.ready; });
  // Same for base and head: land every finite animation on its end state and
  // drop infinite ones, so a shot never depends on when the action happened.
  await page.evaluate(() => document.getAnimations().forEach((a) => { try { a.finish(); } catch { a.cancel(); } }));
  await page.evaluate(() => new Promise((d) => requestAnimationFrame(() => requestAnimationFrame(d))));
}
async function stable(page: any, clip?: any, extraStyle = "") {
  // The greeting orb's entrance races the greeting request on dev itself (see
  // the determinism run), and no PR in this stack touches it: hide it, with its
  // glow, in every interaction shot, base and head alike. Layout is kept.
  const o = { animations: "disabled", caret: "hide", scale: "css", style: '[data-testid="onboarding-intro-card"] > div:first-child > span:first-child, [data-testid="greeting-loader"] > span[class*="size-16"], canvas { visibility: hidden !important; }' + extraStyle, ...(clip ? { clip } : {}) };
  let prev = await page.screenshot(o); let m = 1; const end = Date.now() + 45000;
  while (Date.now() < end) { await page.waitForTimeout(750); await settle(page); const n = await page.screenshot(o); m = n.equals(prev) ? m + 1 : 1; prev = n; if (m >= 3) return { img: n, ok: true }; }
  return { img: prev, ok: false };
}
async function shot(page: any, name: string, vp: string, clip?: { x: number; y: number; width: number; height: number }, extraStyle = "") {
  // The once-per-session "What's new" popup can surface late (after a sheet
  // closes); close it the way a user would before every shot.
  const pop = page.getByRole("button", { name: "Dismiss changelog", exact: true }).first();
  if (await pop.isVisible().catch(() => false)) { await pop.click(); await pop.waitFor({ state: "hidden", timeout: 5000 }).catch(() => undefined); }
  await settle(page);
  const { img, ok } = await stable(page, clip, extraStyle);
  writeFileSync(join(out, `interact__${name}__${vp}.png`), img);
  console.log(`${ok ? "ok" : "NOT STABLE"} ${name} ${vp}`);
}
function describeFocus() {
  const el = document.activeElement as HTMLElement | null;
  if (!el || el === document.body) return "body";
  const label = el.getAttribute("aria-label") || (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
  return [el.tagName.toLowerCase(), el.getAttribute("role") || "", el.getAttribute("data-sidebar") || "", el.getAttribute("aria-expanded") || "", el.getAttribute("data-state") || "", label].join("|");
}
async function tabOrder(page: any, n: number, fromCurrent = false) {
  await page.waitForTimeout(1500);
  await settle(page);
  if (!fromCurrent) await page.evaluate(() => { (document.activeElement as HTMLElement | null)?.blur(); window.getSelection()?.removeAllRanges(); });
  const seq: string[] = [];
  for (let i = 0; i < n; i++) { await page.keyboard.press("Tab"); seq.push(await page.evaluate(describeFocus)); }
  return seq;
}
async function settleCanvas(page: any) {
  // The tour's DotDistortionShader re-rolls its dots on every ResizeObserver
  // call, and how many calls the load's sidebar transition makes varies. Reseed
  // and resize by 1px and back so the last roll always starts from the seed.
  const vp = page.viewportSize();
  await page.evaluate(() => (window as any).__reseed?.());
  await page.setViewportSize({ width: vp.width + 1, height: vp.height });
  await page.waitForTimeout(300);
  await page.evaluate(() => (window as any).__reseed?.());
  await page.setViewportSize(vp);
  await page.waitForTimeout(300);
  await settle(page);
}
type Scn = { name: string; vp: "desktop" | "mobile"; url: string; app: boolean; run: (p: any, vp: string) => Promise<void> };
const toggle = (p: any) => p.getByRole("button", { name: "Toggle Sidebar" }).first();
const wallet = (p: any) => p.getByRole("button", { name: /Automation credits|Usage and credits/ }).first();
const SCENARIOS: Scn[] = [
  { name: "home", vp: "mobile", url: "/home", app: true, run: async (p, vp) => {
    await toggle(p).click(); await p.getByRole("dialog").first().waitFor();
    await shot(p, "home-sidebar-sheet-open", vp);
    keyboard["mobile sheet: focus after open"] = await p.evaluate(describeFocus);
    keyboard["mobile sheet: Tab order inside (8)"] = await tabOrder(p, 8, true);
    await p.keyboard.press("Escape"); await p.waitForTimeout(600);
    keyboard["mobile sheet: dialogs open after 1st Esc"] = await p.getByRole("dialog").count();
    keyboard["mobile sheet: focus after 1st Esc"] = await p.evaluate(describeFocus);
    await p.keyboard.press("Escape"); await p.waitForTimeout(600);
    keyboard["mobile sheet: dialogs open after 2nd Esc"] = await p.getByRole("dialog").count();
    keyboard["mobile sheet: focus after 2nd Esc"] = await p.evaluate(describeFocus);
    await shot(p, "home-sidebar-sheet-after-esc", vp);
  } },
  { name: "copilot", vp: "mobile", url: "/copilot", app: true, run: async (p, vp) => {
    await toggle(p).click(); await p.getByRole("dialog").first().waitFor();
    await shot(p, "copilot-sidebar-sheet-open", vp);
  } },
  { name: "home", vp: "desktop", url: "/home", app: true, run: async (p, vp) => {
    keyboard["desktop /home: Tab order (25)"] = await tabOrder(p, 25);
    await p.getByRole("button", { name: "Expand sidebar" }).first().click();
    await p.mouse.move(1350, 450);
    await shot(p, "home-sidebar-expanded", vp);
    keyboard["desktop /home expanded: focus after expand"] = await p.evaluate(describeFocus);
    await p.locator('[data-sidebar="menu-button"]:visible').nth(1).hover();
    await shot(p, "home-sidebar-expanded-menu-hover", vp);
    await p.mouse.move(1350, 450);
    const group = p.locator('[data-sidebar="group-label"][data-state="open"]:visible').first();
    await group.focus();
    await shot(p, "home-sidebar-navgroup-focus-visible", vp);
    await p.keyboard.press("Enter");
    keyboard["desktop sidebar nav group: Enter toggles, state after"] = await p.evaluate(describeFocus);
    await shot(p, "home-sidebar-navgroup-closed", vp);
    await p.keyboard.press("Space");
    keyboard["desktop sidebar nav group: Space toggles back, state after"] = await p.evaluate(describeFocus);
    keyboard["desktop /home expanded: Tab order from nav group (15)"] = await tabOrder(p, 15, true);
  } },
  { name: "copilot", vp: "desktop", url: "/copilot", app: true, run: async (p, vp) => {
    await p.locator('[data-slot="input-group-control"]').first().focus();
    await shot(p, "copilot-composer-focus-visible", vp);
    await p.locator('[data-slot="input-group-control"]').first().fill("Draft a weekly report");
    await p.locator('[data-slot="input-group-control"]').first().blur();
    await shot(p, "copilot-composer-typed-send-enabled", vp);
    await p.getByRole("button", { name: "Submit" }).first().hover();
    await shot(p, "copilot-composer-send-hover", vp);
    await p.locator('[data-slot="input-group-control"]').first().fill("");
    keyboard["desktop /copilot: Tab order (20)"] = await tabOrder(p, 20);
  } },
  { name: "copilot", vp: "mobile", url: "/copilot", app: true, run: async (p, vp) => {
    await p.locator('[data-slot="input-group-control"]').first().focus();
    await shot(p, "copilot-composer-focus-visible", vp);
  } },
  { name: "tour-chat", vp: "desktop", url: "/tour/chat", app: true, run: async (p, vp) => {
    await settleCanvas(p);
    const g = p.locator('[data-sidebar="group-label"][data-state="open"]').first();
    await g.click();
    // The tour's scripted demo keeps moving in the main panel on its own
    // timer; this scenario is about the sidebar's Collapsible group.
    await shot(p, "tour-chat-sidebar-group-closed", vp, { x: 0, y: 0, width: 300, height: 900 });
    keyboard["desktop /tour/chat: Tab order (15)"] = await tabOrder(p, 15);
  } },
  { name: "tour-chat", vp: "mobile", url: "/tour/chat", app: true, run: async (p, vp) => {
    await settleCanvas(p);
    await toggle(p).click(); await p.getByRole("dialog").first().waitFor();
    await shot(p, "tour-chat-sidebar-sheet-open", vp);
    await p.keyboard.press("Escape"); await p.getByRole("dialog").first().waitFor({ state: "hidden" });
    keyboard["mobile /tour/chat sheet: Esc closes, focus returns to"] = await p.evaluate(describeFocus);
  } },
  { name: "settings", vp: "desktop", url: "/settings/profile", app: true, run: async (p, vp) => {
    keyboard["desktop /settings/profile: Tab order (20)"] = await tabOrder(p, 20);
  } },
  { name: "build-graph-search", vp: "desktop", url: "/build", app: true, run: async (p, vp) => {
    await p.getByTestId("graph-search-control-button").first().waitFor();
    const pop = p.getByRole("button", { name: "Dismiss changelog", exact: true }).first();
    await pop.waitFor({ timeout: 8000 }).catch(() => undefined);
    if (await pop.isVisible().catch(() => false)) { await pop.click(); await pop.waitFor({ state: "hidden", timeout: 5000 }).catch(() => undefined); }
    await p.waitForTimeout(1500);
    await p.getByTestId("graph-search-control-button").first().click();
    await p.locator('[data-radix-popper-content-wrapper] input').first().waitFor({ timeout: 10000 });
    keyboard["builder graph search: ScrollArea viewports in popover"] = await p.locator("[data-radix-popper-content-wrapper] [data-radix-scroll-area-viewport]").count();
    // The popover closes itself once the canvas settles, so shoot it as soon as
    // it is open (CSS animations disabled), twice, and require both to match.
    await p.waitForTimeout(400);
    const o2 = { animations: "disabled", caret: "hide", scale: "css" };
    const g1 = await p.screenshot(o2); await p.waitForTimeout(300); const g2 = await p.screenshot(o2);
    writeFileSync(join(out, `interact__build-graph-search-open__${vp}.png`), g2);
    console.log(`${g1.equals(g2) ? "ok" : "NOT STABLE"} build-graph-search-open ${vp}`);
    await p.keyboard.press("Escape"); await p.waitForTimeout(400);
    keyboard["builder graph search: Esc closes, focus returns to"] = await p.evaluate(describeFocus);
  } },
  { name: "copilot-connect", vp: "desktop", url: "/copilot?modal=connect", app: true, run: async (p, vp) => {
    await p.getByRole("dialog").first().waitFor();
    keyboard["connect dialog: ScrollArea viewports"] = await p.locator('[role="dialog"] [data-radix-scroll-area-viewport]').count();
    keyboard["connect dialog: focus after open"] = await p.evaluate(describeFocus);
    // Chrome decides :focus-visible for the auto-focused dialog from the last
    // input modality, and focus trapping races the open: put keyboard focus on
    // the search field explicitly so every run shoots the same state.
    await p.getByRole("dialog").first().getByPlaceholder("Search services").focus();
    await p.keyboard.press("Shift+Tab"); await p.keyboard.press("Tab");
    keyboard["connect dialog: focus after one Tab"] = await p.evaluate(describeFocus);
    await shot(p, "copilot-connect-dialog-open", vp);
    keyboard["connect dialog: Tab order (8)"] = await tabOrder(p, 8, true);
    await p.keyboard.press("Escape"); await p.waitForTimeout(400);
    keyboard["connect dialog: dialogs open after Esc"] = await p.getByRole("dialog").count();
  } },
  { name: "copilot-connect", vp: "mobile", url: "/copilot?modal=connect", app: true, run: async (p, vp) => {
    await p.getByRole("dialog").first().waitFor();
    await p.waitForTimeout(1500);
    // Whether the drawer has trapped focus yet races its open; put keyboard
    // focus on the search field explicitly so every run shoots the same state.
    await p.getByRole("dialog").first().getByPlaceholder("Search services").focus();
    await p.keyboard.press("Shift+Tab"); await p.keyboard.press("Tab");
    keyboard["connect dialog mobile: focus after one Tab"] = await p.evaluate(describeFocus);
    await p.waitForTimeout(800);
    await p.evaluate(() => document.querySelectorAll('[role="dialog"] [data-radix-scroll-area-viewport]').forEach((v) => { (v as HTMLElement).scrollTop = 0; }));
    keyboard["connect dialog mobile: dialog transform"] = await p.evaluate(() => getComputedStyle(document.querySelector('[role="dialog"]') as HTMLElement).transform);
    await shot(p, "copilot-connect-dialog-open", vp);
  } },
  { name: "sb-accordion", vp: "desktop", url: "/iframe.html?id=molecules-accordion--default&viewMode=story", app: false, run: async (p, vp) => {
    const triggers = p.locator('button[aria-expanded]');
    await triggers.first().click();
    await shot(p, "sb-accordion-default-first-open", vp);
    keyboard["accordion: after click"] = await p.evaluate(describeFocus);
    await p.keyboard.press("ArrowDown");
    keyboard["accordion: ArrowDown moves focus to"] = await p.evaluate(describeFocus);
    await shot(p, "sb-accordion-default-arrowdown-focus-visible", vp);
    await p.keyboard.press("Enter");
    keyboard["accordion: Enter on second"] = await p.evaluate(describeFocus);
    await p.locator('button[aria-expanded]').nth(1).hover();
    await shot(p, "sb-accordion-default-second-open-hover", vp);
  } },
  { name: "sb-collapsible", vp: "desktop", url: "/iframe.html?id=molecules-collapsible--default&viewMode=story", app: false, run: async (p, vp) => {
    await p.locator('button[aria-expanded]').first().focus();
    await p.keyboard.press("Enter");
    keyboard["collapsible: Enter opens, state"] = await p.evaluate(describeFocus);
    await shot(p, "sb-collapsible-default-open-focus-visible", vp);
    await p.keyboard.press("Space");
    keyboard["collapsible: Space closes, state"] = await p.evaluate(describeFocus);
  } },
];
import { CHAT_SCENARIOS, stubChats } from "./scenarios-chats";
import { MISC_SCENARIOS, stubMisc, openWallet, walletPanel } from "./scenarios-misc";
import { WORK_SESSION_ID } from "./scenarios-chats";
// Evidence stories (EVSTORY=1, Storybook built with harness/evstory): components the app never mounts.
const EV = (id: string) => `/iframe.html?id=evidence-ds3b--${id}&viewMode=story`;
if (process.env.EVSTORY === "1") SCENARIOS.push(
  { name: "ev-feedback", vp: "desktop", url: EV("feedback-row"), app: false, run: async (p: any, vp: string) => {
    await shot(p, "ev-feedback-row", vp);
    await p.getByRole("button", { name: "Give feedback" }).hover();
    await shot(p, "ev-feedback-row-hover", vp);
    await p.mouse.move(5, 5);
    keyboard["ev feedback row: Tab order (2)"] = await tabOrder(p, 2);
    await shot(p, "ev-feedback-row-focus-visible", vp);
  } } as any,
  { name: "ev-wallet", vp: "desktop", url: EV("wallet-panel"), app: false, run: async (p: any, vp: string) => {
    await shot(p, "ev-wallet-full-panel", vp);
    keyboard["ev wallet full panel: ScrollArea viewports"] = await p.locator("[data-radix-scroll-area-viewport]").count();
    keyboard["ev wallet full panel: Tab order (6)"] = await tabOrder(p, 6);
    await shot(p, "ev-wallet-full-panel-focus-visible", vp);
  } } as any,
  { name: "ev-wallet", vp: "mobile", url: EV("wallet-panel"), app: false, run: async (p: any, vp: string) => { await shot(p, "ev-wallet-full-panel", vp); } } as any,
  { name: "ev-hero", vp: "desktop", url: EV("hero-text-generate-effect"), app: false, run: async (p: any, vp: string) => { await p.waitForTimeout(2500); await shot(p, "ev-hero-text-generate-effect", vp); } } as any,
  { name: "ev-hero", vp: "mobile", url: EV("hero-text-generate-effect"), app: false, run: async (p: any, vp: string) => { await p.waitForTimeout(2500); await shot(p, "ev-hero-text-generate-effect", vp); } } as any,
);
if (process.env.MISC === "1") SCENARIOS.push(
  // Esc closes, and where focus goes after it, for the wallet popover, the WorkOutputSheet and the ContextPanel sheet.
  { name: "misc-wallet-esc", vp: "desktop", url: "/home", app: true, stub: (page: any) => stubMisc(page, "wallet"), run: async (p: any, vp: string) => {
    await openWallet(p, vp);
    await p.keyboard.press("Escape"); await p.waitForTimeout(600);
    keyboard["wallet: open after Esc"] = await walletPanel(p).isVisible();
    keyboard["wallet: Esc closes, focus returns to"] = await p.evaluate(describeFocus);
    await shot(p, "wallet-closed-after-esc", vp);
  } } as any,
  ...(["desktop", "mobile"] as const).map((v) => ({ name: "misc-workout-esc", vp: v, url: `/copilot?sessionId=${WORK_SESSION_ID}`, app: true, stub: stubChats, run: async (p: any, vp: string) => {
    const card = p.getByTestId("work-card").first(); await card.waitFor();
    await card.getByRole("button", { name: "Open" }).click();
    const sheet = p.getByRole("dialog", { name: "Weekly sales report" }); await sheet.waitFor();
    keyboard[`work output sheet ${vp}: focus after open`] = await p.evaluate(describeFocus);
    await p.keyboard.press("Escape"); await sheet.waitFor({ state: "hidden", timeout: 5000 }).catch(() => undefined);
    keyboard[`work output sheet ${vp}: open after Esc`] = await sheet.isVisible();
    keyboard[`work output sheet ${vp}: Esc closes, focus returns to`] = await p.evaluate(describeFocus);
    await shot(p, "work-output-sheet-closed-after-esc", vp);
  } }) as any),
  { name: "misc-context-esc", vp: "mobile", url: `/copilot?sessionId=${WORK_SESSION_ID}`, app: true, stub: stubChats, run: async (p: any, vp: string) => {
    await p.getByTestId("work-card").first().waitFor();
    await shot(p, "copilot-session-workcard", vp);
    const trigger = p.getByRole("button", { name: "Open workspace files" }).first();
    await trigger.click();
    const panel = p.getByRole("dialog", { name: "Files" }); await panel.waitFor();
    keyboard["context panel sheet: focus after open"] = await p.evaluate(describeFocus);
    keyboard["context panel sheet: Tab order inside (5)"] = await tabOrder(p, 5, true);
    await p.keyboard.press("Escape"); await panel.waitFor({ state: "hidden", timeout: 5000 }).catch(() => undefined);
    keyboard["context panel sheet: open after Esc"] = await panel.isVisible();
    keyboard["context panel sheet: Esc closes, focus returns to"] = await p.evaluate(describeFocus);
    await shot(p, "context-panel-closed-after-esc", vp);
    await trigger.hover();
    await shot(p, "context-panel-trigger-hover", vp);
  } } as any,
);
// Targeted pass only (MISC=1): wallet, copilot EmptyHero and expert panel, run on the SHAs of the PRs that change them.
if (process.env.MISC === "1") for (const m of MISC_SCENARIOS) SCENARIOS.push({ ...(m as any), name: "misc-" + m.name, stub: (page: any) => stubMisc(page, (m as any).stub), run: (p: any, vp: string) => (m as any).run(p, vp, shot) });
for (const c of CHAT_SCENARIOS) SCENARIOS.push({ ...(c as any), stub: stubChats, run: (p: any, vp: string) => (c as any).run(p, vp, shot) });

(async () => {
  const browser = await chromium.launch({ args: ARGS });
  let failed = 0;
  let session: any = null;
  for (const s of SCENARIOS) {
    if (process.env.ONLY && !process.env.ONLY.split(",").includes(`${s.name}:${s.vp}`)) continue;
    if (!s.app && !sb) continue;
    if (s.app && argv.includes("--stories-only")) continue;
    if (!s.app && argv.includes("--app-only")) continue;
    if (process.env.EVSTORY === "1" && !s.name.startsWith("ev-")) continue;
    const vp = s.vp === "desktop" ? { width: 1440, height: 900 } : { width: 390, height: 844 };
    if (s.app && !session) {
      const c0 = await browser.newContext();
      for (let attempt = 0; ; attempt++) {
        const r = await c0.request.post(`${base}/api/auth/sign-in/email`, { data: { email: process.env.SCREENSHOT_EMAIL, password: process.env.SCREENSHOT_PASSWORD }, headers: { "Content-Type": "application/json" } });
        if (r.ok()) break;
        if (r.status() !== 429 || attempt > 6) throw new Error("sign-in failed " + r.status());
        await new Promise((d) => setTimeout(d, 10000));
      }
      session = await c0.storageState();
      await c0.close();
    }
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, reducedMotion: "reduce", colorScheme: "light", locale: "en-US", timezoneId: "UTC", ...(s.app ? { storageState: session } : {}) });
    const page = await ctx.newPage();
    try {
      await page.clock.setFixedTime(FIXED_TIME);
      if ((s as any).stub) await (s as any).stub(page);
      await page.goto((s.app ? base : sb) + s.url, { waitUntil: "load", timeout: 60000 });
      await settle(page);
      for (const label of ["Got it", "Dismiss changelog"]) {
        const b = page.getByRole("button", { name: label, exact: true }).first();
        if (await b.isVisible().catch(() => false)) { await b.click(); await b.waitFor({ state: "hidden", timeout: 5000 }).catch(() => undefined); await page.reload({ waitUntil: "load" }); await settle(page); }
      }
      await stable(page);
      await s.run(page, s.vp);
    } catch (e) { failed++; console.log(`FAILED ${s.name} ${s.vp}: ${(e as Error).message.split("\n")[0]}`); keyboard[`FAILED ${s.name} ${s.vp}`] = (e as Error).message.split("\n")[0]; }
    await ctx.close();
  }
  await browser.close();
  const file = join(out, argv.includes("--stories-only") ? "keyboard-stories.json" : "keyboard-app.json");
  writeFileSync(file, JSON.stringify(keyboard, null, 1));
  process.exit(failed ? 1 : 0);
})();
