/**
 * Rule 17 (b)/(c) parity for every organisms story: base storybook vs head storybook.
 * Per story and viewport: rest screenshot, ARIA snapshot, DOM with data-slot removed;
 * then (desktop) hover each of the first buttons/links, Tab x8 with a focus-visible
 * screenshot and the focused element after each press, Escape (screenshot, focus target).
 * Prints one row per check and exits 1 on any difference.
 *   npx tsx interaction-parity.ts <baseUrl> <headUrl> <outDir>
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Browser, type Page } from "@playwright/test";
import { comparePngs, VIEWPORTS } from "./scripts/screenshot-pages";

const ARGS = ["--disable-gpu", "--disable-gpu-rasterization", "--disable-partial-raster", "--num-raster-threads=1", "--disable-skia-runtime-opts", "--force-color-profile=srgb", "--font-render-hinting=none", "--disable-lcd-text"];
const [baseUrl, headUrl, out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });

async function storyIds(url: string) {
  const index = (await (await fetch(`${url}/index.json`)).json()) as { entries: Record<string, { id: string; type: string }> };
  return Object.values(index.entries).filter((e) => e.type === "story" && e.id.startsWith("organisms-")).map((e) => e.id).sort();
}

async function open(browser: Browser, url: string, id: string, viewport: { width: number; height: number }) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: "reduce", timezoneId: "UTC", locale: "en-US" });
  await context.clock.setFixedTime(new Date("2026-01-15T12:00:00.000Z"));
  const page = await context.newPage();
  await page.goto(`${url}/iframe.html?id=${id}&viewMode=story`, { waitUntil: "load" });
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  return page;
}

async function shot(page: Page) {
  let last = await page.screenshot({ fullPage: true });
  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(150);
    const next = await page.screenshot({ fullPage: true });
    if (next.equals(last)) return next;
    last = next;
  }
  return last;
}

async function focused(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return "body";
    return [el.tagName.toLowerCase(), el.getAttribute("role"), el.getAttribute("aria-label"), (el.textContent || "").trim().slice(0, 40), el.matches(":focus-visible") ? "focus-visible" : ""].join("|");
  });
}

async function dom(page: Page) {
  return page.evaluate(() => {
    const c = document.body.cloneNode(true) as HTMLElement;
    c.querySelectorAll("[data-slot]").forEach((e) => e.removeAttribute("data-slot"));
    c.querySelectorAll("script").forEach((e) => e.remove());
    return c.innerHTML;
  });
}

type Step = { name: string; png: Buffer; meta: string };

async function run(browser: Browser, url: string, id: string, viewport: (typeof VIEWPORTS)[number]) {
  const steps: Step[] = [];
  let page = await open(browser, url, id, viewport);
  steps.push({ name: "rest", png: await shot(page), meta: (await page.locator("body").ariaSnapshot()) + "\n" + (await dom(page)) });
  if (viewport.name === "desktop") {
    const targets = page.locator("button:visible, a[href]:visible, [role=button]:visible, [role=tab]:visible");
    const n = Math.min(await targets.count(), 6);
    for (let i = 0; i < n; i++) {
      await targets.nth(i).hover({ timeout: 3000 }).catch(() => undefined);
      await page.waitForTimeout(100);
      steps.push({ name: `hover-${i}`, png: await shot(page), meta: await focused(page) });
    }
    await page.mouse.move(0, 0);
    await page.context().close();
    page = await open(browser, url, id, viewport);
    for (let i = 1; i <= 8; i++) {
      await page.keyboard.press("Tab");
      await page.waitForTimeout(100);
      steps.push({ name: `tab-${i}`, png: await shot(page), meta: await focused(page) });
    }
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    steps.push({ name: "escape", png: await shot(page), meta: (await focused(page)) + "\n" + (await page.locator("body").ariaSnapshot()) });
  }
  await page.context().close();
  return steps;
}

(async () => {
  const ids = await storyIds(baseUrl);
  const headIds = await storyIds(headUrl);
  if (ids.join() !== headIds.join()) { console.log(`STORY SET DIFFERS: ${ids.length} vs ${headIds.length}`); process.exit(1); }
  const browser = await chromium.launch({ args: ARGS });
  let failures = 0, checks = 0;
  const rows: string[] = ["| story | viewport | step | pixels | focus / aria / DOM |", "| --- | --- | --- | --- | --- |"];
  for (const id of ids) {
    for (const viewport of VIEWPORTS) {
      const a = await run(browser, baseUrl, id, viewport);
      const b = await run(browser, headUrl, id, viewport);
      for (let i = 0; i < Math.max(a.length, b.length); i++) {
        checks++;
        const x = a[i], y = b[i];
        if (!x || !y) { failures++; rows.push(`| ${id} | ${viewport.name} | ${x?.name ?? y?.name} | step missing | FAIL |`); continue; }
        const { diffPixels, diff } = comparePngs(x.png, y.png);
        const same = x.meta === y.meta;
        if (diffPixels || !same) {
          failures++;
          const base = join(out, `${id}__${viewport.name}__${x.name}`);
          writeFileSync(`${base}__base.png`, x.png); writeFileSync(`${base}__head.png`, y.png);
          if (diff) writeFileSync(`${base}__diff.png`, diff);
          writeFileSync(`${base}__base.txt`, x.meta); writeFileSync(`${base}__head.txt`, y.meta);
        }
        const metaLabel = x.name.startsWith("tab-") || x.name.startsWith("hover-") ? x.meta : x.name === "escape" ? `focus after Esc: ${x.meta.split("\n")[0]}` : "aria snapshot + DOM";
        rows.push(`| ${id} | ${viewport.name} | ${x.name} | ${diffPixels} | ${same ? "same" : "DIFFERS"}: ${metaLabel.replace(/\|/g, "/")} |`);
      }
    }
  }
  await browser.close();
  rows.push("", `${ids.length} stories, ${checks} checks, ${failures} differing`);
  writeFileSync(join(out, "interaction-parity.md"), rows.join("\n"));
  console.log(`${ids.length} stories, ${checks} checks, ${failures} differing`);
  process.exit(failures ? 1 : 0);
})();
