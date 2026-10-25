// Deterministic page/story capture for #16131 / #16134 evidence, run the same
// way on base and head. DS1's committed scripts/screenshot-pages.ts is not
// modified; this follows its capture contract (viewports, device scale 1,
// software raster flags, full-page shots, three identical shots in a row)
// and adds, per the orchestrator's rule-28 decision:
//   - page.emulateMedia({ reducedMotion: "reduce" })
//   - an init script that seeds Math.random with a fixed-seed PRNG
//   - page.clock.install({ time }) + setFixedTime: Date and performance.now
//     start from the same origin on every run; Date stays fixed
//   - waits for network idle, then in the page and in every iframe for the
//     load event, a visible body, document.fonts.ready and every image
//     before each capture
// Nothing is hidden, cropped or masked.
// usage:
//   E=.. P=.. node capture-det.cjs pages <baseUrl> <outDir> <route,route,...>
//   node capture-det.cjs stories <storybookUrl> <outDir> <all|prefix,prefix,...> [skip,...]
//   SHARD=i/n splits a run across n processes.
const fs = require("node:fs");
const path = require("node:path");
const { chromium, ARGS, VIEWPORTS, slug, settle, stableShot, newPage } = require("./det.cjs");

async function main() {
  const [mode, base, out, list, skipList] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  let ids = list ? list.split(",").filter(Boolean) : [];
  const skip = (skipList || "atoms-progress--live").split(",");
  if (mode === "stories") {
    const idx = JSON.parse(await (await fetch(`${base}/index.json`)).text());
    const all = list === "all";
    ids = Object.values(idx.entries).filter((e) => e.type === "story").map((e) => e.id)
      .filter((id) => (all || ids.some((p) => id.startsWith(p))) && !skip.includes(id)).sort();
  }
  // SHARD=i/n keeps every n-th id from i, so one run can be split across
  // processes that write to the same directory.
  if (process.env.SHARD) {
    const [i, n] = process.env.SHARD.split("/").map(Number);
    ids = ids.filter((_, k) => k % n === i);
  }
  const browser = await chromium.launch({ args: ARGS });
  const unstable = [];
  let n = 0;
  try {
    for (const vp of VIEWPORTS) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, reducedMotion: "reduce", colorScheme: "light", locale: "en-US", timezoneId: "UTC" });
      if (mode === "pages") {
        const r = await ctx.request.post(`${base}/api/auth/sign-in/email`, { data: { email: process.env.E, password: process.env.P } });
        if (!r.ok()) throw new Error(`sign-in ${r.status()}`);
      }
      for (const id of ids) {
        const file0 = path.join(out, `${mode === "pages" ? "app" : "story"}__${slug(id)}__${vp.name}.png`);
        // RESUME=1 finishes an interrupted run: shots already written stay.
        if (process.env.RESUME && fs.existsSync(file0)) continue;
        const page = await newPage(ctx);
        const url = mode === "pages" ? `${base}${id}` : `${base}/iframe.html?id=${id}&viewMode=story`;
        const file = path.join(out, `${mode === "pages" ? "app" : "story"}__${slug(id)}__${vp.name}.png`);
        await page.goto(url, { waitUntil: "load", timeout: 60000 });
        await settle(page);
        const { image, stable } = await stableShot(page);
        fs.writeFileSync(file, image);
        if (!stable) unstable.push(file);
        n++;
        await page.close();
      }
      await ctx.close();
    }
  } finally { await browser.close(); }
  console.log(`${n} screenshot(s) written to ${out}`);
  if (unstable.length) { console.log(`never stabilised:\n${unstable.join("\n")}`); process.exitCode = 1; }
}
main().catch((e) => { console.error(e); process.exit(1); });
