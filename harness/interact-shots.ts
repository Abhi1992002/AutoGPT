/**
 * Supplementary captures for molecules whose changed styles only render
 * after an interaction (toasts, menus, dialogs, tooltips, hover states).
 * Same determinism settings as scripts/screenshot-pages.ts.
 *
 *   npx tsx interact-shots.ts <storybook-url> <out-dir>
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import type { Page } from "@playwright/test";

const req = createRequire(join(process.cwd(), "package.json"));
const { chromium } = req("@playwright/test");

const ARGS = [
  "--disable-gpu", "--disable-gpu-rasterization", "--disable-partial-raster",
  "--num-raster-threads=1", "--disable-skia-runtime-opts",
  "--force-color-profile=srgb", "--font-render-hinting=none", "--disable-lcd-text",
];
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];
const GROUPS: Record<string, (page: Page) => Promise<void>> = {
  "molecules-toast--": async (page) => {
    await page.getByRole("button").first().click();
    await page.locator("[data-sonner-toast]").first().waitFor();
  },
  "molecules-dropdownmenu--": async (page) => {
    await page.getByRole("button").first().click();
    await page.getByRole("menu").first().waitFor();
  },
  "molecules-dialog--": async (page) => {
    if (await page.getByRole("dialog").count()) return;
    await page.getByRole("button").first().click();
    await page.getByRole("dialog").first().waitFor();
  },
  "molecules-secondarymenu--dropdown": async (page) => {
    await page.getByRole("button").first().click();
    await page.getByRole("menu").first().waitFor();
    await page.getByRole("menuitem").first().hover();
  },
  "molecules-secondarymenu--context": async (page) => {
    await page.locator(".h-32.w-64").first().click({ button: "right" });
    await page.getByRole("menu").first().waitFor();
    await page.getByRole("menuitem").first().hover();
  },
  "molecules-informationtooltip--": async (page) => {
    const b = page.getByRole("button", { name: "More information" }).first();
    if (!(await b.count())) return;
    await b.hover();
    await page.waitForTimeout(800);
  },
  "molecules-multitoggle--": async (page) => {
    await page.getByRole("checkbox").first().hover();
  },
  "molecules-breadcrumbs--": async (page) => {
    const link = page.getByRole("link").first();
    if (await link.count()) await link.hover();
  },
};

async function stable(page: Page) {
  const opts = { fullPage: true, animations: "disabled", caret: "hide", scale: "css" } as const;
  let prev = await page.screenshot(opts);
  let same = 1;
  for (let i = 0; i < 40 && same < 3; i++) {
    await page.waitForTimeout(500);
    const next = await page.screenshot(opts);
    same = next.equals(prev) ? same + 1 : 1;
    prev = next;
  }
  return { image: prev, stable: same >= 3 };
}

async function main() {
  const [sb, out] = process.argv.slice(2);
  mkdirSync(out, { recursive: true });
  const index = (await (await fetch(`${sb}/index.json`)).json()) as {
    entries: Record<string, { id: string; type: string }>;
  };
  const ids = Object.values(index.entries)
    .filter((e) => e.type === "story")
    .map((e) => e.id)
    .sort();
  const browser = await chromium.launch({ args: ARGS });
  const unstable: string[] = [];
  let n = 0;
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1,
      reducedMotion: "reduce", colorScheme: "light", locale: "en-US", timezoneId: "UTC",
    });
    for (const [prefix, act] of Object.entries(GROUPS)) {
      for (const id of ids.filter((x) => x.startsWith(prefix))) {
        const page = await ctx.newPage();
        await page.clock.setFixedTime(new Date("2026-01-15T12:00:00.000Z"));
        await page.goto(`${sb}/iframe.html?id=${id}&viewMode=story`, { waitUntil: "load" });
        await page.waitForLoadState("networkidle").catch(() => undefined);
        await page.evaluate(() => document.fonts.ready);
        await act(page);
        const { image, stable: ok } = await stable(page);
        const file = join(out, `interact__${id}__${vp.name}.png`);
        writeFileSync(file, image);
        if (!ok) unstable.push(file);
        n++;
        await page.close();
      }
    }
    await ctx.close();
  }
  await browser.close();
  console.log(`${n} screenshot(s) written to ${out}`);
  if (unstable.length) console.error(`never stabilised:\n${unstable.join("\n")}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
