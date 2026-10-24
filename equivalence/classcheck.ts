// Every "new" class string in pairs.ts must be rendered verbatim by some
// element in the head Storybook's consumer stories.
import { createRequire } from "node:module";
import { join } from "node:path";
import { CHECKS } from "./pairs";
const req = createRequire(join(process.cwd(), "package.json"));
const { chromium } = req("@playwright/test");
const IDS = ["needs-attention", "composer-notices", "chat-notices", "scheduled-chat-notices", "pending-reviews", "pending-review-card-standalone", "briefing", "trial-onboarding", "trial-billing"];
// Parent levels in pairs.ts that only provide context for a Row (not rendered strings).
const CONTEXT_ONLY = new Set(["space-y-7 p-6", "p-0"]);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const seen = new Set<string>();
  for (const id of IDS) {
    await p.goto(`http://localhost:6007/iframe.html?id=organisms-attentioncard-consumers--${id}&viewMode=story`);
    await p.waitForFunction(() => document.body.classList.contains("sb-show-main"), undefined, { timeout: 30000 });
    await p.waitForTimeout(1500);
    for (const c of await p.evaluate(() => Array.from(document.querySelectorAll("#storybook-root *")).map((e) => (e.getAttribute("class") || "").trim()))) seen.add(c);
  }
  await b.close();
  let missing = 0, checked = 0;
  for (const c of CHECKS) for (const s of c.new) {
    if (CONTEXT_ONLY.has(s)) continue;
    checked++;
    if (!seen.has(s)) { missing++; console.log(`MISSING (${c.label}): ${s}`); }
  }
  console.log(`${checked} new class strings checked against the rendered head DOM: ${missing} missing`);
})();
