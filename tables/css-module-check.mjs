import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
const req = createRequire(process.cwd() + "/package.json");
const { chromium } = req("@playwright/test");
const postcss = req("postcss"), tailwindcss = req("tailwindcss"), loadConfig = req("tailwindcss/loadConfig");
const [baseDir, headDir] = process.argv.slice(2);
async function globals(dir) {
  const config = loadConfig(dir + "/tailwind.config.ts");
  return (await postcss([tailwindcss({ ...config, content: [{ raw: "x", extension: "html" }] })]).process(readFileSync(dir + "/src/app/globals.css", "utf8"), { from: dir + "/src/app/globals.css" })).css;
}
const mod = (dir) => readFileSync(dir + "/src/components/layout/Navbar/components/AgentActivityDropdown/components/ActivityDropdown/styles.module.css", "utf8");
const browser = await chromium.launch();
async function measure(dir) {
  const page = await browser.newPage();
  // Same rules, with each module selector also applied to a plain probe so its
  // ::-webkit-scrollbar-* declarations can be read through getComputedStyle.
  const m = mod(dir).replace(/::-webkit-scrollbar-(track|thumb)(:hover)?/g, (_, p, h) => `.probe-${p}${h ? "-hover" : ""}`).replace(/div\[style\*="overflow"\]/g, "div");
  await page.setContent(`<html><head><style>${await globals(dir)}</style><style>${m}</style></head><body><div class="scrollContainer"><div style="overflow:auto;height:50px" id="s"><div style="height:500px"></div></div><div class="probe-track" id="t"></div><div class="probe-thumb" id="h"></div><div class="probe-thumb-hover" id="hh"></div></div></body></html>`);
  const v = await page.evaluate(() => Object.fromEntries(["s", "t", "h", "hh"].map((id) => { const st = getComputedStyle(document.getElementById(id)); return [id, { "scrollbar-color": st.scrollbarColor, "scrollbar-width": st.scrollbarWidth, "background-color": st.backgroundColor, "border-radius": st.borderRadius }]; })));
  await page.close();
  return v;
}
const a = await measure(baseDir), b = await measure(headDir);
await browser.close();
const same = JSON.stringify(a) === JSON.stringify(b);
console.log(JSON.stringify({ base: a, head: b }, null, 1));
console.log(same ? "styles.module.css: identical" : "styles.module.css: DIFFERENT");
process.exit(same ? 0 : 1);
