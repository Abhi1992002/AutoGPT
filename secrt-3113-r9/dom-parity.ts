/** Rendered-DOM parity for SECRT-3113 (QUALITY 17c/e). Uncommitted.
 *   npx tsx .ign-harness/dom-parity.ts <out.json> [baseUrl] [storybookUrl]
 * Serialises the real rendered markup of the pages that mount the changed
 * components, removing only `class` and `data-slot` attributes (the two
 * things these PRs are allowed to change). Tags, text, ARIA, roles, ids and
 * data-streamdown attributes stay, so any other difference shows up. */
import { writeFileSync } from "node:fs";
import { chromium, type Page } from "@playwright/test";
const [
  out,
  baseUrl = "http://localhost:3000",
  sbUrl = "http://localhost:6006",
] = process.argv.slice(2);
/** Canonical serialisation: attributes sorted, inline styles as sorted
 *  `prop:value` lists, React useId values (radix-…, _r_…, «r…») replaced by a
 *  placeholder (they follow render order, which differs between a hydrated
 *  and a client-rendered tree). Only `class` and `data-slot` are dropped. */
async function grabOnce(page: Page, selector: string) {
  // tsx keeps function names via a __name helper the page does not have.
  await page.evaluate("window.__name = (f) => f");
  return page
    .locator(selector)
    .first()
    .evaluate((root) => {
      const idLike = /(radix-[^\s"]*|_[rR]_[^\s"]*|«r[^»]*»)/g;
      const ser = (n: Node): string => {
        if (n.nodeType === 3) return (n.textContent ?? "").replace(/\s+/g, " ");
        if (n.nodeType !== 1) return "";
        const el = n as Element;
        const attrs = Array.from(el.attributes)
          .filter((a) => a.name !== "class" && a.name !== "data-slot")
          .map((a) => {
            let v = a.value.replace(idLike, "<id>");
            if (a.name === "style")
              v = v
                .split(";")
                .map((d) =>
                  d
                    .trim()
                    .replace(/\s*:\s*/, ":")
                    // "0" and "0px" are one length.
                    .replace(/:0$/, ":0px"),
                )
                // Written at runtime by use-stick-to-bottom after a scroll
                // measurement (third-party, unchanged); load timing decides
                // whether it is there yet. Pixels are covered by the captures.
                .filter((d) => d && !d.startsWith("overflow-anchor:"))
                .sort()
                .join(";");
            return `${a.name}="${v}"`;
          })
          .sort();
        return `<${el.tagName.toLowerCase()}${attrs.length ? " " + attrs.join(" ") : ""}>${Array.from(el.childNodes).map(ser).join("")}</${el.tagName.toLowerCase()}>`;
      };
      return ser(root);
    });
}
async function grab(page: Page, selector: string) {
  let prev = await grabOnce(page, selector);
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(1000);
    const next = await grabOnce(page, selector);
    if (next === prev) return next;
    prev = next;
  }
  return prev;
}
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
    locale: "en-US",
    timezoneId: "UTC",
  });
  await ctx.addInitScript(() => {
    let a = 3113;
    Math.random = () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  });
  const r = await ctx.request.post(`${baseUrl}/api/auth/sign-in/email`, {
    data: {
      email: process.env.SCREENSHOT_EMAIL,
      password: process.env.SCREENSHOT_PASSWORD,
    },
    headers: { "Content-Type": "application/json" },
  });
  if (!r.ok()) throw new Error(`sign-in ${r.status()}`);
  const result: Record<string, string> = {};
  const p = await ctx.newPage();
  await p.clock.setFixedTime(new Date("2026-01-15T12:00:00Z"));
  for (const id of [
    "empty-state",
    "branch-toolbar",
    "prompt-input",
    "cmc-owned",
    "cmc-readonly",
    "cmc-submitted",
    "cmc-pending",
    "chatinput-default",
    "chatinput-reset",
    "chatinput-streaming",
    "mention-markdown",
  ]) {
    await p.goto(`${baseUrl}/ds3b3-harness?only=${id}`, {
      waitUntil: "load",
      timeout: 60000,
    });
    await p
      .locator(`[data-harness="${id}"]:visible`)
      .first()
      .waitFor({ state: "visible", timeout: 60000 });
    await p.waitForTimeout(3000);
    result[`harness:${id}`] = await grab(p, `[data-harness="${id}"]:visible`);
  }
  await p.goto(
    `${baseUrl}/home?sessionId=5eed7113-0000-4000-8000-000000000001`,
    { waitUntil: "load", timeout: 60000 },
  );
  await p
    .locator("table:visible")
    .first()
    .waitFor({ state: "visible", timeout: 60000 });
  await p.waitForTimeout(3000);
  result["session:transcript"] = await grab(p, '[role="log"]');
  await p.goto(
    `${sbUrl}/iframe.html?id=ai-elements-message--link-safety-modal&viewMode=story`,
    { waitUntil: "load" },
  );
  await p
    .locator('[data-streamdown="link"]')
    .first()
    .waitFor({ state: "visible" });
  await p.waitForTimeout(1000);
  result["story:link-safety-modal"] = await grab(p, "#storybook-root");
  writeFileSync(out, JSON.stringify(result, null, 1));
  console.log(
    Object.entries(result)
      .map(([k, v]) => `${k}: ${v.length} chars`)
      .join("\n"),
  );
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
