// Rule 17(b) evidence: interactive states and keyboard behaviour of every
// molecule story, base vs head. Not committed anywhere.
//   npx tsx interact.ts capture <storybookUrl> <outDir> <shard> <shards>
//   npx tsx interact.ts compare <dirA> <dirB>
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Page } from "@playwright/test";
import { comparePngs } from "/home/vercel-sandbox/autogpt/autogpt_platform/frontend/scripts/screenshot-pages";

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
const ROOT = "#storybook-root";
const INTERACTIVE = `${ROOT} button, ${ROOT} a[href], ${ROOT} [role=tab], ${ROOT} input, ${ROOT} [role=checkbox], ${ROOT} [tabindex="0"]`;
const TRIGGERS = `${ROOT} [aria-haspopup], ${ROOT} [aria-expanded], ${ROOT} [role=tab], ${ROOT} button`;

interface Step {
  label: string;
  png: string;
  dom: string;
  focus: string;
}

async function snapshot(page: Page, dir: string, key: string, label: string, wait: number): Promise<Step> {
  await page.waitForTimeout(wait);
  const png = `${key}__${label}.png`;
  writeFileSync(
    join(dir, png),
    await page.screenshot({ fullPage: true, animations: "disabled", caret: "hide", scale: "css" }),
  );
  const { dom, focus } = (await page.evaluate(`(() => {
    const strip = (el) => {
      el.removeAttribute("data-slot");
      for (const child of Array.from(el.querySelectorAll("[data-slot]"))) child.removeAttribute("data-slot");
      for (const s of Array.from(el.querySelectorAll("script, style"))) s.remove();
      return el;
    };
    const body = strip(document.body.cloneNode(true));
    const a = document.activeElement;
    let focus = "none";
    if (a && a !== document.body) {
      const c = strip(a.cloneNode(false));
      focus = c.outerHTML + " text=" + (a.textContent || "").trim().slice(0, 60);
    }
    return { dom: body.outerHTML, focus };
  })()`)) as { dom: string; focus: string };
  const norm = (t: string) => t.replace(/localhost:\d+/g, "localhost:PORT");
  writeFileSync(join(dir, `${key}__${label}.html`), norm(dom));
  return { label, png, dom: createHash("sha256").update(norm(dom)).digest("hex"), focus: norm(focus) };
}

async function fresh(page: Page, url: string) {
  await page.goto(url, { waitUntil: "load", timeout: 60_000 });
  await page.evaluate("document.fonts.ready");
  await page.waitForTimeout(600);
}

async function visibleCount(page: Page, selector: string, max: number) {
  const loc = page.locator(selector);
  const n = await loc.count();
  const out: number[] = [];
  for (let i = 0; i < n && out.length < max; i++) {
    if (await loc.nth(i).isVisible().catch(() => false)) out.push(i);
  }
  return out;
}

async function capture(sbUrl: string, outDir: string, shard: number, shards: number) {
  mkdirSync(outDir, { recursive: true });
  const index = (await (await fetch(`${sbUrl}/index.json`)).json()) as {
    entries: Record<string, { id: string; type: string }>;
  };
  const ids = Object.values(index.entries)
    .filter((e) => e.type === "story" && e.id.startsWith("molecules-"))
    .map((e) => e.id)
    .sort()
    .filter((id) => !process.env.STORIES || process.env.STORIES.split(",").includes(id))
    .filter((_, i) => i % shards === shard);
  const browser = await chromium.launch({ args: ARGS });
  const results: Record<string, Step[]> = {};
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
      for (const id of ids) {
        const key = `${id}__${vp.name}`;
        const url = `${sbUrl}/iframe.html?id=${id}&viewMode=story`;
        const page = await context.newPage();
        await page.clock.setFixedTime(new Date("2026-01-15T12:00:00.000Z"));
        const steps: Step[] = [];
        try {
          await fresh(page, url);
          steps.push(await snapshot(page, outDir, key, "initial", 200));
          for (let k = 0; k < 6; k++) {
            await page.keyboard.press("Tab");
            steps.push(await snapshot(page, outDir, key, `tab${k}`, 250));
          }
          await fresh(page, url);
          for (const [j, i] of (await visibleCount(page, INTERACTIVE, 5)).entries()) {
            await page.locator(INTERACTIVE).nth(i).hover({ timeout: 3000 }).catch(() => undefined);
            steps.push(await snapshot(page, outDir, key, `hover${j}`, 1000));
          }
          await fresh(page, url);
          const triggers = await visibleCount(page, TRIGGERS, 3);
          for (const [j, i] of triggers.entries()) {
            if (j > 0) await fresh(page, url);
            await page.locator(TRIGGERS).nth(i).click({ timeout: 3000 }).catch(() => undefined);
            steps.push(await snapshot(page, outDir, key, `t${j}-open`, 700));
            await page.keyboard.press("ArrowDown");
            steps.push(await snapshot(page, outDir, key, `t${j}-down1`, 300));
            await page.keyboard.press("ArrowDown");
            steps.push(await snapshot(page, outDir, key, `t${j}-down2`, 300));
            await page.keyboard.press("Escape");
            steps.push(await snapshot(page, outDir, key, `t${j}-esc`, 700));
          }
          if (id.includes("secondarymenu")) {
            await fresh(page, url);
            const target = page.locator(`${ROOT} *`).first();
            await target.click({ button: "right", timeout: 3000 }).catch(() => undefined);
            steps.push(await snapshot(page, outDir, key, `ctx-open`, 700));
            await page.keyboard.press("ArrowDown");
            steps.push(await snapshot(page, outDir, key, `ctx-down1`, 300));
            await page.keyboard.press("Escape");
            steps.push(await snapshot(page, outDir, key, `ctx-esc`, 700));
          }
        } catch (error) {
          steps.push({ label: `error:${String(error).slice(0, 120)}`, png: "", dom: "", focus: "" });
        }
        results[key] = steps;
        await page.close();
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
  writeFileSync(join(outDir, `steps-${shard}.json`), JSON.stringify(results, null, 1));
  console.log(`${Object.keys(results).length} story/viewport runs, ${Object.values(results).flat().length} steps`);
}


async function capturePages(baseUrl: string, outDir: string, routes: string[]) {
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ args: ARGS });
  const results: Record<string, Step[]> = {};
  const PAGE_TRIGGERS = "main [aria-haspopup], main [aria-expanded], [role=dialog] [aria-haspopup]";
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
      const signIn = await context.request.post(`${baseUrl}/api/auth/sign-in/email`, {
        data: { email: process.env.SCREENSHOT_EMAIL, password: process.env.SCREENSHOT_PASSWORD },
        headers: { "Content-Type": "application/json" },
      });
      if (!signIn.ok()) throw new Error(`sign-in failed ${signIn.status()}`);
      for (const route of routes) {
        const key = `page${route.replace(/[^a-zA-Z0-9-]+/g, "_")}__${vp.name}`;
        const url = `${baseUrl}${route}`;
        const page = await context.newPage();
        await page.clock.setFixedTime(new Date("2026-01-15T12:00:00.000Z"));
        const steps: Step[] = [];
        try {
          await fresh(page, url);
          await page.waitForLoadState("networkidle").catch(() => undefined);
          await page.waitForTimeout(1500);
          for (let k = 0; k < 6; k++) {
            await page.keyboard.press("Tab");
            steps.push(await snapshot(page, outDir, key, `tab${k}`, 300));
          }
          const triggers = await visibleCount(page, PAGE_TRIGGERS, 6);
          for (const [j, i] of triggers.entries()) {
            await fresh(page, url);
            await page.waitForLoadState("networkidle").catch(() => undefined);
            await page.waitForTimeout(1500);
            await page.locator(PAGE_TRIGGERS).nth(i).click({ timeout: 3000 }).catch(() => undefined);
            steps.push(await snapshot(page, outDir, key, `t${j}-open`, 900));
            await page.keyboard.press("ArrowDown");
            steps.push(await snapshot(page, outDir, key, `t${j}-down1`, 300));
            await page.keyboard.press("Escape");
            steps.push(await snapshot(page, outDir, key, `t${j}-esc`, 900));
          }
        } catch (error) {
          steps.push({ label: `error:${String(error).slice(0, 120)}`, png: "", dom: "", focus: "" });
        }
        results[key] = steps;
        await page.close();
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
  writeFileSync(join(outDir, `steps-pages.json`), JSON.stringify(results, null, 1));
  console.log(`${Object.keys(results).length} page/viewport runs, ${Object.values(results).flat().length} steps`);
}

function compare(a: string, b: string) {
  const load = (d: string) =>
    Object.assign(
      {},
      ...readdirSync(d)
        .filter((f) => f.startsWith("steps-"))
        .map((f) => JSON.parse(readFileSync(join(d, f), "utf8")) as Record<string, Step[]>),
    ) as Record<string, Step[]>;
  const A = load(a);
  const B = load(b);
  let steps = 0;
  const problems: string[] = [];
  for (const key of new Set([...Object.keys(A), ...Object.keys(B)])) {
    const sa = A[key] ?? [];
    const sb = B[key] ?? [];
    if (sa.map((s) => s.label).join() !== sb.map((s) => s.label).join()) {
      problems.push(`${key}: step lists differ`);
      continue;
    }
    for (let i = 0; i < sa.length; i++) {
      steps++;
      const x = sa[i];
      const y = sb[i];
      if (x.label.startsWith("error")) {
        problems.push(`${key} ${x.label}`);
        continue;
      }
      const px = comparePngs(readFileSync(join(a, x.png)), readFileSync(join(b, y.png)));
      if (px.diffPixels > 0) problems.push(`${key} ${x.label}: ${px.diffPixels} px${px.sizeMismatch ? ` (${px.sizeMismatch})` : ""}`);
      if (x.dom !== y.dom) problems.push(`${key} ${x.label}: DOM differs`);
      if (x.focus !== y.focus) problems.push(`${key} ${x.label}: focus differs: ${x.focus} | ${y.focus}`);
    }
  }
  console.log(`${Object.keys(A).length} story/viewport runs, ${steps} steps compared (pixels, DOM minus data-slot, focused element)`);
  console.log(`${problems.length} differences`);
  for (const p of problems) console.log(p);
  return problems.length === 0 ? 0 : 1;
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === "capture") {
  capture(rest[0], rest[1], Number(rest[2]), Number(rest[3])).catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
} else if (cmd === "capture-pages") {
  capturePages(rest[0], rest[1], rest[2].split(",")).catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
} else if (cmd === "compare") {
  process.exitCode = compare(rest[0], rest[1]);
}
