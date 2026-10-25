// #16131 evidence (deterministic setup from det.cjs): the app's external-link dialog (the modal streamdown
// renders through linkSafety.renderModal) opened from a real chat message
// (story ai-elements-message--link-safety-modal), with every keyboard step
// asserted (QUALITY 26) and each changed/affected element asserted visible
// before its shot (QUALITY 27).
// usage: node linkmodal.cjs <storybookUrl> <outDir>
const fs = require("node:fs");
const path = require("node:path");
const { chromium, ARGS, VIEWPORTS, newPage, settle, stableShot } = require("./det.cjs");
const [sb, out] = process.argv.slice(2);

async function stable(page) {
  await settle(page);
  return (await stableShot(page)).image;
}

const FOCUS = `(() => { const a = document.activeElement; return a === document.body ? "body" : (a.tagName.toLowerCase() + " " + (a.getAttribute("aria-label") || a.textContent || "").trim().slice(0, 30)); })()`;

async function main() {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args: ARGS });
  const results = [];
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, reducedMotion: "reduce", colorScheme: "light", locale: "en-US", timezoneId: "UTC" });
    const page = await newPage(ctx);
    await page.goto(`${sb}/iframe.html?id=ai-elements-message--link-safety-modal&viewMode=story`, { waitUntil: "load" });
    await settle(page);
    const v = vp.name;
    const check = async (step, name, pass, got) => results.push({ viewport: v, step, name, pass: !!pass, got: String(got) });
    const shot = async (step) => fs.writeFileSync(path.join(out, `linkmodal__${step}__${v}.png`), await stable(page));
    const dialogOpen = async () => (await page.locator("[role=dialog]").count()) > 0;

    const link = page.getByRole("button", { name: "Example Site" });
    await link.waitFor({ state: "visible" });
    await check("closed", "link visible", true, "visible");
    await check("closed", "no dialog", !(await dialogOpen()), await dialogOpen());
    await shot("closed");

    await link.focus();
    await page.keyboard.press("Enter");
    await page.locator("[role=dialog]").first().waitFor({ state: "visible" });
    const title = page.getByText("Open external link", { exact: false }).first();
    await check("open", "dialog visible after Enter", await dialogOpen(), await dialogOpen());
    await check("open", "title 'Open external link' visible", await title.isVisible(), await title.isVisible());
    await check("open", "'Open link' button visible", await page.getByRole("button", { name: "Open link" }).isVisible(), "");
    await check("open", "'Cancel' button visible", await page.getByRole("button", { name: "Cancel" }).isVisible(), "");
    await check("open", "focus inside dialog", await page.evaluate(`!!document.activeElement.closest('[role=dialog]')`), await page.evaluate(FOCUS));
    await shot("open");

    const order = [];
    for (let i = 1; i <= 4; i++) {
      await page.keyboard.press("Tab");
      const f = await page.evaluate(FOCUS);
      order.push(f);
      await check(`tab${i}`, "focus stays inside dialog (trap)", await page.evaluate(`!!document.activeElement.closest('[role=dialog]')`), f);
      await shot(`tab${i}`);
    }
    await check("tab-order", "Tab cycles Close, Cancel, Open link", ["Close", "Cancel", "Open link"].every((n) => order.some((o) => o.includes(n))), order.join(" > "));

    await page.keyboard.press("Escape");
    await page.waitForTimeout(600);
    await check("esc", "Esc closes the dialog", !(await dialogOpen()), await dialogOpen());
    const after = await page.evaluate(FOCUS);
    await check("esc", "focus returns to the link", after.includes("Example Site"), after);
    await shot("esc");
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(out, "asserts.json"), JSON.stringify(results, null, 1));
  const fails = results.filter((r) => !r.pass);
  console.log(`${results.length} assertions, ${fails.length} failed`);
  for (const f of fails) console.log(`FAIL ${f.viewport} ${f.step}: ${f.name} (got ${f.got})`);
  if (fails.length) process.exitCode = 1;
}
main().catch((e) => { console.error(e); process.exit(1); });
