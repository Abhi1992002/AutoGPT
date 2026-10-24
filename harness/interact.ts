// QUALITY rule 17 (b), (c), (e) for DS8: every consumer story, base Storybook
// against head Storybook. Per story: the accessibility tree (ARIA snapshot),
// the Tab order, and screenshots of interactive states (hover, focus-visible,
// disabled, armed, open/closed, expanded) compared at pixel threshold 0, at
// 1440x900 and 390x844. Dialog: Esc closes and focus returns to its trigger.
//   cd <frontend> && npx tsx interact.ts <baseUrl> <headUrl> <outDir>
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
const req = createRequire(join(process.cwd(), "package.json"));
const { chromium } = req("@playwright/test");
const { comparePngs } = req(join(process.cwd(), "scripts/screenshot-pages.ts"));

type Page = any;
const [baseUrl, headUrl, outArg] = process.argv.slice(2);
const outDir = resolve(outArg);
mkdirSync(outDir, { recursive: true });

const ARGS = ["--disable-gpu", "--disable-gpu-rasterization", "--disable-partial-raster", "--num-raster-threads=1", "--disable-skia-runtime-opts", "--force-color-profile=srgb", "--font-render-hinting=none", "--disable-lcd-text"];
const VIEWPORTS = [{ name: "desktop", width: 1440, height: 900 }, { name: "mobile", width: 390, height: 844 }];
const P = "organisms-attentioncard-consumers--";

async function tabTo(page: Page, name: RegExp, max = 40) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press("Tab");
    const label = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      return el ? el.getAttribute("aria-label") || el.innerText || "" : "";
    });
    if (name.test(label)) return;
  }
  throw new Error(`tab never reached ${name}`);
}
const hover = (role: string, name: RegExp, nth = 0) => async (p: Page) => p.getByRole(role, { name }).nth(nth).hover();
const click = (role: string, name: RegExp, nth = 0) => async (p: Page) => p.getByRole(role, { name }).nth(nth).click();
const focus = (name: RegExp) => async (p: Page) => tabTo(p, name);

const STATES: Record<string, [string, (p: Page) => Promise<unknown>][]> = {
  "needs-attention": [
    ["rest (row 2 disabled)", async () => {}],
    ["hover Approve", hover("button", /^Approve:/)],
    ["hover row link", async (p) => p.getByRole("link").first().hover()],
    ["focus-visible Approve", focus(/^Approve:/)],
    ["focus-visible row link", focus(/Approve outreach email/)],
    ["Decline armed", click("button", /^Decline:/)],
  ],
  "composer-notices": [
    ["rest", async () => {}],
    ["hover dismiss", hover("button", /Dismiss attachment limit notice/)],
    ["focus-visible dismiss", focus(/Dismiss attachment limit notice/)],
    ["focus-visible setup guide link", focus(/setup guide/)],
  ],
  "chat-notices": [
    ["rest", async () => {}],
    ["hover Copy link", hover("button", /Copy link/)],
    ["focus-visible Copy link", focus(/Copy link/)],
  ],
  "scheduled-chat-notices": [
    ["rest", async () => {}],
    ["hover Run less often", hover("button", /Run less often/)],
    ["focus-visible View plans", focus(/View plans/)],
    ["focus-visible Resume", focus(/^Resume$/)],
    ["dialog open", click("button", /Run less often/)],
    ["dialog closed by Esc", async (p) => { await p.getByRole("button", { name: /Run less often/ }).click(); await p.getByRole("dialog").waitFor(); await p.keyboard.press("Escape"); await p.getByRole("dialog").waitFor({ state: "hidden" }); }],
  ],
  "pending-reviews": [
    ["rest", async () => {}],
    ["hover Approve", hover("button", /^Approve 2 reviews$/)],
    ["focus-visible group header", focus(/Approve outreach email/)],
    ["focus-visible Reject", focus(/^Reject 2 reviews$/)],
    ["group closed", click("button", /Approve outreach email/)],
    ["group reopened", async (p) => { await p.getByRole("button", { name: /Approve outreach email/ }).click(); await p.getByRole("button", { name: /Approve outreach email/ }).click(); }],
    ["auto-approve on", async (p) => p.getByRole("switch").first().click()],
  ],
  "pending-reviews-empty": [["rest", async () => {}]],
  "pending-review-card-standalone": [
    ["rest", async () => {}],
    ["auto-approve on", async (p) => p.getByRole("switch").nth(1).click()],
  ],
  briefing: [
    ["rest", async () => {}],
    ["hover linked row", async (p) => p.getByRole("link").first().hover()],
    ["hover Show all", hover("button", /Show all results/)],
    ["focus-visible linked row", async (p) => { await p.keyboard.press("Tab"); }],
    ["focus-visible Show all", focus(/Show all results/)],
    ["expanded", click("button", /Show all results/)],
  ],
  "trial-onboarding": [
    ["rest", async () => {}],
    ["hover Start", hover("button", /Start 7-day trial/)],
    ["focus-visible Start", focus(/Start 7-day trial/)],
  ],
  "trial-billing": [
    ["rest", async () => {}],
    ["hover Start", hover("button", /Start 7-day trial/)],
    ["focus-visible Start", focus(/Start 7-day trial/)],
  ],
};

async function stableShot(page: Page) {
  const opts = { fullPage: true, animations: "disabled", caret: "hide", scale: "css" };
  let prev = await page.screenshot(opts);
  let same = 1;
  for (let i = 0; i < 40 && same < 3; i++) {
    await page.waitForTimeout(300);
    const next = await page.screenshot(opts);
    same = next.equals(prev) ? same + 1 : 1;
    prev = next;
  }
  return prev;
}

async function open(page: Page, url: string, id: string) {
  await page.clock.setFixedTime(new Date("2026-01-15T12:00:00.000Z"));
  await page.goto(`${url}/iframe.html?id=${P}${id}&viewMode=story`, { waitUntil: "load" });
  await page.waitForFunction(() => (document.querySelector("#storybook-root")?.innerHTML.length ?? 0) > 0, undefined, { timeout: 90_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
}

async function tabOrder(page: Page) {
  const order: string[] = [];
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press("Tab");
    const d = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return "body";
      return `${el.tagName.toLowerCase()}[role=${el.getAttribute("role") ?? ""}] "${(el.getAttribute("aria-label") || el.innerText || "").trim().slice(0, 50)}"`;
    });
    order.push(d);
    if (d === "body") break;
  }
  return order;
}

(async () => {
  const browser = await chromium.launch({ args: ARGS });
  const rows: string[] = [];
  const kb: string[] = [];
  let failures = 0;
  for (const vp of VIEWPORTS) {
    for (const [id, states] of Object.entries(STATES)) {
      const ctx = (u: string) => browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, reducedMotion: "reduce", colorScheme: "light", locale: "en-US", timezoneId: "UTC" });
      const bctx = await ctx(baseUrl), hctx = await ctx(headUrl);
      const bp = await bctx.newPage(), hp = await hctx.newPage();
      // Accessibility tree and Tab order (desktop only: same DOM both widths).
      if (vp.name === "desktop") {
        await open(bp, baseUrl, id); await open(hp, headUrl, id);
        const ba = await bp.locator("#storybook-root").ariaSnapshot();
        const ha = await hp.locator("#storybook-root").ariaSnapshot();
        const ariaSame = ba === ha;
        writeFileSync(join(outDir, `aria__${id}.yml`), ha);
        if (!ariaSame) { failures++; writeFileSync(join(outDir, `aria__${id}__BASE.yml`), ba); }
        await open(bp, baseUrl, id); await open(hp, headUrl, id);
        const bo = await tabOrder(bp), ho = await tabOrder(hp);
        const tabSame = JSON.stringify(bo) === JSON.stringify(ho);
        if (!tabSame) failures++;
        kb.push(`| ${id} | ${ariaSame ? "identical" : "DIFFERENT"} | ${ho.length - 1} stops: ${ho.filter((s) => s !== "body").join(" → ") || "none"} | ${tabSame ? "identical" : "DIFFERENT"} |`);
      }
      for (const [name, act] of states) {
        console.error(`${vp.name} ${id} ${name}`);
        try {
        await open(bp, baseUrl, id); await open(hp, headUrl, id);
        await act(bp); await act(hp);
        if (name === "dialog closed by Esc" && vp.name === "desktop") {
          const fb = await bp.evaluate(() => (document.activeElement as HTMLElement)?.innerText);
          const fh = await hp.evaluate(() => (document.activeElement as HTMLElement)?.innerText);
          const ok = fb === fh && /Run less often/.test(fh ?? "");
          if (!ok) failures++;
          kb.push(`| ${id}: Esc closes RunLessOftenDialog, focus returns to trigger | - | focus after Esc: base "${fb}", head "${fh}" | ${ok ? "identical" : "DIFFERENT"} |`);
        }
        const b = await stableShot(bp), h = await stableShot(hp);
        const slug = `${id}__${name.replace(/[^a-z0-9]+/gi, "-")}__${vp.name}`;
        writeFileSync(join(outDir, `${slug}__before.png`), b);
        writeFileSync(join(outDir, `${slug}__after.png`), h);
        const r = comparePngs(b, h);
        if (r.diff) writeFileSync(join(outDir, `${slug}__diff.png`), r.diff);
        if (r.diffPixels) failures++;
        rows.push(`| ${id} | ${name} | ${vp.name} | ${r.sizeMismatch ? `size ${r.sizeMismatch}` : `${r.diffPixels} px`} |`);
        } catch (error) {
          failures++;
          rows.push(`| ${id} | ${name} | ${vp.name} | ERROR: ${String(error).split("\n")[0]} |`);
        }
      }
      await bctx.close(); await hctx.close();
    }
  }
  await browser.close();
  const md = ["| story | state | viewport | pixel diff |", "| --- | --- | --- | --- |", ...rows, "", "| story | ARIA snapshot | Tab order (head) | Tab order vs base |", "| --- | --- | --- | --- |", ...kb, "", `${rows.length} state screenshots, ${kb.length} keyboard/aria checks: ${failures} differing`].join("\n");
  writeFileSync(join(outDir, "interact.md"), md);
  console.log(md);
  process.exitCode = failures ? 1 : 0;
})();
