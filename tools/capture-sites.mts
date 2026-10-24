// Every changed builder call site that DS1's routes and capture-extra.mts do
// not already show, rendered in the running app (real CSS, real data), in
// its interactive states. Same determinism as DS1's scripts/screenshot-pages.ts
// (its Chromium flags, 1440x900 at scale 1, fixed clock, reduced motion,
// animations off, retake until three identical shots). A fresh browser
// context per scene, so no state leaks between scenes. Where a state needs
// data the local stack lacks, the API is stubbed with page.route (named in the
// scene).
//
//   APP_URL=… SCREENSHOT_EMAIL=… SCREENSHOT_PASSWORD=… npx tsx capture-sites.mts <out dir>
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
const req = createRequire(join(process.cwd(), "package.json"));
const { chromium } = req("@playwright/test");

const BASE = process.env.APP_URL ?? "http://localhost:3000";
const [outDir] = process.argv.slice(2);
const FLOW = `${BASE}/build?flowID=fb6139fc-fa1c-4e42-a41a-28dbd2462089`;
const RUN = `${BASE}/build?flowID=142fa2e5-8d73-4457-b16e-ecbd6461d0dc`;
const PARENT = `${BASE}/build?flowID=75095a04-80cb-49c9-9105-62cbdd0cc2c8`;
const ARGS = ["--disable-gpu", "--disable-gpu-rasterization", "--disable-partial-raster", "--num-raster-threads=1", "--disable-skia-runtime-opts", "--force-color-profile=srgb", "--font-render-hinting=none", "--disable-lcd-text"];

const STORE_AGENTS = {
  agents: [1, 2, 3].map((i) => ({
    slug: `evidence-agent-${i}`,
    agent_name: `Evidence marketplace workflow ${i}`,
    agent_image: "",
    creator: "evidence-creator",
    creator_avatar: "",
    sub_heading: "A stubbed marketplace listing",
    description: "Stubbed with page.route so the Marketplace tab renders listings.",
    runs: 100 * i,
    rating: 4.5,
    agent_graph_id: `00000000-0000-0000-0000-00000000000${i}`,
  })),
  pagination: { total_items: 3, total_pages: 1, current_page: 1, page_size: 20 },
};

const MCP_TOOLS = {
  server_name: "Evidence MCP",
  protocol_version: "2025-06-18",
  tools: [
    { name: "search_docs", description: "Search the documentation for pages that match a query and return the most relevant sections with their titles and links.", input_schema: { type: "object", properties: { query: { type: "string", description: "What to search for" }, limit: { type: "integer", description: "How many results" }, section: { type: "string", description: "Restrict to one section" } }, required: ["query"] } },
    { name: "get_page", description: "Fetch one documentation page.", input_schema: { type: "object", properties: { url: { type: "string", description: "Page URL" } }, required: ["url"] } },
    { name: "list_sections", description: "List every top-level section.", input_schema: { type: "object", properties: {} } },
  ],
};
const graphFlags = (flags: object) => async (p: any) => {
  await p.route("**/graphs/fb6139fc-fa1c-4e42-a41a-28dbd2462089*", async (r: any) => { const res = await r.fetch(); const j = await res.json(); await r.fulfill({ response: res, json: { ...j, ...flags } }); });
};
const mcpDiscover: Act = async (p) => {
  await p.route("**/mcp/discover-tools", (r: any) => r.fulfill({ json: MCP_TOOLS }));
  await search("MCP Tool")(p);
  await p.locator('[data-id="blocks-control-popover-content"]').getByText("MCP Tool", { exact: false }).first().click();
  await p.waitForTimeout(2000);
  await p.getByPlaceholder("https://mcp.example.com/mcp").fill("https://mcp.example.com/mcp");
  await p.getByRole("button", { name: "Discover Tools" }).click();
  await p.waitForTimeout(2500);
};

type Act = (p: any) => Promise<void>;
const openMenu: Act = async (p) => { await p.locator('[data-testid="blocks-control-blocks-button"]').click(); await p.waitForTimeout(1200); };
const menuTab = (label: string): Act => async (p) => { await openMenu(p); await p.locator('[data-id="blocks-control-popover-content"] button').filter({ hasText: label }).first().click(); await p.waitForTimeout(2500); };
const search = (q: string): Act => async (p) => { await openMenu(p); const i = p.locator('[data-id="blocks-control-popover-content"] input').first(); await i.click(); await i.pressSequentially(q, { delay: 40 }); await p.waitForTimeout(3500); };
const runGraph: Act = async (p) => {
  await p.locator('[data-id="run-graph-button"]').click();
  await p.waitForTimeout(1500);
  const manual = p.locator('[data-id="run-input-manual-run-button"]');
  if (await manual.count()) await manual.click();
};
const firstNode = (p: any) => p.locator('[data-id^="custom-node-"]').first();

// Scenes that type into the debounced block search keep the real clock:
// setFixedTime freezes Date.now(), so lodash debounce would never fire.
const SCENES: { name: string; url: string; realClock?: boolean; mask?: (p: any) => any[]; setup?: (p: any) => Promise<void>; act: Act }[] = [
  // Block menu (NewBlockMenu/**)
  { name: "menu-all-blocks", url: FLOW, act: menuTab("All blocks") },
  { name: "menu-all-blocks-hover", url: FLOW, act: async (p) => { await menuTab("All blocks")(p); await p.locator('[data-id="blocks-control-popover-content"] button').filter({ hasText: "AI Image Generator" }).first().hover(); await p.waitForTimeout(500); } },
  // The drag image only exists for one tick at top:-9999px; a MutationObserver
  // clones it (same cssText from style.ts) to a visible spot for the capture.
  { name: "menu-block-drag-preview", url: FLOW, act: async (p) => {
    await menuTab("All blocks")(p);
    await p.evaluate(() => {
      new MutationObserver((ms) => { for (const m of ms) for (const n of Array.from(m.addedNodes)) { const el = n as HTMLElement; if (el.style?.top === "-9999px") { const c = el.cloneNode(true) as HTMLElement; c.id = "drag-preview-clone"; c.style.top = "120px"; c.style.left = "1000px"; setTimeout(() => document.body.appendChild(c), 0); } } }).observe(document.body, { childList: true });
    });
    const dt = await p.evaluateHandle(() => new DataTransfer());
    await p.locator('[data-id="blocks-control-popover-content"] button').filter({ hasText: "AI Image Generator" }).first().dispatchEvent("dragstart", { dataTransfer: dt });
    await p.waitForTimeout(1000);
  } },
  { name: "menu-input-blocks", url: FLOW, act: menuTab("Input blocks") },
  { name: "menu-action-blocks", url: FLOW, act: menuTab("Action blocks") },
  { name: "menu-output-blocks", url: FLOW, act: menuTab("Output blocks") },
  { name: "menu-integrations", url: FLOW, act: menuTab("Integrations") },
  { name: "menu-integration-apollo", url: FLOW, act: async (p) => { await menuTab("Integrations")(p); await p.locator('[data-id="blocks-control-popover-content"] button').filter({ hasText: "Apollo" }).first().click(); await p.waitForTimeout(2500); } },
  { name: "menu-marketplace-stubbed", url: FLOW, setup: async (p) => { await p.route("**/store/agents*", (r: any) => r.fulfill({ json: STORE_AGENTS })); }, act: menuTab("Marketplace Workflows") },
  { name: "menu-my-workflows", url: FLOW, act: menuTab("My Workflows") },
  { name: "menu-search-results", url: FLOW, realClock: true, act: search("calculator") },
  { name: "menu-search-none", url: FLOW, realClock: true, act: search("zzqqxxnomatch") },
  { name: "menu-search-none-stubbed", url: FLOW, realClock: true, setup: async (p) => { await p.route("**/builder/search*", (r: any) => r.fulfill({ json: { items: [], search_id: "evidence", total_items: { blocks: 0, integrations: 0, marketplace_agents: 0, my_agents: 0 }, pagination: { total_items: 0, total_pages: 0, current_page: 1, page_size: 8 } } })); }, act: search("zzqqxxnomatch") },
  { name: "menu-search-history", url: FLOW, realClock: true, act: async (p) => { await search("calculator")(p); const i = p.locator('[data-id="blocks-control-popover-content"] input').first(); await i.press("Control+A"); await i.press("Backspace"); await p.waitForTimeout(3000); } },
  { name: "menu-filter-chip-hover", url: FLOW, realClock: true, act: async (p) => { await search("calculator")(p); await p.getByRole("button", { name: "Integrations", exact: true }).last().hover(); await p.waitForTimeout(600); } },
  { name: "menu-filter-sheet", url: FLOW, realClock: true, act: async (p) => { await search("calculator")(p); await p.getByRole("button", { name: "All filters" }).click(); await p.waitForTimeout(1500); } },
  { name: "menu-keyboard-focus", url: FLOW, act: async (p) => { await openMenu(p); for (let i = 0; i < 4; i++) await p.keyboard.press("Tab"); await p.waitForTimeout(500); } },
  // Builder actions, chat panel
  { name: "actions-agent-outputs", url: FLOW, act: async (p) => { await p.locator('[data-id="agent-outputs-button"]').click(); await p.waitForTimeout(1500); } },
  { name: "actions-simulate-hover", url: FLOW, act: async (p) => { await p.locator('[data-id="simulate-graph-button"]').hover(); await p.waitForTimeout(1500); } },
  { name: "actions-run-dialog", url: FLOW, act: async (p) => { await p.locator('[data-id="run-graph-button"]').click(); await p.waitForTimeout(2000); } },
  { name: "actions-schedule-dialog", url: FLOW, act: async (p) => { await p.locator('[data-id="schedule-graph-button"]').click(); await p.waitForTimeout(2000); } },
  { name: "chat-panel", url: FLOW, act: async (p) => { await p.getByRole("button", { name: "Chat with builder" }).click(); await p.waitForTimeout(2500); } },
  // Nodes
  { name: "node-hover", url: FLOW, act: async (p) => { await firstNode(p).hover({ position: { x: 120, y: 120 } }); await p.waitForTimeout(500); } },
  { name: "node-advanced-open", url: FLOW, act: async (p) => { await firstNode(p).getByText("Advanced").first().click(); await p.waitForTimeout(800); await p.mouse.move(5, 5); } },
  { name: "node-title-edit", url: FLOW, act: async (p) => { await firstNode(p).getByText("Agent Input").first().dblclick(); await p.waitForTimeout(800); } },
  { name: "node-menu", url: FLOW, act: async (p) => { await firstNode(p).locator("button").first().click(); await p.waitForTimeout(800); } },
  { name: "node-run-completed", url: RUN, act: async (p) => { await runGraph(p); await p.getByText("COMPLETED").first().waitFor({ timeout: 60_000 }).catch(() => undefined); await p.waitForTimeout(3000); await p.mouse.move(5, 5); } },
  { name: "node-run-view-more", url: RUN, mask: (p) => [p.getByText(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)], act: async (p) => { await runGraph(p); await p.getByText("COMPLETED").first().waitFor({ timeout: 60_000 }).catch(() => undefined); await p.waitForTimeout(3000); await p.getByRole("button", { name: /view more|more/i }).first().click(); await p.waitForTimeout(1500); } },
  // Sub-agent update (seeded: Evidence parent -> Evidence sub-workflow v1, v2 renamed its connected input)
  { name: "subagent-update-bar", url: PARENT, act: async () => undefined },
  { name: "subagent-incompatible-dialog", url: PARENT, act: async (p) => { await p.getByRole("button", { name: "Update", exact: true }).first().click(); await p.waitForTimeout(1500); } },
  { name: "subagent-resolution-mode", url: PARENT, act: async (p) => { await p.getByRole("button", { name: "Update", exact: true }).first().click(); await p.waitForTimeout(1200); await p.getByRole("button", { name: "Update Anyway" }).click(); await p.waitForTimeout(2000); } },
  { name: "mcp-tools-list-stubbed", url: FLOW, realClock: true, act: mcpDiscover },
  { name: "mcp-tool-details-stubbed", url: FLOW, realClock: true, act: async (p) => { await mcpDiscover(p); await p.getByRole("button", { name: "Show details" }).first().click(); await p.waitForTimeout(800); } },
  { name: "mcp-tool-selected-stubbed", url: FLOW, realClock: true, act: async (p) => { await mcpDiscover(p); await p.getByText("search_docs").first().click(); await p.waitForTimeout(800); } },
  { name: "safe-mode-toggles-stubbed", url: FLOW, setup: graphFlags({ has_human_in_the_loop: true, has_sensitive_action: true }), act: async (p) => { await p.waitForTimeout(1000); } },
  { name: "safe-mode-toggle-hover-stubbed", url: FLOW, setup: graphFlags({ has_human_in_the_loop: true, has_sensitive_action: true }), act: async (p) => { await p.getByRole("button", { name: /Human in the loop|HITL|Safe/i }).first().hover(); await p.waitForTimeout(1200); } },
  { name: "menu-integration-chips-hover", url: FLOW, act: async (p) => { await openMenu(p); await p.locator('[data-id="blocks-control-popover-content"]').getByText("Github").first().hover(); await p.waitForTimeout(800); } },
  // Page-level states
  { name: "draft-recovery-popup", url: FLOW, act: async (p) => { const i = firstNode(p).locator("input").first(); await i.click(); await i.pressSequentially("x", { delay: 40 }); await p.mouse.click(1300, 700); await p.waitForTimeout(5000); await p.reload({ waitUntil: "load" }); await p.waitForLoadState("networkidle").catch(() => undefined); await p.waitForTimeout(5000); } },
  { name: "readonly-banner-stubbed", url: FLOW, setup: async (p) => { await p.route("**/graphs/fb6139fc-fa1c-4e42-a41a-28dbd2462089*", async (r: any) => { const res = await r.fetch(); const j = await res.json(); await r.fulfill({ response: res, json: { ...j, user_id: "00000000-0000-0000-0000-000000000000" } }); }); }, act: async () => undefined },
  { name: "graph-loading-stubbed", url: FLOW, setup: async (p) => { await p.route("**/graphs/fb6139fc-fa1c-4e42-a41a-28dbd2462089*", () => undefined); }, act: async () => undefined },
  { name: "mcp-dialog", url: FLOW, realClock: true, act: async (p) => { await search("MCP Tool")(p); await p.locator('[data-id="blocks-control-popover-content"]').getByText("MCP Tool", { exact: false }).first().click(); await p.waitForTimeout(3000); } },
];

// mask: a fresh execution id differs on every run; Playwright paints the same
// solid box over it on both commits (declared per scene).
async function stable(page: any, mask: any[] = []) {
  const o = { fullPage: true, animations: "disabled", caret: "hide", scale: "css", mask, maskColor: "#FF00FF" } as const;
  const deadline = Date.now() + 45_000;
  let prev = await page.screenshot(o);
  let n = 1;
  while (Date.now() < deadline) {
    await page.waitForTimeout(750);
    const next = await page.screenshot(o);
    n = next.equals(prev) ? n + 1 : 1;
    prev = next;
    if (n >= 3) return { image: next, ok: true };
  }
  return { image: prev, ok: false };
}

mkdirSync(outDir, { recursive: true });
const only = process.env.ONLY?.split(",");
const browser = await chromium.launch({ args: ARGS });
const log: string[] = [];
// One sign-in for the whole run (Better Auth rate-limits sign-ins); every
// scene gets a fresh context that starts from that session's cookies.
const auth = await browser.newContext();
const signIn = await auth.request.post(`${BASE}/api/auth/sign-in/email`, { data: { email: process.env.SCREENSHOT_EMAIL, password: process.env.SCREENSHOT_PASSWORD }, headers: { "Content-Type": "application/json" } });
if (!signIn.ok()) throw new Error(`sign-in ${signIn.status()}`);
const storageState = await auth.storageState();
await auth.close();
try {
  for (const s of SCENES.filter((x) => !only || only.includes(x.name))) {
    const ctx = await browser.newContext({ storageState, viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: "reduce", colorScheme: "light", locale: "en-US", timezoneId: "UTC" });
    const page = await ctx.newPage();
    if (!s.realClock) await page.clock.setFixedTime(new Date("2026-01-15T12:00:00.000Z"));
    if (s.setup) await s.setup(page);
    await page.goto(s.url, { waitUntil: "load", timeout: 60_000 });
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await page.evaluate(async () => { await document.fonts.ready; });
    await page.waitForTimeout(2500);
    let note = "";
    try { await s.act(page); } catch (e) { note = ` (interaction failed: ${String(e).split("\n")[0].slice(0, 140)})`; }
    const { image, ok } = await stable(page, s.mask ? s.mask(page) : []);
    writeFileSync(join(outDir, `site__${s.name}__desktop.png`), image);
    log.push(`${s.name}: ${ok ? "stable" : "NOT STABLE"}${note}`);
    console.log(log[log.length - 1]);
    await ctx.close();
  }
} finally {
  await browser.close();
}
writeFileSync(join(outDir, "sites-log.txt"), log.join("\n") + "\n");
