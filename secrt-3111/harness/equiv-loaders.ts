// Loader CSS modules -> classes (SECRT-3111). Old: the module CSS from the
// base checkout (plain class names) + base Tailwind. New: head classes + head
// globals.css. Compares every computed property of the element, ::before and
// ::after, at several sizes, with and without prefers-reduced-motion, and
// checks each keyframe body moved byte for byte (only the name changed).
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { chromium } from "/home/vercel-sandbox/autogpt/autogpt_platform/frontend/node_modules/@playwright/test";
import { cn } from "/home/vercel-sandbox/autogpt/autogpt_platform/frontend/src/lib/utils";

const [baseDir, headDir, out] = process.argv.slice(2).map((p) => resolve(p));
const C = "src/app/(platform)/copilot/components";
const localRequire = createRequire(join(headDir, "package.json"));
const postcss = localRequire("postcss");
const tailwindcss = localRequire("tailwindcss");
const loadConfig = localRequire("tailwindcss/loadConfig");

const RENAME: Record<string, Record<string, string>> = {
  OrbitLoader: { rotate: "orbit-loader-rotate", ball1: "orbit-loader-ball1", ball2: "orbit-loader-ball2" },
  PixelGridLoader: { "pixel-on": "pixel-grid-loader-on" },
  ScaleLoader: { animloader: "scale-loader-grow" },
};

async function compile(dir: string, raw: string, extra: string) {
  const config = loadConfig(join(dir, "tailwind.config.ts"));
  const globals = readFileSync(join(dir, "src/app/globals.css"), "utf8");
  return (await postcss([tailwindcss({ ...config, content: [{ raw, extension: "html" }] })]).process(globals + "\n" + extra, { from: join(dir, "src/app/globals.css") })).css as string;
}

function keyframes(css: string) {
  const map = new Map<string, string>();
  postcss.parse(css).walkAtRules("keyframes", (r: any) => {
    map.set(r.params, r.nodes.map((n: any) => n.toString()).join("\n"));
  });
  return map;
}

// The exact className each component renders (old: module class; new: classes).
function orbit(size: number) {
  const vars = `width:${size}px;height:${size}px;--ball-size:${Math.round(size * 0.4)}px;--spacing:${Math.round(size * 0.6)}px;--gap:${Math.round(size * 0.2)}px`;
  return {
    old: `<div class="${cn("loader")}" style="${vars}"></div>`,
    new: `<div class="${cn(
      "relative animate-[orbit-loader-rotate_1s_infinite]",
      "before:block before:h-[40%] before:w-[40%] before:rounded-[50%] before:content-['']",
      "after:block after:h-[40%] after:w-[40%] after:rounded-[50%] after:content-['']",
      "before:mb-[calc(var(--gap))] before:animate-[orbit-loader-ball1_1s_infinite] before:bg-[#a1a1aa] before:[box-shadow:calc(var(--spacing))_0_0_#18181b]",
      "after:animate-[orbit-loader-ball2_1s_infinite] after:bg-primary after:[box-shadow:calc(var(--spacing))_0_0_#a1a1aa]",
    )}" style="${vars}"></div>`,
  };
}
function scale(size: number, className = "") {
  return {
    old: `<div class="${cn("loader", className)}" style="width:${size}px;height:${size}px"></div>`,
    new: `<div class="${cn(
      "relative inline-block size-12",
      "before:absolute before:left-0 before:top-0 before:box-border before:size-full before:rounded-[50%] before:bg-current before:content-[''] before:animate-[scale-loader-grow_2s_linear_infinite_backwards]",
      "after:absolute after:left-0 after:top-0 after:box-border after:size-full after:rounded-[50%] after:bg-current after:content-[''] after:animate-[scale-loader-grow_2s_linear_1s_infinite_backwards]",
      className,
    )}" style="width:${size}px;height:${size}px"></div>`,
  };
}
function pixel(cellSize: number, round: boolean, delay: number | null, duration: number) {
  const style = `width:${cellSize}px;height:${cellSize}px;opacity:${delay === null ? 0.07 : 0.15};animation-duration:${duration}ms;animation-delay:${delay ?? 0}ms`;
  const base = ["bg-current", round ? "rounded-full" : "rounded-[1px]"];
  return {
    old: `<span class="${cn(...base, delay !== null && "cell")}" style="${style}"></span>`,
    new: `<span class="${cn(...base, delay !== null && "[animation-iteration-count:infinite] [animation-name:pixel-grid-loader-on] [animation-timing-function:ease-in-out] motion-reduce:[animation-name:none]")}" style="${style}"></span>`,
  };
}

async function main() {
  const cases: { name: string; old: string; new: string; module: string }[] = [];
  for (const s of [14, 24, 32]) cases.push({ name: `OrbitLoader size=${s}`, module: "OrbitLoader", ...orbit(s) });
  for (const s of [14, 48]) cases.push({ name: `ScaleLoader size=${s}`, module: "ScaleLoader", ...scale(s) });
  cases.push({ name: "ScaleLoader size=48 text-neutral-400", module: "ScaleLoader", ...scale(48, "text-neutral-400") });
  for (const [round, delay, dur] of [[false, 90, 650], [true, 0, 650], [false, null, 950], [false, 330, 950]] as const)
    cases.push({ name: `PixelGridLoader cell round=${round} delay=${delay} ${dur}ms`, module: "PixelGridLoader", ...pixel(4, round, delay, dur) });

  const lines = ["| loader | old (CSS module) | new (classes) | result |", "| --- | --- | --- | --- |"];
  let failures = 0;
  const browser = await chromium.launch();
  for (const reduced of ["no-preference", "reduce"] as const) {
    for (const c of cases) {
      const moduleCss = readFileSync(join(baseDir, C, c.module, `${c.module}.module.css`), "utf8");
      const oldCss = await compile(baseDir, c.old, moduleCss);
      const newCss = await compile(headDir, c.new, "");
      const page = await browser.newPage({ reducedMotion: reduced });
      const read = async (css: string, html: string) => {
        await page.setContent(`<html><head><style>${css}</style></head><body style="color:rgb(104,104,111)"><div id="host">${html}</div></body></html>`);
        // Freeze animations at their start so both read the same frame.
        await page.evaluate(() => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = 0; }));
        return page.evaluate(() => {
          const el = document.querySelector("#host > *")!;
          const res: Record<string, string> = {};
          for (const pseudo of [null, "::before", "::after"]) {
            const st = getComputedStyle(el, pseudo ?? undefined);
            for (let i = 0; i < st.length; i++) res[`${pseudo ?? "element"} ${st[i]}`] = st.getPropertyValue(st[i]);
          }
          return res;
        });
      };
      const a = await read(oldCss, c.old);
      const b = await read(newCss, c.new);
      const rename = RENAME[c.module];
      const problems: string[] = [];
      for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
        let va = a[k];
        if (k.endsWith("animation-name") && va) va = va.split(", ").map((n) => rename[n] ?? n).join(", ");
        if (va !== b[k]) problems.push(`${k}: ${a[k]} != ${b[k]}`);
      }
      await page.close();
      if (problems.length) failures++;
      lines.push(`| ${c.name} (reduced motion: ${reduced}) | \`${c.old.replace(/\|/g, "\\|")}\` | \`${c.new.replace(/\|/g, "\\|")}\` | ${problems.length ? "FAIL: " + problems.slice(0, 5).join("; ") : `identical (${Object.keys(a).length} computed values; animation-name compared after the rename)`} |`);
    }
  }
  await browser.close();

  // Keyframes: each module keyframe equals the renamed one in head globals.css.
  const headFrames = keyframes(readFileSync(join(headDir, "src/app/globals.css"), "utf8"));
  const kf = ["| module keyframes | globals.css keyframes | body |", "| --- | --- | --- |"];
  for (const [mod, names] of Object.entries(RENAME)) {
    const frames = keyframes(readFileSync(join(baseDir, C, mod, `${mod}.module.css`), "utf8"));
    for (const [oldName, newName] of Object.entries(names)) {
      const same = frames.get(oldName) === headFrames.get(newName);
      if (!same) failures++;
      kf.push(`| ${mod} \`${oldName}\` | \`${newName}\` | ${same ? "identical" : "DIFFERENT"} |`);
    }
  }
  const summary = `${cases.length * 2} loader renders, ${Object.values(RENAME).flatMap(Object.keys).length} keyframes: ${failures} failing`;
  writeFileSync(out, `${summary}\n\n${lines.join("\n")}\n\n${kf.join("\n")}\n`);
  console.log(summary);
  console.log(lines.filter((l) => l.includes("FAIL")).join("\n"));
  process.exitCode = failures ? 1 : 0;
}
main();
