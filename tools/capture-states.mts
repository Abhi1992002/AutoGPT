/**
 * DS3a-2 evidence: screenshots + DOM of every call-site state, base vs head.
 *
 *   npx tsx capture-states.mts capture <spec.json> <out dir> [--app http://localhost:3000] [--sb http://localhost:6106]
 *   npx tsx capture-states.mts compare <before dir> <after dir> <diff dir>
 *
 * spec.json: [{ "kind": "story"|"route", "id": "...", "url"?: "/path", "auth"?: true,
 *               "states": [{ "name": "...", "steps": [{ "action": "click", "selector": "..." }, ...] }] }]
 * Each state starts from a fresh page. Per state it writes
 *   <slug>__<state>__<viewport>.png   the screenshot (retaken until 3 in a row are identical)
 *   <slug>__<state>__<viewport>.dom   body DOM with every class attribute removed (tags, aria, roles, ids, text)
 *   <slug>__<state>__<viewport>.cls   the class attribute of every element, in document order
 *   <slug>__<state>__<viewport>.focus the focused element after the steps (keyboard checks)
 * Determinism follows scripts/screenshot-pages.ts: fixed viewports at scale 1,
 * software raster, reduced motion, animations and transitions off, caret hidden,
 * clock pinned, UTC, en-US.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const FE = "/home/vercel-sandbox/autogpt/autogpt_platform/frontend";
const req = createRequire(join(FE, "package.json"));
const { chromium } = req("@playwright/test");
const { comparePngs } = await import(join(FE, "scripts/screenshot-pages.ts"));

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];
const ARGS = [
  "--disable-gpu", "--disable-gpu-rasterization", "--disable-partial-raster", "--num-raster-threads=1",
  "--disable-skia-runtime-opts", "--force-color-profile=srgb", "--font-render-hinting=none", "--disable-lcd-text",
];
const FIXED_TIME = new Date("2026-01-15T12:00:00.000Z");
const FREEZE_CSS =
  "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important}";

interface Step { action: string; selector?: string; key?: string; text?: string; ms?: number }
interface Entry { kind: "story" | "route"; id: string; url?: string; auth?: boolean; states: { name: string; steps: Step[] }[] }

const slug = (s: string) => s.replace(/^\//, "").replace(/[^a-zA-Z0-9-]+/g, "_") || "root";

async function settle(page: any) {
  await page.waitForLoadState("networkidle", { timeout: 3000 }).catch(() => undefined);
  await page.evaluate(async () => { await (document as any).fonts.ready; });
  await page.waitForTimeout(400);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

async function runStep(page: any, s: Step) {
  const loc = s.selector ? page.locator(s.selector).first() : null;
  switch (s.action) {
    case "click": await loc!.click({ timeout: 10000 }); break;
    case "hover": await loc!.hover({ timeout: 10000 }); break;
    case "focus": await loc!.focus({ timeout: 10000 }); break;
    case "fill": await loc!.fill(s.text ?? "", { timeout: 10000 }); break;
    case "press": await page.keyboard.press(s.key!); break;
    case "wait": await page.waitForTimeout(s.ms ?? 300); break;
    default: throw new Error(`unknown action ${s.action}`);
  }
  await page.waitForTimeout(150);
}

async function snapshot(page: any) {
  return page.evaluate(() => {
    const clone = document.body.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("script,style,next-route-announcer,noscript").forEach((n) => n.remove());
    const classes: string[] = [];
    clone.querySelectorAll("*").forEach((el) => {
      classes.push(`${el.tagName.toLowerCase()}: ${el.getAttribute("class") ?? ""}`);
      el.removeAttribute("class");
    });
    const a = document.activeElement as HTMLElement | null;
    const focus = a ? `${a.tagName.toLowerCase()} role=${a.getAttribute("role") ?? ""} id=${a.id} name=${(a.getAttribute("aria-label") ?? a.textContent ?? "").trim().slice(0, 60)}` : "none";
    return { dom: clone.innerHTML.replace(/></g, ">\n<"), classes: classes.join("\n"), focus };
  });
}

async function capture(specFile: string, out: string, app: string, sb: string) {
  const spec: Entry[] = JSON.parse(readFileSync(specFile, "utf8"));
  mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args: ARGS });
  const creds = { email: process.env.SCREENSHOT_EMAIL, password: process.env.SCREENSHOT_PASSWORD };
  const log: string[] = [];
  let storage: unknown = undefined;
  if (spec.some((e) => e.auth)) {
    const c = await browser.newContext();
    const r = await c.request.post(`${app}/api/auth/sign-in/email`, { data: creds });
    if (!r.ok()) throw new Error(`sign-in failed ${r.status()}`);
    storage = await c.storageState();
    await c.close();
  }
  const jobs: (() => Promise<void>)[] = [];
  for (const vp of VIEWPORTS) {
    for (const e of spec) {
      for (const st of e.states) jobs.push(async () => { for (let attempt = 0; attempt < 2; attempt++) { const done = await (async () => {
        const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, reducedMotion: "reduce", timezoneId: "UTC", locale: "en-US", ...(e.auth ? { storageState: storage as any } : {}) });
        const page = await ctx.newPage();
        await page.clock.setFixedTime(FIXED_TIME);
        const url = e.kind === "story" ? `${sb}/iframe.html?id=${e.id}&viewMode=story` : `${app}${e.url}`;
        const name = `${e.kind}__${slug(e.id)}__${slug(st.name)}__${vp.name}`;
        try {
          await page.goto(url, { waitUntil: "load", timeout: 60000 });
          await page.addStyleTag({ content: FREEZE_CSS });
          await settle(page);
          for (const s of st.steps) await runStep(page, s);
          await settle(page);
          let prev: Buffer | null = null, same = 0, shot: Buffer = Buffer.alloc(0);
          for (let i = 0; i < 8 && same < 2; i++) {
            shot = await page.screenshot({ fullPage: true, animations: "disabled", caret: "hide" });
            same = prev && prev.equals(shot) ? same + 1 : 0;
            prev = shot;
            if (same < 2) await page.waitForTimeout(500);
          }
          writeFileSync(join(out, `${name}.png`), shot);
          const snap = await snapshot(page);
          writeFileSync(join(out, `${name}.dom`), snap.dom);
          writeFileSync(join(out, `${name}.cls`), snap.classes);
          writeFileSync(join(out, `${name}.focus`), snap.focus);
          log.push(`ok ${name}${same < 2 ? " (UNSTABLE)" : ""}${attempt ? " (retried)" : ""}`);
          await ctx.close();
          return true;
        } catch (err) {
          await ctx.close();
          if (attempt) log.push(`FAIL ${name}: ${(err as Error).message.split("\n")[0]}`);
          return false;
        }
      })(); if (done) break; } });
    }
  }
  const CONCURRENCY = Number(process.env.CONCURRENCY ?? 4);
  let next = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => { while (next < jobs.length) await jobs[next++](); }));
  log.sort();
  await browser.close();
  writeFileSync(join(out, "capture.log"), log.join("\n") + "\n");
  console.log(`${log.filter((l) => l.startsWith("ok")).length} ok, ${log.filter((l) => !l.startsWith("ok")).length} failed`);
  log.filter((l) => !l.startsWith("ok ") || l.includes("UNSTABLE")).forEach((l) => console.log(l));
}

function compare(a: string, b: string, diffDir: string) {
  mkdirSync(diffDir, { recursive: true });
  const names = readdirSync(a).filter((f) => f.endsWith(".png"));
  const rows: string[] = [];
  let bad = 0;
  for (const f of names) {
    const base = f.replace(/\.png$/, "");
    if (!existsSync(join(b, f))) { rows.push(`| ${base} | MISSING in after | | |`); bad++; continue; }
    const r = comparePngs(readFileSync(join(a, f)), readFileSync(join(b, f)));
    if (r.diff && r.diffPixels) writeFileSync(join(diffDir, f), r.diff);
    // React useId values (radix-_r_3_, «r1», :r2:) depend on mount order across loads, not on the code.
    // Also: the server port in absolute URLs (each commit is served on its own port), and
    // attribute order (Radix adds aria-hidden to focus guards at a moment that varies).
    const sortAttrs = (line: string) => line.replace(/^<([a-zA-Z0-9-]+)((?:\s[^\s=>]+(?:="[^"]*")?)*)(\s*\/?>)/, (_m, tag, attrs, end) =>
      `<${tag}${(attrs.match(/\s[^\s=>]+(?:="[^"]*")?/g) ?? []).sort().join("")}${end}`);
    const norm = (t: string) => t.replace(/_r_[0-9a-z]+_/g, "_r_ID_").replace(/«r[0-9a-z]+»/g, "«rID»").replace(/:r[0-9a-z]+:/g, ":rID:")
      .replace(/localhost:\d+/g, "localhost:PORT").split("\n").map(sortAttrs).join("\n");
    const dom = norm(readFileSync(join(a, `${base}.dom`), "utf8")) === norm(readFileSync(join(b, `${base}.dom`), "utf8"));
    const focus = norm(readFileSync(join(a, `${base}.focus`), "utf8")) === norm(readFileSync(join(b, `${base}.focus`), "utf8"));
    if (r.diffPixels || !dom || !focus) bad++;
    rows.push(`| ${base} | ${r.sizeMismatch ?? r.diffPixels} | ${dom ? "identical" : "DIFFERS"} | ${focus ? readFileSync(join(b, `${base}.focus`), "utf8") : "DIFFERS"} |`);
  }
  for (const f of readdirSync(b).filter((f) => f.endsWith(".png"))) if (!existsSync(join(a, f))) { rows.push(`| ${f} | MISSING in before | | |`); bad++; }
  const md = `${names.length} captures, ${bad} differing\n\n| capture | pixel diff (threshold 0) | DOM without class attributes | focused element after the steps |\n| --- | --- | --- | --- |\n${rows.join("\n")}\n`;
  writeFileSync(join(diffDir, "compare.md"), md);
  console.log(md.split("\n")[0]);
  rows.filter((r) => !/\| 0 \| identical \|/.test(r)).slice(0, 30).forEach((r) => console.log(r));
}

const [cmd, ...rest] = process.argv.slice(2);
const flag = (n: string, d: string) => { const i = rest.indexOf(n); return i >= 0 ? rest[i + 1] : d; };
if (cmd === "capture") await capture(rest[0], rest[1], flag("--app", "http://localhost:3000"), flag("--sb", "http://localhost:6106"));
else if (cmd === "compare") compare(rest[0], rest[1], rest[2]);
else throw new Error("usage: capture|compare");
