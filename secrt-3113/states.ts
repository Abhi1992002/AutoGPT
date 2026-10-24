/**
 * Interactive-state captures for SECRT-3113 (QUALITY 17b). Uncommitted.
 *   npx tsx .ign-harness/states.ts <outdir> [baseUrl] [storybookUrl]
 * Same browser setup as scripts/screenshot-pages.ts (deterministic Chromium
 * flags, 1440x900 and 390x844 at scale 1, reduced motion, fixed clock, UTC).
 * Writes one PNG per state plus keyboard.json (Tab order, Esc, focus return).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Page } from "@playwright/test";

const [
  out,
  baseUrl = "http://localhost:3000",
  sbUrl = "http://localhost:6006",
] = process.argv.slice(2);
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
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];
const FIXED_TIME = new Date("2026-01-15T12:00:00.000Z");
const SESSION = "/copilot?sessionId=5eed7113-0000-4000-8000-000000000001";

async function still(page: Page) {
  await page
    .waitForFunction(() =>
      document.getAnimations().every((a) => a.playState !== "running"),
    )
    .catch(() => undefined);
  let prev = await page.screenshot({ caret: "hide", scale: "css" });
  for (let i = 0, same = 1; i < 40 && same < 3; i++) {
    await page.waitForTimeout(400);
    const next = await page.screenshot({ caret: "hide", scale: "css" });
    same = next.equals(prev) ? same + 1 : 1;
    prev = next;
  }
  return prev;
}

function describeActive(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return "none";
    const label = el.getAttribute("aria-label") ?? "";
    const sd = el.getAttribute("data-streamdown") ?? "";
    return `${el.tagName.toLowerCase()}${label ? `[aria-label=${label}]` : ""}${sd ? `[data-streamdown=${sd}]` : ""} "${(el.innerText ?? "").trim().slice(0, 30)}" focus-visible=${el.matches(":focus-visible")}`;
  });
}

const log = (m: string) =>
  console.log(`[states ${new Date().toISOString().slice(11, 19)}] ${m}`);
setTimeout(() => {
  log("hard timeout after 6 min");
  process.exit(2);
}, 6 * 60_000).unref();

async function main() {
  mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args: ARGS });
  const keyboard: Record<string, unknown> = {};
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
      colorScheme: "light",
      locale: "en-US",
      timezoneId: "UTC",
    });
    const r = await context.request.post(`${baseUrl}/api/auth/sign-in/email`, {
      data: {
        email: process.env.SCREENSHOT_EMAIL,
        password: process.env.SCREENSHOT_PASSWORD,
      },
      headers: { "Content-Type": "application/json" },
    });
    if (!r.ok()) throw new Error(`sign-in ${r.status()}`);
    const page = await context.newPage();
    await page.clock.setFixedTime(FIXED_TIME);
    page.setDefaultTimeout(20_000);
    const shot = async (name: string) => {
      log(`${vp.name} ${name}`);
      writeFileSync(join(out, `${name}__${vp.name}.png`), await still(page));
    };
    const kb: string[] = [];

    log(`${vp.name} goto`);
    await page.goto(baseUrl + SESSION, { waitUntil: "load", timeout: 60_000 });
    await page
      .locator("table:visible")
      .first()
      .waitFor({ state: "visible", timeout: 60_000 });
    await page.evaluate(() => document.fonts.ready);
    // The "What's new" changelog popup opens on a timer after load; close
    // it the way a user would so it never lands in a state shot.
    const changelog = page.getByRole("dialog", { name: /what.s new/i });
    if (
      await changelog
        .waitFor({ state: "visible", timeout: 6_000 })
        .then(() => true)
        .catch(() => false)
    ) {
      await changelog.getByRole("button").first().click();
      await changelog.waitFor({ state: "hidden" }).catch(() => undefined);
      kb.push("changelog popup closed");
    }
    await shot("session-rest-send-disabled");

    // External link dialog: open, Esc, focus back on the trigger.
    const link = page.locator('[data-streamdown="link"]', {
      hasText: "link to the docs",
    });
    await link.scrollIntoViewIfNeeded();
    await shot("session-scrolled-up-scroll-button");
    const scrollBtn = page.locator("button:has(svg.lucide-arrow-down)");
    if (await scrollBtn.isVisible().catch(() => false)) {
      await scrollBtn
        .hover({ force: true, timeout: 5_000 })
        .catch(() => undefined);
      await shot("scroll-button-hover");
      kb.push(`scroll-to-bottom button visible: true`);
    } else kb.push(`scroll-to-bottom button visible: false`);
    await link.scrollIntoViewIfNeeded();
    await link.focus();
    kb.push(`before dialog, focused: ${await describeActive(page)}`);
    await page.keyboard.press("Enter");
    await page
      .getByRole("dialog", { name: "Open external link" })
      .waitFor({ state: "visible", timeout: 10_000 });
    await shot("link-dialog-open");
    kb.push(`dialog open, focused: ${await describeActive(page)}`);
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("Tab");
      kb.push(`dialog Tab ${i + 1}: ${await describeActive(page)}`);
    }
    await page.keyboard.press("Escape");
    const closedByEsc = await page
      .getByRole("dialog", { name: "Open external link" })
      .waitFor({ state: "hidden", timeout: 10_000 })
      .then(() => true)
      .catch(() => false);
    if (!closedByEsc) {
      kb.push(
        `after Esc, dialog STILL OPEN; focused: ${await describeActive(page)}`,
      );
      await shot("link-dialog-after-esc-still-open");
      await page.getByRole("button", { name: "Cancel" }).click();
      await page.getByRole("dialog", { name: "Open external link" }).waitFor({ state: "hidden" });
      kb.push(`closed with Cancel; focused: ${await describeActive(page)}`);
    } else
      kb.push(
        `after Esc, dialog closed; focused: ${await describeActive(page)}`,
      );
    await shot("link-dialog-closed-after-esc");

    // Table row hover.
    const row = page.locator("table:visible tbody tr").first();
    await row.scrollIntoViewIfNeeded();
    await row.hover();
    await shot("table-row-hover");

    // Copy tooltip on the assistant row actions.
    const copy = page.getByRole("button", { name: "Copy" }).last();
    await copy.scrollIntoViewIfNeeded();
    await copy.hover();
    await page
      .getByRole("tooltip")
      .first()
      .waitFor({ state: "visible", timeout: 10_000 })
      .catch(() => undefined);
    await shot("copy-tooltip-open");
    await page.mouse.move(1, 1);

    // Composer: type, send enabled, hover, keyboard focus.
    const box = page.getByRole("textbox", { name: "Chat message input" });
    await box.click();
    await page.keyboard.type("Hello there");
    await shot("composer-typed-send-enabled");
    const send = page.getByRole("button", { name: "Submit" });
    await send.hover();
    await shot("send-hover");
    await page.mouse.move(1, 1);
    await box.focus();
    kb.push(`composer focused: ${await describeActive(page)}`);
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      const d = await describeActive(page);
      kb.push(`composer Tab ${i + 1}: ${d}`);
      if (d.includes("aria-label=Submit")) await shot("send-focus-visible");
    }
    // /tour/chat renders Conversation, Message and MessageContent over a
    // WebGL DotDistortionShader canvas that software GL never draws the same
    // way twice. Same page, canvas hidden, everything else as rendered.
    const tour = await context.newPage();
    await tour.clock.setFixedTime(FIXED_TIME);
    tour.setDefaultTimeout(30_000);
    await tour.goto(baseUrl + "/tour/chat", {
      waitUntil: "load",
      timeout: 60_000,
    });
    await tour.addStyleTag({
      content: "canvas { visibility: hidden !important; }",
    });
    await tour.evaluate(() => document.fonts.ready);
    await tour.waitForTimeout(8000);
    log(`${vp.name} tour-chat-canvas-hidden`);
    {
      let prev = await tour.screenshot({
        fullPage: true,
        animations: "disabled",
        caret: "hide",
        scale: "css",
      });
      for (let i = 0, same = 1; i < 60 && same < 3; i++) {
        await tour.waitForTimeout(750);
        const next = await tour.screenshot({
          fullPage: true,
          animations: "disabled",
          caret: "hide",
          scale: "css",
        });
        same = next.equals(prev) ? same + 1 : 1;
        prev = next;
      }
      writeFileSync(join(out, `tour-chat-canvas-hidden__${vp.name}.png`), prev);
    }
    await tour.close();
    keyboard[vp.name] = kb;

    // Storybook: link safety dialog and table row hover.
    const sb = await context.newPage();
    await sb.goto(
      `${sbUrl}/iframe.html?id=ai-elements-message--with-table&viewMode=story`,
      { waitUntil: "load" },
    );
    sb.setDefaultTimeout(20_000);
    await sb
      .locator("table:visible tbody tr")
      .first()
      .waitFor({ state: "visible" });
    await sb.locator("table:visible tbody tr").nth(2).hover();
    writeFileSync(
      join(out, `story-with-table-row-hover__${vp.name}.png`),
      await still(sb),
    );
    await sb.goto(
      `${sbUrl}/iframe.html?id=ai-elements-message--link-safety-modal&viewMode=story`,
      { waitUntil: "load" },
    );
    const sbLink = sb.locator('[data-streamdown="link"]:visible').first();
    await sbLink.waitFor({ state: "visible" });
    await sbLink.click();
    await sb.getByRole("dialog", { name: "Open external link" }).waitFor({ state: "visible", timeout: 10_000 });
    writeFileSync(
      join(out, `story-link-dialog-open__${vp.name}.png`),
      await still(sb),
    );
    await sb.keyboard.press("Escape");
    const sbClosed = await sb
      .getByRole("dialog", { name: "Open external link" })
      .waitFor({ state: "hidden", timeout: 10_000 })
      .then(() => true)
      .catch(() => false);
    keyboard[`${vp.name} story`] = [
      `after Esc, dialog ${sbClosed ? "closed" : "STILL OPEN"}; focused: ${await describeActive(sb)}`,
    ];
    await context.close();
  }
  writeFileSync(join(out, "keyboard.json"), JSON.stringify(keyboard, null, 2));
  await browser.close();
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
