// Captures the states a page load never shows (open popovers, calendar,
// multiselect list, login error help, admin dialogs) with the same
// determinism as scripts/screenshot-pages.ts: fixed viewports, device scale 1,
// software raster, reduced motion, animations disabled, fixed clock, UTC/en-US,
// fonts awaited, and retaken until 3 consecutive screenshots are identical.
//   npx tsx .ign-interact.mts <outDir> <appUrl> <storybookUrl>
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium, type Page } from "@playwright/test";
const [outDir, app, sb] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const ARGS = ["--disable-gpu","--disable-gpu-rasterization","--disable-partial-raster","--num-raster-threads=1","--disable-skia-runtime-opts","--force-color-profile=srgb","--font-render-hinting=none","--disable-lcd-text"];
const VIEWPORTS = [{ name: "desktop", width: 1440, height: 900 }, { name: "mobile", width: 390, height: 844 }];
const FIXED = new Date("2026-01-15T12:00:00.000Z");
async function settle(page: Page) {
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.evaluate(() => new Promise((d) => requestAnimationFrame(() => requestAnimationFrame(d))));
}
async function stable(page: Page) {
  const o = { fullPage: true, animations: "disabled", caret: "hide", scale: "css" } as const;
  const deadline = Date.now() + 45_000;
  let prev = await page.screenshot(o); let m = 1;
  while (Date.now() < deadline) {
    await page.waitForTimeout(750); await settle(page);
    const next = await page.screenshot(o);
    m = next.equals(prev) ? m + 1 : 1; prev = next;
    if (m >= 3) return { img: next, ok: true };
  }
  return { img: prev, ok: false };
}
const report: Record<string, unknown> = {};
async function describeActive(p: Page) {
  return p.evaluate(() => {
    const a = document.activeElement as HTMLElement | null;
    if (!a) return "none";
    const attrs = ["role", "aria-label", "aria-expanded", "aria-haspopup", "data-id", "data-state", "type", "name"].map((k) => a.getAttribute(k) ? `${k}=${a.getAttribute(k)}` : "").filter(Boolean).join(" ");
    return `${a.tagName.toLowerCase()} ${attrs} "${(a.innerText || a.getAttribute("value") || "").trim().slice(0, 40)}"`;
  });
}
async function tabTrace(p: Page, n = 25) {
  const out: string[] = [];
  for (let i = 0; i < n; i++) { await p.keyboard.press("Tab"); out.push(await describeActive(p)); }
  return out;
}
async function aria(p: Page, sel = "body") {
  return p.locator(sel).first().ariaSnapshot().catch((e) => `ERR ${(e as Error).message.split("\n")[0]}`);
}
async function tabTo(p: Page, sel: string, max = 60) {
  await p.locator("body").click({ position: { x: 1, y: 1 } }).catch(() => undefined);
  for (let i = 0; i < max; i++) {
    await p.keyboard.press("Tab");
    if (await p.evaluate((s) => { const el = document.querySelector(s); return !!el && (el === document.activeElement || el.contains(document.activeElement)); }, sel)) return i + 1;
  }
  return -1;
}
type Step = { name: string; url: string; signedIn: boolean; act: (p: Page) => Promise<void> };
const story = (id: string) => `${sb}/iframe.html?id=${id}&viewMode=story`;
const steps: Step[] = [
  { name: "build-blockmenu-open", url: `${app}/build`, signedIn: true, act: async (p) => { await p.locator('[data-id="blocks-control-popover-trigger"]').first().click(); await p.locator('[data-id="blocks-control-popover-content"]').waitFor({ timeout: 15000 }); } },
  { name: "build-savecontrol-open", url: `${app}/build`, signedIn: true, act: async (p) => { await p.locator('[data-id="save-control-popover-trigger"]').first().click(); await p.locator('[data-id="save-control-popover-content"]').waitFor({ timeout: 15000 }); } },
  { name: "build-agentoutputs-open", url: `${app}/build`, signedIn: true, act: async (p) => { await p.locator('[data-id="agent-outputs-button"]').first().click({ force: true }); await p.getByRole("dialog").waitFor({ timeout: 10000 }); } },
  { name: "build-blockmenu-filter", url: `${app}/build`, signedIn: true, act: async (p) => { await p.locator('[data-id="blocks-control-popover-trigger"]').first().click(); await p.locator('[data-id="blocks-control-popover-content"]').waitFor({ timeout: 15000 }); await p.locator('[data-id="blocks-control-popover-content"] button').filter({ hasText: /filter/i }).first().click({ timeout: 5000 }); await p.waitForTimeout(800); } },
  { name: "admin-diagnostics", url: `${app}/admin/diagnostics`, signedIn: true, act: async () => {} },
  { name: "login-error-help", url: `${app}/login`, signedIn: false, act: async (p) => { await p.getByLabel("Email").first().fill("nobody-evidence@example.com"); await p.getByLabel("Password").first().fill("wrong-password-123"); await p.getByRole("button", { name: "Log in" }).click(); await p.waitForTimeout(3000); } },
  { name: "story-datefield-open", url: story("renderers-formrenderer-primitive-fields--date-field"), signedIn: false, act: async (p) => { await p.getByRole("button").filter({ hasText: /pick a date|select|date/i }).first().click(); await p.getByRole("grid").first().waitFor({ timeout: 10000 }); } },
  { name: "story-datetimefield-open", url: story("renderers-formrenderer-primitive-fields--date-time-field"), signedIn: false, act: async (p) => { await p.getByRole("button").filter({ hasText: /pick|select|date/i }).first().click(); await p.getByRole("grid").first().waitFor({ timeout: 10000 }); } },
  { name: "story-multiselect-open", url: story(process.env.MS_STORY || "renderers-formrenderer-complex-schemas--multi-select-field"), signedIn: false, act: async (p) => { await p.locator("[cmdk-input]").first().click(); await p.waitForTimeout(500); } },
  { name: "admin-spending-adddollars", url: `${app}/admin/spending`, signedIn: true, act: async (p) => { await p.getByRole("button", { name: "Add Dollars" }).first().click(); await p.getByRole("dialog").waitFor({ timeout: 10000 }); } },
  { name: "admin-marketplace-approve", url: `${app}/admin/marketplace`, signedIn: true, act: async (p) => { await p.getByRole("button", { name: /^Approve$/ }).first().click(); await p.getByRole("dialog").waitFor({ timeout: 10000 }); } },
];
type Kb = { name: string; url: string; signedIn: boolean; trigger: string; content: string; keys?: string[] };
const kbs: Kb[] = [
  { name: "kb-build-blockmenu", url: `${app}/build`, signedIn: true, trigger: '[data-id="blocks-control-popover-trigger"]', content: '[data-id="blocks-control-popover-content"]' },
  { name: "kb-build-savecontrol", url: `${app}/build`, signedIn: true, trigger: '[data-id="save-control-popover-trigger"]', content: '[data-id="save-control-popover-content"]' },
  { name: "kb-story-datefield", url: story("renderers-formrenderer-primitive-fields--date-field"), signedIn: false, trigger: "button[aria-haspopup=dialog]", content: "[role=dialog]", keys: ["ArrowRight", "ArrowDown"] },
  { name: "kb-story-datetimefield", url: story("renderers-formrenderer-primitive-fields--date-time-field"), signedIn: false, trigger: "button[aria-haspopup=dialog]", content: "[role=dialog]", keys: ["ArrowRight", "ArrowDown"] },
  { name: "kb-story-multiselect", url: story(process.env.MS_STORY || "renderers-formrenderer-complex-schemas--multi-select-field"), signedIn: false, trigger: "[cmdk-input]", content: "[cmdk-list]", keys: ["ArrowDown", "ArrowDown", "Enter"] },
  { name: "kb-build-agentoutputs", url: `${app}/build`, signedIn: true, trigger: '[data-id="agent-outputs-button"]', content: "[role=dialog]" },
  { name: "kb-story-collapsible", url: story("molecules-collapsible--default"), signedIn: false, trigger: "button[aria-expanded]", content: "[data-state=open]" },
  { name: "kb-marketplace-carousel", url: `${app}/marketplace`, signedIn: true, trigger: "[aria-roledescription=carousel] a, [aria-roledescription=carousel] button, [aria-roledescription=carousel] [tabindex]", content: "[aria-roledescription=carousel]", keys: ["ArrowRight", "ArrowRight"] },
];
const only = process.env.ONLY?.split(",");
const browser = await chromium.launch({ args: ARGS });
// One sign-in per run (Better Auth rate-limits sign-in), reused by every context.
const authCtx = await browser.newContext();
const signin = await authCtx.request.post(`${app}/api/auth/sign-in/email`, { data: { email: process.env.SCREENSHOT_EMAIL, password: process.env.SCREENSHOT_PASSWORD }, headers: { "Content-Type": "application/json" } });
if (!signin.ok()) throw new Error(`sign-in failed ${signin.status()}`);
const storageState = await authCtx.storageState();
await authCtx.close();
for (const vp of VIEWPORTS) {
  for (const s of steps) {
    if (only && !only.includes(s.name)) continue;
    // The builder's control panel is hidden at 390px: these steps cannot run there (same on every commit).
    if (vp.name === "mobile" && s.url.includes("/build")) { console.log(`${s.name} ${vp.name} SKIP: builder control panel hidden at 390px`); continue; }
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, reducedMotion: "reduce", colorScheme: "light", locale: "en-US", timezoneId: "UTC", ...(s.signedIn ? { storageState } : {}) });
    const page = await ctx.newPage();
    await page.clock.setFixedTime(FIXED);
    try {
      await page.goto(s.url, { waitUntil: "load", timeout: 60000 });
      await settle(page);
      await page.getByRole("button", { name: "Got it", exact: true }).first().click({ timeout: 1500 }).catch(() => undefined);
      await s.act(page);
      await settle(page);
      const { img, ok } = await stable(page);
      writeFileSync(`${outDir}/interact__${s.name}__${vp.name}.png`, img);
      report[`${s.name} ${vp.name}`] = { aria: await aria(page) };
      console.log(`${s.name} ${vp.name} ${ok ? "ok" : "NOT STABLE"}`);
    } catch (e) {
      console.log(`${s.name} ${vp.name} SKIP: ${(e as Error).message.split("\n")[0]}`);
    }
    await ctx.close();
  }
}
for (const vp of VIEWPORTS) {
  for (const k of kbs) {
    if (only && !only.includes(k.name)) continue;
    if (vp.name === "mobile" && k.url.includes("/build")) { report[`${k.name} ${vp.name}`] = { skipped: "builder control panel hidden at 390px" }; continue; }
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, reducedMotion: "reduce", colorScheme: "light", locale: "en-US", timezoneId: "UTC", ...(k.signedIn ? { storageState } : {}) });
    const p = await ctx.newPage();
    await p.clock.setFixedTime(FIXED);
    const r: Record<string, unknown> = {};
    try {
      await p.goto(k.url, { waitUntil: "load", timeout: 60000 }); await settle(p);
      await p.getByRole("button", { name: "Got it", exact: true }).first().click({ timeout: 1500 }).catch(() => undefined);
      await settle(p);
      r.tabOrder = await tabTrace(p);
      r.tabsToTrigger = await tabTo(p, k.trigger);
      r.focusedTrigger = await describeActive(p);
      await settle(p);
      writeFileSync(`${outDir}/interact__${k.name}-focus-visible__${vp.name}.png`, (await stable(p)).img);
      await p.locator(k.trigger).first().hover().catch(() => undefined);
      await settle(p);
      writeFileSync(`${outDir}/interact__${k.name}-hover__${vp.name}.png`, (await stable(p)).img);
      await p.keyboard.press(k.name.includes("multiselect") ? "ArrowDown" : "Enter");
      await p.waitForTimeout(600); await settle(p);
      r.afterOpen = await describeActive(p);
      r.ariaOpen = await aria(p);
      writeFileSync(`${outDir}/interact__${k.name}-kb-open__${vp.name}.png`, (await stable(p)).img);
      const seq: string[] = [];
      for (const key of k.keys ?? []) { await p.keyboard.press(key); await p.waitForTimeout(200); seq.push(`${key} -> ${await describeActive(p)}`); }
      r.keys = seq;
      if (seq.length) { await settle(p); writeFileSync(`${outDir}/interact__${k.name}-keys__${vp.name}.png`, (await stable(p)).img); }
      await p.keyboard.press("Escape"); await p.waitForTimeout(600); await settle(p);
      r.afterEscape = await describeActive(p);
      r.contentVisibleAfterEscape = await p.locator(k.content).first().isVisible().catch(() => false);
      writeFileSync(`${outDir}/interact__${k.name}-after-esc__${vp.name}.png`, (await stable(p)).img);
    } catch (e) { r.error = (e as Error).message.split("\n")[0]; }
    report[`${k.name} ${vp.name}`] = r;
    console.log(`${k.name} ${vp.name} ${r.error ? "SKIP: " + r.error : "ok"}`);
    await ctx.close();
  }
}
writeFileSync(`${outDir}/keyboard-aria.json`, JSON.stringify(report, null, 1));
await browser.close();
