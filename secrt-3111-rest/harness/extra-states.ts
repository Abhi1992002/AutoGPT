/**
 * Interaction states DS1's screenshot-pages.ts cannot reach by URL alone
 * (DS5g-3, SECRT-3111). Not committed. Same determinism as screenshot-pages:
 * its Chromium args, viewports, fixed clock, reduced motion, en-US/UTC,
 * fonts awaited, three identical screenshots in a row.
 *
 *   SCREENSHOT_EMAIL=… SCREENSHOT_PASSWORD=… SHARE_SESSION=<id> \
 *   npx tsx extra-states.ts <out dir> [base url]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { chromium, type Page } from "@playwright/test";

const OUT = resolve(process.argv[2]);
const BASE_URL = process.argv[3] || "http://localhost:3000";
const SESSION = process.env.SHARE_SESSION!;
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];
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
  await page.evaluate("document.fonts.ready");
  await page.evaluate(
    "new Promise((d) => requestAnimationFrame(() => requestAnimationFrame(d)))",
  );
}

async function stable(page: Page, file: string) {
  const opts = {
    fullPage: true,
    animations: "disabled",
    caret: "hide",
    scale: "css",
  } as const;
  let prev = await page.screenshot(opts);
  let matches = 1;
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline && matches < 3) {
    await page.waitForTimeout(750);
    await settle(page);
    const next = await page.screenshot(opts);
    matches = next.equals(prev) ? matches + 1 : 1;
    prev = next;
  }
  writeFileSync(file, prev);
  if (matches < 3) throw new Error(`not stable: ${file}`);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ARGS });
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
      const res = await context.request.post(
        `${BASE_URL}/api/auth/sign-in/email`,
        {
          data: {
            email: process.env.SCREENSHOT_EMAIL,
            password: process.env.SCREENSHOT_PASSWORD,
          },
        },
      );
      if (!res.ok()) throw new Error(`sign-in ${res.status()}`);
      const page = await context.newPage();
      await page.clock.setFixedTime(new Date("2026-01-15T12:00:00.000Z"));
      await page.goto(`${BASE_URL}/copilot?sessionId=${SESSION}`, {
        waitUntil: "load",
        timeout: 60_000,
      });
      await settle(page);
      const changelog = page.getByRole("button", { name: "Dismiss changelog", exact: true });
      if (await changelog.isVisible().catch(() => false)) {
        await changelog.click();
        await page.reload({ waitUntil: "load" });
        await settle(page);
      }
      const opener =
        vp.name === "mobile"
          ? page.getByRole("button", { name: "Toggle Sidebar" }).first()
          : page.getByRole("button", { name: "Expand sidebar" }).first();
      if (await opener.isVisible().catch(() => false)) {
        await opener.click();
        await page.waitForTimeout(1000);
        await settle(page);
      }
      console.log(vp.name, "row visible:", await page.locator(`a[href*="${SESSION}"]`).first().isVisible());
      const row = page.locator(`a[href*="${SESSION}"]`).first();
      await row.hover();
      await row
        .locator("xpath=ancestor::li[1]")
        .getByRole("button", { name: "Chat actions" })
        .click({ force: true });
      await page.getByRole("menuitem", { name: "Share chat" }).click();
      await page.getByRole("dialog").waitFor();
      await settle(page);
      await stable(page, join(OUT, `state__share-dialog__${vp.name}.png`));
      await context.close();
    }
  } finally {
    await browser.close();
  }
  console.log(`written to ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
