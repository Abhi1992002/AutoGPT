/** atoms-text--all-tones: every base entry unchanged on head; additions only the new variants/tone. */
import { writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
(async () => {
  const b = await chromium.launch();
  const grab = async (port: number) => {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    await p.goto(`http://localhost:${port}/iframe.html?id=atoms-text--all-tones&viewMode=story`, { waitUntil: "load" });
    await p.locator("#storybook-root [data-slot=text]").first().waitFor();
    const r = await p.evaluate(() => [...document.querySelectorAll("#storybook-root [data-slot=text]")].map((e) => { const s = getComputedStyle(e); return `${e.tagName}|${(e.textContent ?? "").trim()}|${e.className}|${s.fontSize}/${s.lineHeight}/${s.fontWeight}/${s.color}`; }));
    await p.close();
    return r;
  };
  const base = await grab(6007), head = await grab(6008);
  const pool = [...head];
  const missing: string[] = [];
  for (const e of base) { const i = pool.indexOf(e); if (i < 0) missing.push(e); else pool.splice(i, 1); }
  const unexpected = pool.filter((e) => !/body-tight|body-medium-tight|inherit/.test(e.split("|")[1]) && !/text-inherit/.test(e.split("|")[2]));
  const out = { baseEntries: base.length, headEntries: head.length, baseEntriesMissingOrChangedOnHead: missing, addedEntries: pool.length, addedNotNewVariantOrTone: unexpected };
  writeFileSync("/home/vercel-sandbox/harness/alltones-check.json", JSON.stringify(out, null, 1));
  console.log(JSON.stringify({ ...out, baseEntriesMissingOrChangedOnHead: missing.length, addedNotNewVariantOrTone: unexpected.length }));
  await b.close();
})();
