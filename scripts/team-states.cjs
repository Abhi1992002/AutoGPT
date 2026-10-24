// Evidence for #16134: every profile tab on /team/autopilot and the two
// hired experts, in every state its components render, captured against the
// running app. Per state it writes a full-page screenshot and the computed
// typography + box of every element inside the open tab panel, so base and
// head can be compared exactly (QUALITY 17 b / e).
//
// States the local seed cannot produce (chat is not configured, there is no
// E2B) are served by page.route, identically for both SHAs.
//
// usage: E=email P=password node team-states.cjs capture <outDir>
//        node team-states.cjs compare <dirA> <dirB>
const fs = require("node:fs");
const path = require("node:path");
const req = require("node:module").createRequire(
  "/home/vercel-sandbox/autogpt/autogpt_platform/frontend/package.json",
);
const { chromium } = req("@playwright/test");

const BASE = "http://localhost:3000";
const OTTO = "/team/autopilot";
const JAMES_ID = "cf30f780-ef3c-4d3f-a813-6babe31ed15d";
const ANIKA_ID = "0626fe91-9c5d-4f51-8c6f-626623d1e955";
const JAMES = `/team/${JAMES_ID}`;
const ANIKA = `/team/${ANIKA_ID}`;
const FIXED_TIME = new Date("2026-01-15T12:00:00.000Z");
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

function json(route, body, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}
const fail = (route) => json(route, { detail: "Evidence: forced error" }, 500);

const ACTIVITY = {
  timezone: "UTC",
  days: Array.from({ length: 30 }, (_, i) => ({
    day: new Date(Date.UTC(2025, 11, 17 + i)).toISOString().slice(0, 10),
    sessions: [0, 2, 1, 0, 3, 1, 0][i % 7],
    runs: [1, 0, 2, 1, 0, 0, 2][i % 7],
  })),
};
const SESSIONS = {
  sessions: [
    {
      id: "s-evidence-1",
      created_at: "2026-01-14T09:00:00Z",
      updated_at: "2026-01-15T10:00:00Z",
      title: "Draft the Monday status digest",
      chat_status: "idle",
      is_processing: false,
      source_platform: null,
      is_pinned: false,
      expert_id: JAMES_ID,
    },
    {
      id: "s-evidence-2",
      created_at: "2026-01-15T11:00:00Z",
      updated_at: "2026-01-15T11:50:00Z",
      title: "Vendor renewal checklist for Q1",
      chat_status: "running",
      is_processing: true,
      source_platform: null,
      is_pinned: false,
      expert_id: JAMES_ID,
    },
  ],
  total: 2,
};
const FILES = {
  files: [
    {
      id: "f-evidence-1",
      name: "q1-operating-rhythm.md",
      path: "/q1-operating-rhythm.md",
      mime_type: "text/markdown",
      size_bytes: 4821,
      folder_id: null,
      metadata: {},
      origin: "agent-created",
      created_at: "2026-01-14T15:30:00Z",
      expert_id: JAMES_ID,
      is_internal: false,
    },
    {
      id: "f-evidence-2",
      name: "vendor-scorecard.csv",
      path: "/vendor-scorecard.csv",
      mime_type: "text/csv",
      size_bytes: 1290,
      folder_id: null,
      metadata: {},
      origin: "user-upload",
      created_at: "2026-01-13T08:10:00Z",
      expert_id: JAMES_ID,
      is_internal: false,
    },
  ],
  offset: 0,
  has_more: false,
};
const COMPUTER_RUNNING = {
  owner_kind: "expert",
  owner_id: JAMES_ID,
  e2b_active: true,
  box: {
    sandbox_id: "sbx-evidence",
    state: "running",
    started_at: "2026-01-15T11:30:00Z",
    cpu_count: 2,
    memory_mb: 4096,
    template_id: "evidence-template",
    mounts_attached: true,
  },
  screen_on: true,
  mounts: { workspace: "/home/user/workspace" },
  workspace_path: "/home/user/workspace",
  shared_path: "/home/user/shared",
};
const STREAM = {
  kind: "desktop_stream",
  url: "/favicon.ico",
  provider: "e2b",
  sandbox_id: "sbx-evidence",
  requires_auth: false,
};

const R = {
  activity: (id) => `**/api/experts/${id}/activity**`,
  sessions: "**/api/chat/sessions?**",
  files: "**/api/workspace/files?**",
  computer: (id) => `**/api/experts/${id}/computer`,
  desktop: (id) => `**/api/experts/${id}/computer/desktop**`,
  creds: (id) => `**/api/experts/${id}/credentials**`,
  detach: (id) => `**/api/experts/${id}/detach-preview**`,
};

// page, tab (aria-controls suffix), state name, routes, actions, wait text
const S = [];
function add(route, tab, state, opts = {}) {
  S.push({ route, tab, state, ...opts });
}
for (const tab of ["basics", "schedules", "workflows", "skills"])
  add(OTTO, tab, "default");
add(OTTO, "schedules", "no-match", { search: "zzzz-no-match" });
add(OTTO, "workflows", "no-match", { search: "zzzz-no-match" });
add(OTTO, "skills", "no-match", { search: "zzzz-no-match" });
for (const tab of [
  "basics",
  "soul",
  "schedules",
  "workflows",
  "files",
  "computer",
  "integrations",
  "skills",
  "settings",
]) {
  add(JAMES, tab, "default");
  add(ANIKA, tab, "default");
}
add(JAMES, "basics", "populated", {
  routes: {
    [R.activity(JAMES_ID)]: (r) => json(r, ACTIVITY),
    [R.sessions]: (r) => json(r, SESSIONS),
    [R.files]: (r) => json(r, FILES),
  },
  wait: "Vendor renewal checklist",
});
add(JAMES, "basics", "error", {
  routes: {
    [R.activity(JAMES_ID)]: fail,
    [R.sessions]: fail,
    [R.files]: fail,
  },
  waitMs: 12000,
});
add(JAMES, "schedules", "no-match", { search: "zzzz-no-match" });
add(JAMES, "workflows", "grid", { click: "[aria-label='Grid view']" });
add(JAMES, "workflows", "no-match", { search: "zzzz-no-match" });
add(JAMES, "files", "populated", {
  routes: { [R.files]: (r) => json(r, FILES) },
  wait: "vendor-scorecard.csv",
});
add(JAMES, "files", "error", {
  routes: { [R.files]: fail },
  wait: "We had the following error",
});
add(JAMES, "computer", "running", {
  routes: { [R.computer(JAMES_ID)]: (r) => json(r, COMPUTER_RUNNING) },
  wait: "Running",
});
add(JAMES, "computer", "stream", {
  routes: {
    [R.computer(JAMES_ID)]: (r) => json(r, COMPUTER_RUNNING),
    [R.desktop(JAMES_ID)]: (r) => json(r, STREAM),
  },
  click: "[role=tabpanel] button:not([disabled]) >> nth=-1",
  wait: "Interactive Desktop",
});
add(JAMES, "computer", "error", {
  routes: { [R.computer(JAMES_ID)]: fail },
  wait: "We had the following error",
});
add(JAMES, "integrations", "no-match", { search: "zzzz-no-match" });
add(JAMES, "integrations", "error", {
  routes: { [R.creds(JAMES_ID)]: fail },
  wait: "We had the following error",
});
add(JAMES, "skills", "no-match", { search: "zzzz-no-match" });
add(JAMES, "settings", "preview-error", {
  routes: { [R.detach(JAMES_ID)]: fail },
  wait: "Retry",
});

// Interactive states (QUALITY 17 b): menus, focus, accordion, keyboard.
const FILTER = (label) => `[role=tabpanel] button[aria-label^="${label}"]`;
add(JAMES, "schedules", "filter-open", { steps: [{ click: FILTER("Filter schedules") }, { wait: 500 }] });
add(JAMES, "schedules", "filter-arrow", { steps: [{ click: FILTER("Filter schedules") }, { wait: 300 }, { press: "ArrowDown" }, { wait: 300 }] });
add(JAMES, "schedules", "filter-esc", { steps: [{ click: FILTER("Filter schedules") }, { wait: 300 }, { press: "Escape" }, { wait: 300 }] });
add(JAMES, "files", "filter-open", { steps: [{ click: FILTER("Filter files") }, { wait: 500 }] });
add(JAMES, "workflows", "search-focus", { steps: [{ click: "[role=tabpanel] input" }, { wait: 300 }] });
add(OTTO, "skills", "search-focus", { steps: [{ click: "[role=tabpanel] input" }, { wait: 300 }] });
add(JAMES, "integrations", "accordion-closed", { steps: [{ click: "[role=tabpanel] [data-slot=accordion-trigger]" }, { wait: 600 }] });
add(JAMES, "integrations", "accordion-keyboard", { steps: [{ click: "[role=tabpanel] [data-slot=accordion-trigger]" }, { wait: 400 }, { press: "Enter" }, { wait: 600 }] });
add(JAMES, "workflows", "run-focus", { steps: [{ focus: "[role=tabpanel] button:has-text('Run')" }, { press: "Shift+Tab" }, { press: "Tab" }, { wait: 300 }] });

// Rule 27: the changed call sites each state must show, asserted visible
// before the shot. Strings are text, "css=" prefixes a selector.
const EXPECT = {
  [`${OTTO}|basics`]: ["Your built-in generalist"],
  [`${OTTO}|schedules`]: ["css=[role=tabpanel] input", "css=[role=tabpanel] button[aria-label^='Filter schedules']", "css=[data-testid=schedule-row]"],
  [`${OTTO}|workflows`]: ["Vendor follow-up tracker", "css=[role=tabpanel] button:has-text('Run')", "css=[role=tabpanel] input"],
  [`${OTTO}|skills`]: ["weekly-status-digest", "css=[role=tabpanel] input"],
  [`${JAMES}|basics`]: ["Recent conversations", "Last 30 days", "day streak"],
  [`${JAMES}|soul`]: ["css=[role=tabpanel] dd"],
  [`${JAMES}|schedules`]: ["Create schedule", "css=[data-testid=schedule-row]", "css=[role=tabpanel] input"],
  [`${JAMES}|workflows`]: ["Weekly status digest", "Install workflow", "css=[role=tabpanel] button:has-text('Run')"],
  [`${JAMES}|files`]: ["css=[role=tabpanel] input", "css=[role=tabpanel] button[aria-label^='Filter files']"],
  [`${JAMES}|computer`]: ["James's computer"],
  [`${JAMES}|integrations`]: ["OpenAI", "Add integration", "Use existing"],
  [`${JAMES}|skills`]: ["Add skill", "css=[role=tabpanel] input"],
  [`${JAMES}|settings`]: ["Fire James", "will pause"],
  [`${ANIKA}|basics`]: ["Start a chat", "Recent conversations"],
  [`${ANIKA}|soul`]: ["css=[role=tabpanel] dd"],
  [`${ANIKA}|schedules`]: ["No schedules yet", "Create schedule"],
  [`${ANIKA}|workflows`]: ["Install workflow"],
  [`${ANIKA}|files`]: ["No files yet"],
  [`${ANIKA}|computer`]: ["Anika's computer"],
  [`${ANIKA}|integrations`]: ["No integrations yet", "Add integration"],
  [`${ANIKA}|skills`]: ["Add skill"],
  [`${ANIKA}|settings`]: ["Fire Anika"],
};
const STATE_EXPECT = {
  "no-match": (tab) => [`No ${tab === "basics" ? "" : tab} match`.replace("  ", " ")],
  populated: (tab) => (tab === "basics" ? ["Vendor renewal checklist", "vendor-scorecard.csv", "Last 30 days"] : ["vendor-scorecard.csv"]),
  error: (tab) => (tab === "basics" ? ["Couldn't load conversations.", "Couldn't load outputs.", "Retry"] : ["We had the following error", "Try Again"]),
  running: () => ["Running", "Screen on", "/home/user/workspace"],
  stream: () => ["Interactive Desktop", "Fullscreen", "Open in new tab", "The AI works on this desktop"],
  grid: () => ["Weekly status digest", "runs"],
  "preview-error": () => ["Retry"],
};
add(JAMES, "files", "no-match", {
  routes: { [R.files]: (r) => json(r, FILES) },
  search: "zzzz-no-match",
});
// Approval mode (COPILOT_AUTO_MODE on through the Playwright flag override,
// the way journeys turn a hosted flag on); only confirming would persist.
const AUTO_MODE = { "copilot-auto-mode": true };
add(JAMES, "settings", "mode-default", { flags: AUTO_MODE, expect: ["Approvals", "(default)"] });
add(JAMES, "settings", "mode-focus", {
  flags: AUTO_MODE,
  expect: ["Approvals"],
  steps: [{ focus: "input[name=expert-autopilot-mode]:checked" }, { press: "Shift+Tab" }, { press: "Tab" }, { wait: 300 }],
  asserts: { focused: "input[type=radio]:checked" },
});
add(JAMES, "settings", "mode-confirm", {
  flags: AUTO_MODE,
  expect: ["Approvals"],
  steps: [{ click: "label:has(input[value=unsupervised])" }, { wait: 600 }],
  asserts: { dialog: true },
});
add(JAMES, "settings", "mode-confirm-esc", {
  flags: AUTO_MODE,
  expect: ["Approvals"],
  steps: [{ click: "label:has(input[value=unsupervised])" }, { wait: 600 }, { press: "Escape" }, { wait: 600 }],
  asserts: { dialog: false, checkedNot: "unsupervised" },
});
// GraphScheduleListItem's View dialog (the mono <dd> this PR changed).
add(JAMES, "schedules", "view-dialog", {
  expect: ["Scheduled workflow run", "Workflow", "css=[role=dialog] dd.font-mono"],
  steps: [{ click: "[data-testid=schedule-view-button]" }, { wait: 800 }],
  asserts: { dialog: true },
});
add(JAMES, "schedules", "view-esc", {
  steps: [{ click: "[data-testid=schedule-view-button]" }, { wait: 800 }, { press: "Escape" }, { wait: 800 }],
  asserts: { dialog: false, focusedLabelStarts: "View schedule" },
});
// Rule 26: the keyboard states assert their outcome.
for (const st of S) {
  if (st.state === "filter-open") st.asserts = { menu: true, focusedInMenu: true };
  if (st.state === "filter-arrow") st.asserts = { menu: true, focusedRole: "menuitemradio" };
  if (st.state === "filter-esc") st.asserts = { menu: false, focusedLabelStarts: "Filter schedules" };
  if (st.state === "search-focus") st.asserts = { focused: "[role=tabpanel] input" };
  if (st.state === "accordion-closed") st.asserts = { expanded: "false" };
  if (st.state === "accordion-keyboard") st.asserts = { expanded: "true", focused: "[data-slot=accordion-trigger]" };
  if (st.state === "run-focus") st.asserts = { focusedText: "Run" };
}

const ASSERT = `(a) => {
  const out = [];
  const el = document.activeElement;
  const ok = (name, pass, got) => out.push({ name, pass: !!pass, got: String(got) });
  if (a.focused) ok("focused " + a.focused, el && el.matches(a.focused), el && el.outerHTML.slice(0, 80));
  if (a.focusedRole) ok("focused role " + a.focusedRole, el && el.getAttribute("role") === a.focusedRole, el && el.getAttribute("role"));
  if (a.focusedText) ok("focused text " + a.focusedText, el && el.textContent.trim() === a.focusedText, el && el.textContent.trim().slice(0, 40));
  if (a.focusedLabelStarts) ok("focused label " + a.focusedLabelStarts, el && (el.getAttribute("aria-label") || "").startsWith(a.focusedLabelStarts), el && el.getAttribute("aria-label"));
  if (a.focusedInMenu !== undefined) ok("focus inside menu", el && el.closest("[role=menu]"), el && el.tagName);
  if (a.menu !== undefined) { const n = document.querySelectorAll("[role=menu]").length; ok("menu open=" + a.menu, (n > 0) === a.menu, n); }
  if (a.dialog !== undefined) { const n = document.querySelectorAll("[role=dialog],[role=alertdialog]").length; ok("dialog open=" + a.dialog, (n > 0) === a.dialog, n); }
  if (a.expanded) { const t = document.querySelector("[role=tabpanel] [data-slot=accordion-trigger]"); ok("aria-expanded=" + a.expanded, t && t.getAttribute("aria-expanded") === a.expanded, t && t.getAttribute("aria-expanded")); }
  if (a.checkedNot) { const c = document.querySelector("input[name=expert-autopilot-mode]:checked"); ok("checked is not " + a.checkedNot, c && c.value !== a.checkedNot, c && c.value); }
  return out;
}`;

const METRICS = `(() => {
  const panel = document.querySelector('[role="tabpanel"][data-state="active"]')
    || document.querySelector('[role="tabpanel"]');
  if (!panel) return { error: "no panel" };
  const rows = [];
  for (const el of [panel, ...panel.querySelectorAll("*")]) {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    rows.push([
      el.tagName.toLowerCase(),
      (el.childNodes.length && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
        ? el.textContent.trim().slice(0, 30) : "",
      cs.fontSize, cs.lineHeight, cs.fontWeight, cs.color, cs.letterSpacing,
      Math.round(r.x * 100) / 100, Math.round(r.y * 100) / 100,
      Math.round(r.width * 100) / 100, Math.round(r.height * 100) / 100,
    ].join(" | "));
  }
  const ph = [...panel.querySelectorAll("input,textarea")].map((el) => {
    const cs = getComputedStyle(el, "::placeholder");
    return "placeholder | " + cs.fontSize + " | " + cs.lineHeight + " | " + cs.color;
  });
  const a = document.activeElement;
  const focused = a ? "focused | " + a.tagName.toLowerCase() + " | " + (a.getAttribute("role") || "") + " | " + (a.getAttribute("aria-label") || a.textContent || "").trim().slice(0, 40) + " | expanded=" + a.getAttribute("aria-expanded") : "focused | none";
  const menus = [...document.querySelectorAll("[role=menu]")].map((m) => "menu | " + m.getAttribute("data-state") + " | " + m.textContent.trim().slice(0, 60));
  return { rows: rows.concat(ph, [focused], menus) };
})()`;

async function settle(page) {
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.evaluate("document.fonts.ready.then(() => true)");
}

async function stableShot(page) {
  const opts = { fullPage: true, animations: "disabled", caret: "hide", scale: "css" };
  let prev = await page.screenshot(opts);
  let same = 1;
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline && same < 3) {
    await page.waitForTimeout(750);
    await settle(page);
    const next = await page.screenshot(opts);
    same = next.equals(prev) ? same + 1 : 1;
    prev = next;
  }
  return { image: prev, stable: same >= 3 };
}

function slug(s) {
  return s.replace(/^\//, "").replace(/[^a-zA-Z0-9-]+/g, "_");
}

async function capture(outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ args: ARGS });
  const problems = [];
  const failures = [];
  try {
    for (const vp of VIEWPORTS) {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
        reducedMotion: "reduce",
        colorScheme: "light",
        locale: "en-US",
        timezoneId: "UTC",
      });
      const res = await ctx.request.post(`${BASE}/api/auth/sign-in/email`, {
        data: { email: process.env.E, password: process.env.P },
      });
      if (!res.ok()) throw new Error(`sign-in ${res.status()}`);
      for (const s of S) {
        const name = `${slug(s.route.replace(JAMES_ID, "james").replace(ANIKA_ID, "anika"))}__${s.tab}__${s.state}__${vp.name}`;
        if (process.env.ONLY && !new RegExp(process.env.ONLY).test(name)) continue;
        const page = await ctx.newPage();
        try {
          await page.clock.setFixedTime(FIXED_TIME);
          for (const [pattern, handler] of Object.entries(s.routes || {}))
            await page.route(pattern, (route) =>
              route.request().method() === "GET" || pattern.includes("desktop")
                ? handler(route)
                : route.continue(),
            );
          if (s.flags)
            await page.addInitScript((flags) => {
              window.localStorage.setItem("autogpt-pw-flag-overrides", JSON.stringify(flags));
            }, s.flags);
          await page.goto(`${BASE}${s.route}`, { waitUntil: "load", timeout: 60000 });
          await settle(page);
          const tab = page.locator(`[role=tab][aria-controls$="-content-${s.tab}"]`).first();
          await tab.click({ timeout: 15000 });
          await settle(page);
          if (s.search) {
            await page.locator("[role=tabpanel] input").first().fill(s.search);
          }
          for (const st of s.steps || []) {
            if (st.click) await page.locator(st.click).first().click({ timeout: 15000 });
            if (st.focus) await page.locator(st.focus).first().focus();
            if (st.press) await page.keyboard.press(st.press);
            if (st.wait) await page.waitForTimeout(st.wait);
          }
          if (s.click) {
            await page.locator(s.click).first().click({ timeout: 15000 });
          }
          if (s.wait)
            await page.getByText(s.wait).first().waitFor({ state: "attached", timeout: 30000 });
          if (s.waitMs) await page.waitForTimeout(s.waitMs);
          const expects = [
            ...(s.state === "default" || s.steps || s.flags ? EXPECT[`${s.route}|${s.tab}`] || [] : []),
            ...(STATE_EXPECT[s.state] ? STATE_EXPECT[s.state](s.tab) : []),
            ...(s.expect || []),
          ];
          const results = [];
          for (const e of expects) {
            const loc = (e.startsWith("css=") ? page.locator(e.slice(4)) : page.getByText(e, { exact: false })).filter({ visible: true }).first();
            let vis = false;
            try { await loc.waitFor({ state: "visible", timeout: 10000 }); vis = true; } catch {}
            results.push({ name: "visible " + e, pass: vis, got: vis ? "visible" : "not visible" });
          }
          if (s.asserts) results.push(...(await page.evaluate(`(${ASSERT})(${JSON.stringify(s.asserts)})`)));
          for (const r of results) if (!r.pass) failures.push(`${name}: FAIL ${r.name} (got ${r.got})`);
          if (!s.steps) await page.mouse.move(1, vp.height - 1);
          const { image, stable } = await stableShot(page);
          if (!stable) problems.push(`unstable ${name}`);
          fs.writeFileSync(path.join(outDir, `${name}.png`), image);
          const metrics = await page.evaluate(METRICS);
          fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(metrics, null, 0));
          fs.writeFileSync(path.join(outDir, `${name}.asserts.json`), JSON.stringify(results, null, 1));
        } catch (e) {
          problems.push(`${name}: ${e.message.split("\n")[0]}`);
        } finally {
          await page.close();
        }
      }
      await ctx.close();
    }
  } finally {
    await browser.close();
  }
  console.log(`${S.length * VIEWPORTS.length} states captured to ${outDir}`);
  if (problems.length) console.log(problems.join("\n"));
  fs.writeFileSync(path.join(outDir, "ASSERTS.txt"), failures.length ? failures.join("\n") + "\n" : "all assertions passed\n");
  console.log(failures.length ? `${failures.length} assertion failures:\n${failures.join("\n")}` : "all assertions passed");
  if (failures.length || problems.length) process.exitCode = 1;
}

function compare(a, b) {
  const { comparePngs } = req("/home/vercel-sandbox/autogpt/autogpt_platform/frontend/node_modules/.pnpm/node_modules/tsx/dist/cjs/index.cjs") && {};
  return { a, b, comparePngs };
}

const [cmd, x, y] = process.argv.slice(2);
if (cmd === "capture") capture(x).catch((e) => { console.error(e); process.exit(1); });
else console.log(compare(x, y));
