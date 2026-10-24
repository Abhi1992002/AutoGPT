/**
 * Supplementary DS5e captures (not committed): states DS1's
 * scripts/screenshot-pages.ts cannot reach.
 *  - its full-page capture resizes a page taller than the viewport, which
 *    restarts framer-motion in-view entrances, so /artifacts and the sidebar
 *    are captured at their blur(8px) start frame;
 *  - the changelog popover opens after its dismiss check, and as an open
 *    dialog it defers the WorkflowsMovedNotice.
 *  - under prefers-reduced-motion /artifacts never leaves blur(8px): the page
 *    swaps to variants that do not animate `filter` (pre-existing bug).
 * Same viewports, device scale, Chromium flags, locale and timezone as DS1's
 * harness; motion is not reduced. Each page: load, close the changelog the way a
 * user would, optionally wait for a selector, wait until every animation has
 * finished, then wait 3s, then retake until five screenshots in a row are identical.
 *
 *   cd autogpt_platform/frontend
 *   npx tsx ../../.context/ds5e/capture-states.mts <out dir>
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import type { Page } from "@playwright/test";

const { chromium } = createRequire(join(process.cwd(), "package.json"))(
  "@playwright/test",
) as typeof import("@playwright/test");

const BASE_URL = "http://localhost:3000";
const STACK = "/home/vercel-sandbox/autogpt/.context/run-stack";
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const;
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

function readUser(file: string) {
  const env = Object.fromEntries(
    readFileSync(join(STACK, file), "utf8")
      .split("\n")
      .filter(Boolean)
      .map((l) => l.split(/=(.*)/s).slice(0, 2)),
  );
  return {
    email: env.PR_TEST_USER_EMAIL ?? env.EMAIL,
    password: env.PR_TEST_USER_PASSWORD ?? env.PASSWORD,
  };
}

interface Scenario {
  name: string;
  /** null: signed out. */
  user: string | null;
  route: string;
  waitFor?: string;
  /** Visited for its side effects (the changelog is closed there), not saved. */
  warmup?: boolean;
}

// Explicit selection: without it the page picks Scheduled or the latest
// task depending on which request lands first.
const AGENT_PAGES = [
  "/library/agents/9d367bbb-5c49-449f-ab5f-10a8bfe5ecd4?activeTab=runs&activeItem=c1b15e05-53fd-4e0b-98f0-a9d994cf798b",
  "/library/agents/9d367bbb-5c49-449f-ab5f-10a8bfe5ecd4?activeTab=scheduled&activeItem=0f4fd455-207b-402a-853b-3842655b154a",
  "/library/agents/8fc7a770-52da-486e-b23d-261b81b6b15e?activeTab=runs&activeItem=d0c2bd7f-dc0d-48eb-ac3b-2c3acd321fc1",
];
const PUBLIC_ROUTES = ["/login", "/signup", "/reset-password"];
// DS1's SIGNED_IN_ROUTES plus the DS5e routes.
const SIGNED_IN_ROUTES = [
  "/marketplace",
  "/library",
  // "/home" and "/copilot" are left to DS1's harness: with motion on, their
  // looping animations never hold still for five identical shots.
  "/team",
  "/team/autopilot",
  "/build",
  "/settings/profile",
  "/settings/account",
  "/settings/api-keys",
  "/settings/integrations",
  "/artifacts",
  "/library/followups",
  "/library/skills",
  ...AGENT_PAGES,
];
const slug = (route: string) => route.replace(/[^a-zA-Z0-9-]+/g, "_");

const SCENARIOS: Scenario[] = [
  ...PUBLIC_ROUTES.map((route) => ({
    name: `settled${slug(route)}`,
    user: null,
    route,
  })),
  ...SIGNED_IN_ROUTES.map((route) => ({
    name: `settled${slug(route)}`,
    user: "user.env",
    route,
  })),
  ...["/library", "/artifacts"].map((route) => ({
    name: `empty${slug(route)}`,
    user: "user-empty.env",
    route,
  })),
  {
    name: "moved-warmup_team",
    user: "user-moved.env",
    route: "/team",
    warmup: true,
  },
  {
    name: "moved-notice_library",
    user: "user-moved.env",
    route: "/library",
    waitFor: "[data-workflows-moved-notice]",
  },
];

async function settle(page: Page) {
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.evaluate(async () => {
    await document.fonts.ready;
    // Finite animations only (spinners and shimmers loop forever), and never
    // wait more than 10s.
    const finite = document
      .getAnimations()
      .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity);
    await Promise.race([
      Promise.all(finite.map((a) => a.finished.catch(() => undefined))),
      new Promise((done) => setTimeout(done, 10_000)),
    ]);
  });
  await page.evaluate(
    () =>
      new Promise((done) =>
        requestAnimationFrame(() => requestAnimationFrame(done)),
      ),
  );
}

// Five identical shots in a row, after a 3s head start: late data (the
// /copilot greeting) must not be mistaken for a page that holds still.
async function stable(page: Page) {
  await page.waitForTimeout(3_000);
  await settle(page);
  // Viewport only: a full-page capture of a page taller than the viewport
  // resizes it, which restarts framer-motion in-view entrances (blur(8px)).
  const opts = { fullPage: false, caret: "hide", scale: "css" } as const;
  let prev = await page.screenshot(opts);
  let same = 1;
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    await page.waitForTimeout(750);
    await settle(page);
    const next = await page.screenshot(opts);
    same = next.equals(prev) ? same + 1 : 1;
    prev = next;
    if (same >= 5) return { image: next, stable: true };
  }
  return { image: prev, stable: false };
}

const outDir = resolve(process.argv[2]);
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ARGS });
const unstable: string[] = [];
const missing: string[] = [];
try {
  for (const viewport of VIEWPORTS) {
    // One signed-in context per user: sign-in is rate limited. The changelog
    // dismissal lives in this context's localStorage, so later pages of the
    // same user open without it, in the same order on every run.
    for (const user of [...new Set(SCENARIOS.map((s) => s.user))]) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        // DS1 emulates reduced motion; under it /artifacts stays at blur(8px)
        // (its reduced variants never animate the filter back), so this pass
        // lets the entrances run and waits for them to finish.
        reducedMotion: "no-preference",
        colorScheme: "light",
        locale: "en-US",
        timezoneId: "UTC",
      });
      if (user) {
        const { email, password } = readUser(user);
        const r = await context.request.post(
          `${BASE_URL}/api/auth/sign-in/email`,
          { data: { email, password } },
        );
        if (!r.ok()) throw new Error(`sign-in ${r.status()}`);
      }
      for (const s of SCENARIOS.filter((x) => x.user === user)) {
        const page = await context.newPage();
        // Same pinned clock as DS1's harness, so relative times hold still.
        await page.clock.setFixedTime(new Date("2026-01-15T12:00:00.000Z"));
        await page.goto(`${BASE_URL}${s.route}`, { waitUntil: "load" });
        await settle(page);
        const changelog = page.getByRole("button", {
          name: "Dismiss changelog",
          exact: true,
        });
        await changelog
          .waitFor({ state: "visible", timeout: 8_000 })
          .then(() => changelog.click())
          .catch(() => undefined);
        await changelog
          .waitFor({ state: "hidden", timeout: 5_000 })
          .catch(() => undefined);
        if (s.warmup) {
          await page.close();
          continue;
        }
        if (s.waitFor) {
          await page
            .locator(s.waitFor)
            .first()
            .waitFor({ state: "visible", timeout: 20_000 })
            .catch(() => missing.push(`${s.name} ${viewport.name}`));
        }
        const { image, stable: ok } = await stable(page);
        const file = join(outDir, `${s.name}__${viewport.name}.png`);
        writeFileSync(file, image);
        if (!ok) unstable.push(file);
        await page.close();
      }
      await context.close();
    }
  }
} finally {
  await browser.close();
}
console.log(
  `${SCENARIOS.filter((s) => !s.warmup).length * VIEWPORTS.length} screenshot(s) written to ${outDir}`,
);
if (missing.length) console.log(`waitFor never matched: ${missing.join(", ")}`);
if (unstable.length) console.log(`never stabilised:\n${unstable.join("\n")}`);
process.exitCode = unstable.length || missing.length ? 1 : 0;
