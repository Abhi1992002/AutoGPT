// Stubbed chat-session scenarios for DS3b evidence: recent chat rows, expert
// chat groups, the collapsed-rail Chats item, the mobile context panel sheet
// and the WorkOutputSheet. The browser reaches the backend through the Next
// proxy (customMutator -> "/api/proxy" + "/api/..."), so every stub matches
// http://localhost:3000/api/proxy/api/... . All data is fixed.
//
// Usage from a harness: `await stubChats(page)` BEFORE page.goto, then run a
// scenario with `await s.run(page, s.vp, shot)`.

type Shot = (page: any, name: string, vp: string) => Promise<void>;
export type ChatScn = {
  name: string;
  vp: "desktop" | "mobile";
  url: string;
  app: boolean;
  run: (p: any, vp: string, shot: Shot) => Promise<void>;
};

const T = "2026-01-14T10:00:00Z";
export const EXPERT_ID = "00000000-0000-4000-8000-0000000e0001";
export const WORK_SESSION_ID = "00000000-0000-4000-8000-00000000c0a1";
const GRAPH_ID = "00000000-0000-4000-8000-0000000a0001";
const EXEC_ID = "00000000-0000-4000-8000-0000000b0001";
const USER_ID = "00000000-0000-4000-8000-0000000d0001";

const session = (id: string, title: string, minute: number, expert_id: string | null = null) => ({
  id,
  created_at: `2026-01-14T10:${String(minute).padStart(2, "0")}:00Z`,
  updated_at: `2026-01-14T10:${String(minute).padStart(2, "0")}:00Z`,
  title,
  chat_status: "idle",
  is_processing: false,
  source_platform: null,
  is_pinned: false,
  expert_id,
});

// Newest first, like the backend. Three Otto chats (group open, 1 shown +
// "Load all") and two chats with one expert (group starts collapsed).
export const SESSIONS = [
  session(WORK_SESSION_ID, "Weekly sales report", 50),
  session("00000000-0000-4000-8000-00000000c0a2", "Draft the launch email", 40),
  session("00000000-0000-4000-8000-00000000c0e1", "Research competitor pricing", 35, EXPERT_ID),
  session("00000000-0000-4000-8000-00000000c0a3", "Plan the team offsite", 30),
  session("00000000-0000-4000-8000-00000000c0e2", "Summarise customer interviews", 20, EXPERT_ID),
];

export const EXPERTS = [
  {
    id: EXPERT_ID,
    name: "Maya",
    avatar_url: null,
    color: "#7C3AED",
    role: "Research",
    job_title: "Market Researcher",
    is_archived: false,
    autopilot_mode: null,
  },
];

const RUN_TEXT =
  "**Weekly sales report** finished. Revenue is up 12% week over week; the table has the per-region numbers.";

// A user turn and an assistant run-post whose metadata makes MessageRow
// render a WorkCard (kind "expert_run" + execution_id + graph_id).
const SESSION_DETAIL = {
  id: WORK_SESSION_ID,
  created_at: T,
  updated_at: T,
  user_id: USER_ID,
  chat_status: "idle",
  messages: [
    { id: "00000000-0000-4000-8000-00000000f001", role: "user", content: "Run the weekly sales report", sequence: 0, created_at: T, metadata: null },
    {
      id: "00000000-0000-4000-8000-00000000f002",
      role: "assistant",
      content: RUN_TEXT,
      sequence: 1,
      created_at: "2026-01-14T10:01:00Z",
      metadata: {
        kind: "expert_run",
        execution_id: EXEC_ID,
        graph_id: GRAPH_ID,
        library_agent_id: null,
        graph_name: "Weekly sales report",
        status: "completed",
        output_type: "table",
        output_key: "rows",
      },
    },
  ],
  active_stream: null,
  has_more_messages: false,
  oldest_sequence: 0,
  total_prompt_tokens: 0,
  total_completion_tokens: 0,
  metadata: {},
  expert_id: null,
};

const EXECUTION = {
  id: EXEC_ID,
  graph_id: GRAPH_ID,
  graph_version: 1,
  user_id: USER_ID,
  status: "COMPLETED",
  started_at: T,
  ended_at: "2026-01-14T10:01:00Z",
  inputs: {},
  credential_inputs: {},
  nodes_input_masks: null,
  preset_id: null,
  stats: null,
  node_executions: [],
  outputs: {
    rows: [
      [
        { region: "North", revenue: 120400, change: "+14%" },
        { region: "South", revenue: 98200, change: "+9%" },
        { region: "East", revenue: 87650, change: "+12%" },
        { region: "West", revenue: 110300, change: "+11%" },
      ],
    ],
  },
};

const json = (route: any, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

export async function stubChats(page: any) {
  const P = "http://localhost:3000/api/proxy/api";
  // List (any limit/offset): a single page holding every session.
  await page.route((u: URL) => u.href.startsWith(`${P}/chat/sessions`) && u.pathname === "/api/proxy/api/chat/sessions", (route: any) =>
    route.request().method() === "GET" ? json(route, { sessions: SESSIONS, total: SESSIONS.length }) : route.fallback(),
  );
  await page.route(`${P}/experts/identities`, (route: any) => json(route, EXPERTS));
  // One session in detail; its sub-resources answered so nothing hits the
  // real backend for an id it has never seen.
  await page.route((u: URL) => u.pathname.startsWith(`/api/proxy/api/chat/sessions/${WORK_SESSION_ID}`), (route: any) => {
    const path = new URL(route.request().url()).pathname.replace(`/api/proxy/api/chat/sessions/${WORK_SESSION_ID}`, "");
    if (route.request().method() !== "GET") return json(route, {});
    if (path === "" || path === "/") return json(route, SESSION_DETAIL);
    if (path === "/stream") return route.fulfill({ status: 204, body: "" });
    if (path === "/messages/pending") return json(route, { messages: [], count: 0 });
    if (path === "/at-reset") return json(route, { jobs: [] });
    if (path.startsWith("/share")) return json(route, { is_shared: false, share_token: null });
    return json(route, {}, 404);
  });
  await page.route(`${P}/graphs/${GRAPH_ID}/executions/${EXEC_ID}`, (route: any) => json(route, EXECUTION));
}

const expand = async (p: any) => {
  await p.getByRole("button", { name: "Expand sidebar" }).first().click();
  await p.getByRole("button", { name: "Otto chats" }).first().waitFor();
  await p.mouse.move(1350, 450);
};
// Programmatic focus after a mouse move does not match :focus-visible, so step
// off and back with the keyboard to put the element in keyboard modality.
const kbFocus = async (p: any, el: any) => {
  await el.focus();
  await p.keyboard.press("Shift+Tab");
  await p.keyboard.press("Tab");
  const ok = await el.evaluate((e: Element) => e === document.activeElement && e.matches(":focus-visible"));
  if (!ok) throw new Error("kbFocus: target is not focus-visible");
};
const row = (p: any, title: string) => p.locator('[data-sidebar="menu-button"]:visible', { hasText: title }).first();

export const CHAT_SCENARIOS: ChatScn[] = [
  { name: "chats-rail", vp: "desktop", url: "/home", app: true, run: async (p, vp, shot) => {
    // Collapsed rail: ChatsNavSection shows ChatsRailItem instead of the list.
    const rail = p.locator('[data-sidebar="menu-button"]:visible', { hasText: "Chats" }).first();
    await rail.waitFor();
    await shot(p, "chats-rail-collapsed", vp);
    await rail.hover();
    await p.getByRole("tooltip").first().waitFor().catch(() => undefined);
    await shot(p, "chats-rail-hover", vp);
    await p.mouse.move(1350, 450);
    await kbFocus(p, rail);
    await shot(p, "chats-rail-focus-visible", vp);
    await p.keyboard.press("Enter");
    await p.getByRole("button", { name: "Otto chats" }).first().waitFor();
    await p.mouse.move(1350, 450);
    await shot(p, "chats-rail-jumped-to-recent", vp);
  } },
  { name: "recent-chats", vp: "desktop", url: "/home", app: true, run: async (p, vp, shot) => {
    await expand(p);
    await shot(p, "recent-chats-expanded", vp);
    const r = row(p, "Weekly sales report");
    await r.hover();
    await shot(p, "recent-chat-row-hover", vp);
    await p.mouse.move(1350, 450);
    await kbFocus(p, r);
    await shot(p, "recent-chat-row-focus-visible", vp);
    // Otto group: "Load all" reveals the other two chats.
    await p.getByRole("button", { name: "Load all Otto chats" }).click();
    await p.mouse.move(1350, 450);
    await shot(p, "otto-group-all-loaded", vp);
  } },
  { name: "expert-group", vp: "desktop", url: "/home", app: true, run: async (p, vp, shot) => {
    await expand(p);
    const trigger = p.getByRole("button", { name: "Maya chats" }).first();
    await shot(p, "expert-group-closed", vp);
    await trigger.hover();
    await shot(p, "expert-group-trigger-hover", vp);
    await p.mouse.move(1350, 450);
    await kbFocus(p, trigger);
    await shot(p, "expert-group-trigger-focus-visible", vp);
    await p.keyboard.press("Enter");
    await row(p, "Research competitor pricing").waitFor();
    await shot(p, "expert-group-open-focus-visible", vp);
    await p.keyboard.press("Space");
    await row(p, "Research competitor pricing").waitFor({ state: "hidden" });
    await shot(p, "expert-group-closed-again", vp);
  } },
  { name: "context-panel", vp: "mobile", url: `/copilot?sessionId=${WORK_SESSION_ID}`, app: true, run: async (p, vp, shot) => {
    await p.getByTestId("work-card").first().waitFor();
    await shot(p, "copilot-session-workcard", vp);
    await p.getByRole("button", { name: "Open workspace files" }).first().click();
    await p.getByRole("dialog", { name: "Files" }).waitFor();
    await shot(p, "context-panel-sheet-open", vp);
    await p.keyboard.press("Escape");
    await p.getByRole("dialog", { name: "Files" }).waitFor({ state: "hidden" });
  } },
  { name: "work-output", vp: "mobile", url: `/copilot?sessionId=${WORK_SESSION_ID}`, app: true, run: async (p, vp, shot) => {
    const card = p.getByTestId("work-card").first();
    await card.waitFor();
    await card.getByRole("button", { name: "Open" }).click();
    const sheet = p.getByRole("dialog", { name: "Weekly sales report" });
    await sheet.waitFor();
    await sheet.getByText("North").first().waitFor();
    await shot(p, "work-output-sheet-open", vp);
  } },
  { name: "work-output", vp: "desktop", url: `/copilot?sessionId=${WORK_SESSION_ID}`, app: true, run: async (p, vp, shot) => {
    const card = p.getByTestId("work-card").first();
    await card.waitFor();
    await card.getByRole("button", { name: "Open" }).click();
    const sheet = p.getByRole("dialog", { name: "Weekly sales report" });
    await sheet.waitFor();
    await sheet.getByText("North").first().waitFor();
    await shot(p, "work-output-sheet-open", vp);
  } },
];
