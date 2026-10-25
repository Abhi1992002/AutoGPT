/** atoms-text--all-tones, per entry (QUALITY 20/28): an element screenshot of every
 * entry on base and head at 1440x900 and 390x844 (DS1's browser flags), base entry vs
 * the head entry with the same key (tone + variant), compared at threshold 0 with
 * DS1's comparePngs. Lists the entries only head has.
 *   npx tsx .ign-harness/alltones-shots.ts <outdir> <basePort> <headPort> */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { comparePngs } from "../scripts/screenshot-pages";
const [out, basePort, headPort] = process.argv.slice(2);
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
(async () => {
  const b = await chromium.launch({ args: ARGS });
  const report: Record<string, unknown> = {};
  let failing = 0;
  for (const vp of VIEWPORTS) {
    const shots: Record<string, Map<string, Buffer>> = {};
    failing = 0;
    for (const [side, port] of [
      ["base", basePort],
      ["head", headPort],
    ] as const) {
      const ctx = await b.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
        reducedMotion: "reduce",
        colorScheme: "light",
        locale: "en-US",
        timezoneId: "UTC",
      });
      const p = await ctx.newPage();
      await p.goto(
        `http://localhost:${port}/iframe.html?id=atoms-text--all-tones&viewMode=story`,
        { waitUntil: "load" },
      );
      await p.evaluate(() => document.fonts.ready);
      const els = p.locator("#storybook-root [data-slot=text]");
      await els.first().waitFor();
      const keys: string[] = await els.evaluateAll((list) =>
        list.map((el) => {
          const group = el.closest(".space-y-1");
          const label = group
            ? (group.firstElementChild?.textContent ?? "")
                .split(" · ")[0]
                .trim()
            : "";
          const isLabel = group && el === group.firstElementChild;
          return isLabel
            ? `label:${label}`
            : group
              ? `${label}|${(el.textContent ?? "").trim()}`
              : `top|${(el.textContent ?? "").trim()}`;
        }),
      );
      const m = new Map<string, Buffer>();
      const iso = new Map<string, Buffer>();
      const pos = new Map<string, string>();
      const dir = join(out, `${side}-${vp.name}`);
      mkdirSync(dir, { recursive: true });
      const isoDir = join(out, `${side}-${vp.name}-isolated`);
      mkdirSync(isoDir, { recursive: true });
      // Host at integer coordinates for the isolated render: the element is
      // cloned unchanged (same tag, classes, text) into it, so its own pixels
      // are compared free of where the flex-wrap row happens to place it.

      // Pass 1, in place: where the story lays each entry out.
      const outer: string[] = await els.evaluateAll((list) =>
        list.map((el) => el.outerHTML),
      );
      for (let i = 0; i < keys.length; i++) {
        const fname = `${String(i).padStart(3, "0")}__${keys[i].replace(/[^a-z0-9|:-]/gi, "_").replace(/[|:]/g, "--")}.png`;
        const box = await els.nth(i).boundingBox();
        pos.set(
          keys[i],
          box ? `${box.x},${box.y},${box.width}x${box.height}` : "none",
        );
        const buf = await els
          .nth(i)
          .screenshot({ animations: "disabled", caret: "hide", scale: "css" });
        m.set(keys[i], buf);
        writeFileSync(join(dir, fname), buf);
      }
      // Pass 2, isolated: the entry's exact markup (same tag, classes, text)
      // as the only content of the story root, so nothing else on the page
      // (row position, neighbours, page length) touches its pixels.
      for (let i = 0; i < keys.length; i++) {
        const fname = `${String(i).padStart(3, "0")}__${keys[i].replace(/[^a-z0-9|:-]/gi, "_").replace(/[|:]/g, "--")}.png`;
        await p.evaluate((html) => {
          const r = document.getElementById("storybook-root")!;
          r.innerHTML = `<div id="iso-host" style="display:inline-block;padding:8px;background:#fff">${html}</div>`;
        }, outer[i]);
        await p.evaluate(() => document.fonts.ready);
        const ibuf = await p
          .locator("#iso-host")
          .screenshot({ animations: "disabled", caret: "hide", scale: "css" });
        iso.set(keys[i], ibuf);
        writeFileSync(join(isoDir, fname), ibuf);
      }
      shots[side] = m;
      shots[side + "-iso"] = iso;
      shots[side + "-pos"] = pos as unknown as Map<string, Buffer>;
      await ctx.close();
    }
    const results: { key: string; changed: number }[] = [];
    for (const [key, buf] of shots.base) {
      const hb = shots.head.get(key);
      if (!hb) {
        results.push({ key, changed: -1 });
        failing++;
        continue;
      }
      const r = comparePngs(buf, hb) as unknown as { diffPixels: number };
      const changed = r.diffPixels;
      results.push({ key, changed });
    }
    const isoResults: { key: string; changed: number }[] = [];
    for (const [key, buf] of shots["base-iso"]) {
      const hb = shots["head-iso"].get(key);
      const changed = hb
        ? (comparePngs(buf, hb) as unknown as { diffPixels: number }).diffPixels
        : -1;
      isoResults.push({ key, changed });
    }
    const basePos = shots["base-pos"] as unknown as Map<string, string>;
    const headPos = shots["head-pos"] as unknown as Map<string, string>;
    const inPlaceExplained = results
      .filter((r) => r.changed !== 0)
      .map((r) => ({
        ...r,
        basePos: basePos.get(r.key),
        headPos: headPos.get(r.key),
        isolated: isoResults.find((x) => x.key === r.key)?.changed,
      }));
    const added = [...shots.head.keys()].filter((k) => !shots.base.has(k));
    const isoZero = isoResults.filter((r) => r.changed === 0).length;
    report[vp.name] = {
      baseEntries: shots.base.size,
      headEntries: shots.head.size,
      inPlaceAtZero: results.filter((r) => r.changed === 0).length,
      isolatedAtZero: isoZero,
      isolatedNonZero: isoResults.filter((r) => r.changed !== 0),
      inPlaceNonZeroWithPositions: inPlaceExplained,
      added,
    };
    console.log(
      `${vp.name}: base ${shots.base.size} entries; isolated ${isoZero}/${shots.base.size} at 0 px; in place ${results.filter((r) => r.changed === 0).length}/${shots.base.size} at 0 px (the rest moved: positions in the json); head adds ${added.length}`,
    );
    failing = isoResults.filter((r) => r.changed !== 0).length;
  }
  writeFileSync(
    join(out, "alltones-shots.json"),
    JSON.stringify(report, null, 1),
  );
  await b.close();
  process.exitCode = failing ? 1 : 0;
})();
