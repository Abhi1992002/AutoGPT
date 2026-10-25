// DS3a-1 call-site evidence harness (evidence only, never committed).
//
// Every capture names the call site it covers, mounts the real component (a page of the
// running app, or a story that renders the real component), asserts the changed element is
// visible before the shot, and asserts every keyboard step; a miss fails the capture and the
// run exits non-zero. Determinism is fixed at the source: fixed viewport and scale, software
// raster flags (DS1's), stories start their Date at one fixed instant (app pages get no fake clock, see runSpec), UTC/en-US, seeded data where the backend stamps the
// wall clock, finite animations run to completion (no-preference motion: with `reduce` the
// app sidebar keeps its SSR blur, see README), infinite CSS animations stopped at their start
// by Playwright, and a shot only when three consecutive frames are identical.
//
// usage: npx tsx harness.mts --out <dir> --app <url> --sb <url> --ev <url> [--only id,id]
import { chromium, type Browser, type BrowserContext, type Locator, type Page } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { SPECS, type Spec, type H } from "./specs.mts";

const arg = (name: string) => { const i = process.argv.indexOf(name); return i === -1 ? undefined : process.argv[i + 1]; };
const OUT = arg("--out")!; const APP = arg("--app") ?? "http://localhost:3000";
const SB = arg("--sb") ?? "http://localhost:6006"; const EV = arg("--ev") ?? "http://localhost:6102";
const ONLY = arg("--only")?.split(",");
// --resume: re-run the selected captures into an existing run, replacing only their entries (reruns are recorded)
const RESUME = process.argv.includes("--resume");
// --continue: after an interrupted run, skip every capture that already passed in OUT/results.json
const CONTINUE = process.argv.includes("--continue");
const FIXED = new Date("2026-01-15T12:00:00.000Z");
const VIEWPORTS = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } } as const;
type VP = keyof typeof VIEWPORTS;
const ARGS = ["--disable-gpu", "--disable-gpu-rasterization", "--disable-partial-raster", "--num-raster-threads=1",
  "--disable-skia-runtime-opts", "--force-color-profile=srgb", "--font-render-hinting=none", "--disable-lcd-text",
  // the classic scrollbar's thumb depends on where the page was scrolled before a full-page shot
  "--hide-scrollbars"];

// Backend fields that carry the server's wall clock: pinned so the page renders the same text every run.
function pinClock(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(pinClock);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) =>
      [k, k === "timestamp" && typeof v === "string" ? FIXED.toISOString() : pinClock(v)]));
  }
  return value;
}

// One sign-in per run, shared by every context: signing in per capture trips the auth rate limit
// (HTTP 429) and the page then renders signed out, with the public sidebar.
let session: Awaited<ReturnType<BrowserContext["storageState"]>> | undefined;
async function signInOnce(browser: Browser) {
  if (session) return session;
  const context = await browser.newContext();
  const r = await context.request.post(`${APP}/api/auth/sign-in/email`, {
    data: { email: process.env.SCREENSHOT_EMAIL, password: process.env.SCREENSHOT_PASSWORD },
    headers: { "Content-Type": "application/json" },
  });
  if (!r.ok()) throw new Error(`sign-in failed: ${r.status()}`);
  session = await context.storageState(); await context.close();
  return session;
}

async function newContext(browser: Browser, vp: VP, signedIn: boolean, motion: "reduce" | "no-preference" = "no-preference") {
  const context = await browser.newContext({
    viewport: VIEWPORTS[vp], deviceScaleFactor: 1, reducedMotion: motion,
    colorScheme: "light", locale: "en-US", timezoneId: "UTC",
    storageState: signedIn ? await signInOnce(browser) : undefined,
  });
  await context.route(/agpt\.co/, (r) => r.abort());
  // the changelog popup (same-origin feed, auto-dismissed after 8s) covers whatever is under it
  await context.route(/\/api\/changelog/, (r) => r.abort());
  await context.route(/\/api\/proxy\/api\/admin\/diagnostics\//, async (route) => {
    const response = await route.fetch();
    let json: unknown;
    try { json = await response.json(); } catch { return route.fulfill({ response }); }
    return route.fulfill({ response, json: pinClock(json) });
  });
  return context;
}

// page.evaluate has no timeout of its own: a page that never answers must fail the capture, not stall the run
const within = <T,>(ms: number, p: Promise<T>, what: string) =>
  Promise.race([p, new Promise<never>((_, no) => setTimeout(() => no(new Error(`not stable: ${what} did not answer in ${ms}ms`)), ms))]);

async function settle(page: Page) {
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => undefined);
  await within(40_000, page.evaluate(async () => {
    await document.fonts.ready;
    const pending = Array.from(document.images).filter((i) => !i.complete && i.loading !== "lazy")
      .map((i) => new Promise((d) => { i.addEventListener("load", d, { once: true }); i.addEventListener("error", d, { once: true }); }));
    await Promise.race([Promise.all(pending), new Promise((d) => setTimeout(d, 10_000))]);
    // finite animations (framer/WAAPI, CSS transitions) run to their end state
    const finite = document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity);
    await Promise.race([Promise.all(finite.map((a) => a.finished.catch(() => undefined))), new Promise((d) => setTimeout(d, 5_000))]);
  }), "the page (settle)");
  await within(10_000, page.evaluate(() => new Promise((d) => requestAnimationFrame(() => requestAnimationFrame(d)))), "the page (two frames)");
}

async function stableShot(page: Page) {
  const opts = { fullPage: true, animations: "disabled", caret: "hide", scale: "css" } as const;
  const deadline = Date.now() + 45_000;
  let prev = await page.screenshot(opts); let same = 1;
  while (Date.now() < deadline) {
    await page.waitForTimeout(750); await settle(page);
    const next = await page.screenshot(opts);
    same = next.equals(prev) ? same + 1 : 1; prev = next;
    if (same >= 3) return prev;
  }
  throw new Error("not stable: frames kept changing for 45s");
}

// Toasts the page raised on its own (a failed request) are not the call site: the capture fails and is retaken.
async function assertNoStrayToast(page: Page, allowed: RegExp | undefined) {
  const toasts = await page.locator("[data-sonner-toast], [role=status][data-state=open], li[data-state=open][role=status]").allInnerTexts();
  const stray = toasts.map((t) => t.trim()).filter((t) => t && !(allowed && allowed.test(t)));
  if (stray.length) throw new Error(`unexpected toast: ${stray.join(" | ")}`);
}

type Check = { step: string; ok: boolean; detail: string };
type Result = { id: string; viewport: VP; callSite: string; files: string[]; checks: Check[]; observed: Record<string, string>; attempts: number; ok: boolean; error?: string };

async function runSpec(browser: Browser, spec: Spec, vp: VP): Promise<Result> {
  const res: Result = { id: spec.id, viewport: vp, callSite: spec.callSite, files: [], checks: [], observed: {}, attempts: 0, ok: false };
  for (let attempt = 1; attempt <= 3; attempt++) {
    res.attempts = attempt; res.checks = []; res.files = []; res.observed = {};
    const context = await newContext(browser, vp, spec.signedIn ?? false, spec.motion);
    const page = await context.newPage();
    // Playwright used as a library has no action timeout: a step that can never act must fail, not hang
    context.setDefaultTimeout(30_000); context.setDefaultNavigationTimeout(90_000);
    try {
      // Stories: dates start from FIXED (the calendar marks "today"). App pages: no clock control, nothing
      // on these call sites reads the browser clock, and any fake Date makes Next's client router drop
      // navigations at random (seen on /admin/marketplace and /admin/spending).
      if ("story" in spec.target) { await page.clock.install({ time: FIXED }); await page.clock.resume(); }
      const url = "app" in spec.target ? `${APP}${spec.target.app}`
        : `${spec.target.sb === "ev" ? EV : SB}/iframe.html?id=${spec.target.story}&viewMode=story`;
      await page.goto(url, { waitUntil: "load", timeout: 60_000 });
      if ("story" in spec.target) await page.locator("#storybook-root > *").first().waitFor({ state: "attached", timeout: 30_000 });
      await settle(page);
      const h = makeHelpers(page, res, vp);
      await within(6 * 60_000, spec.run(h), "the capture (6 min watchdog)");
      await assertNoStrayToast(page, spec.allowToast);
      res.ok = res.checks.every((c) => c.ok);
      if (!res.ok) throw new Error(`failed: ${res.checks.filter((c) => !c.ok).map((c) => c.step).join("; ")}`);
      await context.close();
      return res;
    } catch (e) {
      res.ok = false; res.error = String((e as Error).message ?? e).slice(0, 400);
      await context.close();
      // a failed keyboard or visibility assertion is a result, not a flake: only stray toasts and instability are retaken
      // A failed keyboard or visibility assertion after the page was up is a result, not a flake. Retaken: a stray
      // toast, frames that never settle, a network error, or a page that never got as far as its first shot.
      // Every retake is recorded (attempts) and reported.
      if (!/unexpected toast|not stable|net::/.test(res.error) && res.files.length > 0) return res;
    }
  }
  return res;
}

function makeHelpers(page: Page, res: Result, vp: VP): H {
  const check = (step: string, ok: boolean, detail = "") => { res.checks.push({ step, ok, detail }); };
  const describe = () => page.evaluate(() => {
    const a = document.activeElement as HTMLElement | null;
    if (!a || a === document.body) return "body";
    const attrs = ["role", "aria-label", "aria-expanded", "data-slot", "data-id", "data-testid", "name"].map((k) => a.getAttribute(k) ? `${k}=${a.getAttribute(k)}` : "").filter(Boolean).join(" ");
    return `${a.tagName.toLowerCase()} ${attrs} "${(a.innerText || a.getAttribute("value") || "").trim().slice(0, 40)}"`;
  });
  const h: H = {
    page, viewport: vp,
    loc: (sel) => page.locator(sel).first(),
    async visible(sel, what) {
      const l = typeof sel === "string" ? page.locator(sel).first() : sel;
      let ok = true; try { await l.waitFor({ state: "visible", timeout: 15_000 }); } catch { ok = false; }
      const box = ok ? await l.boundingBox() : null;
      check(`visible: ${what}`, ok && !!box && box.width > 0 && box.height > 0, box ? `${Math.round(box.x)},${Math.round(box.y)} ${Math.round(box.width)}x${Math.round(box.height)}` : "not visible");
    },
    async hidden(sel, what) {
      const l = typeof sel === "string" ? page.locator(sel).first() : sel;
      let ok = true; try { await l.waitFor({ state: "hidden", timeout: 10_000 }); } catch { ok = false; }
      check(`hidden: ${what}`, ok);
    },
    async expect(step, fn) { let ok = false; let detail = ""; try { const r = await fn(); ok = r === true || (typeof r === "object" && r.ok); detail = typeof r === "object" ? r.detail : ""; } catch (e) { detail = String(e).slice(0, 200); } check(step, ok, detail); },
    async tabTo(target, what, max = 60) {
      const l = typeof target === "string" ? page.locator(target).first() : target;
      if ((await l.count()) === 0) { check(`Tab reaches ${what}`, false, "the target is not on the page"); return -1; }
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
      for (let i = 1; i <= max; i++) {
        await page.keyboard.press("Tab");
        if (await l.evaluate((el) => el === document.activeElement || el.contains(document.activeElement)).catch(() => false)) {
          check(`Tab reaches ${what}`, true, `${i} Tab presses -> ${await describe()}`); return i;
        }
      }
      check(`Tab reaches ${what}`, false, `not reached in ${max} presses; focus on ${await describe()}`); return -1;
    },
    async press(key, step, expectFn) {
      await page.keyboard.press(key); await settle(page);
      if (expectFn) await h.expect(`${key}: ${step}`, expectFn);
    },
    async focused() { return describe(); },
    observe(name, value) { res.observed[name] = value; },
    async shot(state) {
      const name = `${res.id}--${state}__${vp}.png`;
      writeFileSync(join(OUT, name), await stableShot(page)); res.files.push(name);
    },
    settle: () => settle(page),
  };
  return h;
}

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ args: ARGS });
const results: Result[] = [];
const previous: (Result & { reruns?: number })[] = RESUME || CONTINUE ? (() => { try { return JSON.parse(readFileSync(join(OUT, "results.json"), "utf8")); } catch { return []; } })() : [];
const done = new Set(CONTINUE ? previous.filter((r) => r.ok).map((r) => `${r.id}|${r.viewport}`) : []);
const mergedNow = () => {
  if (!RESUME && !CONTINUE) return results;
  const keep = previous.filter((old) => !results.some((r) => r.id === old.id && r.viewport === old.viewport));
  return [...keep, ...results.map((r) => { const old = previous.find((o) => o.id === r.id && o.viewport === r.viewport); return old && RESUME ? { ...r, reruns: (old.reruns ?? 0) + 1, firstError: old.error } : r; })];
};
for (const spec of SPECS) {
  if (ONLY && !ONLY.some((o) => spec.id.startsWith(o))) continue;
  for (const vp of spec.viewports ?? (["desktop", "mobile"] as VP[])) {
    if (done.has(`${spec.id}|${vp}`)) continue;
    const r = await runSpec(browser, spec, vp);
    results.push(r);
    writeFileSync(join(OUT, "results.json"), JSON.stringify(mergedNow(), null, 1));
    console.log(`${r.ok ? "ok  " : "FAIL"} ${spec.id} ${vp} (${r.files.length} shots, ${r.checks.filter((c) => c.ok).length}/${r.checks.length} checks, attempt ${r.attempts})${r.error ? " " + r.error : ""}`);
  }
}
await browser.close();
const merged = mergedNow();
writeFileSync(join(OUT, "results.json"), JSON.stringify(merged, null, 1));
const failed = merged.filter((r) => !r.ok);
console.log(`${merged.length} captures, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);
