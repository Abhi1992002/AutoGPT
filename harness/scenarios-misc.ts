// Extra interaction scenarios for components the seeded screens user never
// reaches: the sidebar wallet + its "Earn credits" collapsible, the regular
// /copilot EmptyHero, and the expert side panel on /team/<id>.
// Everything is runtime-only (page.route stubs + localStorage), no app code.
//
// The browser reaches the backend through the Next proxy
// (http://localhost:3000/api/proxy/api/...), not :8006 directly; every stub
// below matches both forms.
//
// Usage: import { stubMisc, MISC_SCENARIOS } from "./scenarios-misc";
//   call stubMisc(page, s.stub) BEFORE page.goto, then s.run(page, vp, shot).

type Shot = (page: any, name: string, vp: string) => Promise<void>;
export type MiscScn = {
  name: string;
  vp: "desktop" | "mobile";
  url: string;
  app: boolean;
  stub: "wallet" | "hero" | "expert";
  run: (p: any, vp: string, shot: Shot) => Promise<void>;
};

const TS = "2026-01-14T10:00:00Z";
export const MISC_EXPERT_ID = "11111111-2222-4333-8444-555555555555";

function api(path: string) {
  // path is a regex fragment after `/api/`, e.g. "credits" or "experts/[^/?]+"
  return new RegExp(`^http://localhost:(?:3000/api/proxy|8006)/api/${path}(?:\\?.*)?$`);
}
function json(route: any, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

// ---------- wallet ----------
const ONBOARDING = {
  userId: "00000000-0000-4000-8000-000000000001",
  wizardProgress: null,
  wizardRevision: 0,
  // One done row per group mix: shows "Done", pending rows and a fully done group.
  completedSteps: ["BUILD_TAB_INTRO", "AGENTS_TAB_INTRO", "MARKETPLACE_TAB_INTRO", "ONBOARDING_COMPLETE", "MARKETPLACE_ADD_AGENT", "SCHEDULE_AGENT"],
  walletShown: true,
  notified: [],
  rewardedFor: ["ONBOARDING_COMPLETE", "MARKETPLACE_ADD_AGENT", "SCHEDULE_AGENT"],
  usageReason: null,
  integrations: [],
  otherIntegrations: null,
  selectedStoreListingVersionId: null,
  agentInput: null,
  onboardingAgentExecutionId: null,
  agentRuns: 12,
  lastRunAt: TS,
  consecutiveRunDays: 2,
};
const CHAT_USAGE = {
  daily: { percent_used: 25.0, resets_at: "2026-01-16T00:00:00Z" },
  weekly: { percent_used: 40.0, resets_at: "2026-01-19T00:00:00Z" },
  tier: "PRO",
  reset_cost: 500,
  state: "ok",
  limiting_window: null,
  resets_at: null,
};

async function stubWallet(page: any) {
  // NEXT_PUBLIC_PW_TEST builds ignore /api/feature-flags and serve the
  // defaults (enable-platform-payment=false); the PW override map in
  // localStorage (pw-flag-overrides.ts) is the runtime switch.
  await page.addInitScript(() => {
    window.localStorage.setItem("autogpt-pw-flag-overrides", JSON.stringify({ "enable-platform-payment": true }));
  });
  await page.route(api("credits"), (r: any) => (r.request().method() === "GET" ? json(r, { credits: 1250 }) : r.continue()));
  await page.route(api("chat/usage"), (r: any) => json(r, CHAT_USAGE));
  // GET returns the fixed state; PATCH (opening the wallet sets walletShown)
  // is answered locally so the run never writes to the real account.
  await page.route(api("onboarding"), (r: any) => json(r, ONBOARDING));
  await page.route(api("credits/auto-top-up"), (r: any) => json(r, { amount: 0, threshold: 0 }));
}

// ---------- hero ----------
async function stubHero(page: any) {
  // greeting_done=true is the server's "already seen" answer: the intro card
  // and the greeting loader both drop and EmptySession renders EmptyHero.
  await page.route(api("onboarding/brain-dump/intro"), (r: any) =>
    json(r, { path: "B", greeting: "", prompts: [], greeting_done: true, greeting_pending: false, transcript: null, team: null, team_pending: false }),
  );
}

// ---------- expert ----------
export const MISC_EXPERT = {
  id: MISC_EXPERT_ID,
  name: "Maria",
  avatar_url: null,
  color: "violet",
  role: "Marketing Strategist",
  job_title: "Marketing Manager",
  tagline: "Grows your brand while you sleep",
  bio: "Maria is a senior marketing strategist.",
  skills: ["Content strategy", "Competitor research"],
  categories: ["marketing"],
  identity: "You are Maria, a senior marketing strategist.",
  voice_preferences: "Warm, concise, and direct.",
  voice_samples: [],
  day_one: [],
  boundaries: "Never invent customer evidence.",
  protected_soul_rules: [
    "The expert discloses that it is AI when acting externally.",
    "The expert asks for approval before acting externally.",
  ],
  is_template: false,
  source_template_id: null,
  is_archived: false,
  workflows: [],
  credential_count: 0,
  credential_providers: [],
  last_run_at: TS,
  last_run_status: "COMPLETED",
  weekly_budget: null,
  weekly_spend: 0,
  schedules_paused_at: null,
  learning_paused_at: null,
  autopilot_mode: undefined,
  pod_id: null,
  setup_status: undefined,
  setup_failures: [],
};
const ACTIVITY = {
  timezone: "UTC",
  days: Array.from({ length: 7 }, (_, i) => ({ day: `2026-01-${String(8 + i).padStart(2, "0")}`, sessions: i % 3, runs: (i * 2) % 5 })),
};

async function stubExpert(page: any) {
  const id = MISC_EXPERT_ID;
  // Registered first = matched last: a catch-all for the expert's other GET
  // sub-resources so no section asks the backend about an id it never saw.
  await page.route(api(`experts/${id}/.+`), (r: any) => {
    if (r.request().method() !== "GET") return json(r, {});
    const u = new URL(r.request().url());
    const sub = u.pathname.split(`/experts/${id}/`)[1];
    if (sub === "runs") return json(r, { runs: [], total: 0 });
    if (sub === "credentials") return json(r, []);
    if (sub === "onboarding") return json(r, { items: [] });
    return json(r, {});
  });
  await page.route(api(`experts/${id}`), (r: any) => json(r, MISC_EXPERT));
  await page.route(api(`experts/${id}/activity`), (r: any) => json(r, ACTIVITY));
  await page.route(api(`memory/experts/${id}/facts`), (r: any) => json(r, { expert_id: id, items: [] }));
  await page.route(api("experts"), (r: any) => (r.request().method() === "GET" ? json(r, [MISC_EXPERT]) : r.continue()));
}

export async function stubMisc(page: any, which: "wallet" | "hero" | "expert") {
  // The "What's new" popup reveals itself 1.5s after /api/changelog (a Next
  // route, fetched from agpt.co) answers, so it can land on top of any shot.
  // An empty answer keeps it from ever mounting; none of the targets need it.
  await page.route(/^http:\/\/localhost:3000\/api\/changelog(?:\?.*)?$/, (r: any) => r.fulfill({ status: 200, contentType: "text/markdown", body: "" }));
  if (which === "wallet") return stubWallet(page);
  if (which === "hero") return stubHero(page);
  return stubExpert(page);
}

const walletTrigger = (p: any) => p.getByRole("button", { name: /Automation credits|Usage and credits/ }).first();
export const walletPanel = (p: any) => p.getByRole("dialog", { name: "Usage and credits" }).first();
const earnTrigger = (p: any) => walletPanel(p).getByRole("button", { name: /Earn credits/ }).first();

export async function openWallet(p: any, vp: string) {
  if (vp === "desktop") {
    // The trigger lives in the sidebar footer and is hidden while it is collapsed.
    // The collapsed rail only shows "Expand sidebar" while the logo is hovered.
    await p.mouse.move(24, 24);
    const expand = p.getByRole("button", { name: "Expand sidebar" }).first();
    await expand.waitFor({ state: "visible", timeout: 15000 });
    await expand.click();
    // Let the expand transition finish first: a click mid-transition opens
    // the popover and the re-layout dismisses it straight away.
    await walletTrigger(p).waitFor({ state: "visible", timeout: 20000 });
    await p.waitForTimeout(800);
  } else {
    await p.getByRole("button", { name: "Toggle Sidebar" }).first().click();
    await p.getByRole("dialog").first().waitFor();
  }
  await walletTrigger(p).waitFor({ state: "visible", timeout: 20000 });
  await walletTrigger(p).click();
  await walletPanel(p).waitFor({ state: "visible" });
  await p.waitForTimeout(500);
  if (!(await walletPanel(p).isVisible())) { await walletTrigger(p).click(); await walletPanel(p).waitFor({ state: "visible" }); }
}

export const MISC_SCENARIOS: MiscScn[] = [
  { name: "wallet", vp: "desktop", url: "/home", app: true, stub: "wallet", run: async (p, vp, shot) => {
    await openWallet(p, vp);
    await shot(p, "wallet-panel-earn-open", vp);
    await earnTrigger(p).hover();
    await shot(p, "wallet-earn-trigger-hover", vp);
    await earnTrigger(p).click();
    await p.mouse.move(5, 5);
    await shot(p, "wallet-panel-earn-closed", vp);
    // Keyboard focus: focus() on a button after a pointer click does not
    // match :focus-visible, so reach it with Shift+Tab / Tab from a neighbour.
    await earnTrigger(p).focus();
    await p.keyboard.press("Shift+Tab");
    await p.keyboard.press("Tab");
    await shot(p, "wallet-earn-trigger-focus-visible", vp);
    await p.keyboard.press("Enter");
    await shot(p, "wallet-earn-reopened-keyboard", vp);
  } },
  { name: "wallet", vp: "mobile", url: "/home", app: true, stub: "wallet", run: async (p, vp, shot) => {
    await openWallet(p, vp);
    await shot(p, "wallet-panel-earn-open", vp);
    await earnTrigger(p).click();
    await shot(p, "wallet-panel-earn-closed", vp);
  } },
  { name: "hero", vp: "desktop", url: "/copilot", app: true, stub: "hero", run: async (p, vp, shot) => {
    await p.getByRole("heading", { name: /^Hey,/ }).or(p.getByText(/^Hey,/)).first().waitFor({ timeout: 20000 });
    await shot(p, "copilot-empty-hero", vp);
  } },
  { name: "hero", vp: "mobile", url: "/copilot", app: true, stub: "hero", run: async (p, vp, shot) => {
    await p.getByText(/^Hey,/).first().waitFor({ timeout: 20000 });
    await shot(p, "copilot-empty-hero", vp);
  } },
  { name: "expert", vp: "desktop", url: `/team/${MISC_EXPERT_ID}`, app: true, stub: "expert", run: async (p, vp, shot) => {
    // usePanelSidebarCollapse only shows when the app sidebar starts open:
    // opening the panel collapses it, closing the panel restores it.
    await p.mouse.move(24, 24);
    await p.getByRole("button", { name: "Expand sidebar" }).first().click();
    await p.waitForTimeout(600);
    await p.mouse.move(1350, 450);
    await shot(p, "expert-sidebar-expanded-panel-closed", vp);
    await p.getByRole("button", { name: "Edit Soul" }).first().click();
    await p.locator('aside[data-expert-panel="soul"]').waitFor({ state: "visible" });
    await p.mouse.move(5, 5);
    await shot(p, "expert-soul-panel-open", vp);
    await p.getByRole("button", { name: "Close Soul panel" }).first().click();
    await p.locator('aside[data-expert-panel="soul"]').waitFor({ state: "detached" });
    await p.mouse.move(1350, 450);
    await shot(p, "expert-soul-panel-closed-sidebar-restored", vp);
  } },
  { name: "expert", vp: "mobile", url: `/team/${MISC_EXPERT_ID}`, app: true, stub: "expert", run: async (p, vp, shot) => {
    await p.getByRole("button", { name: "Edit Soul" }).first().click();
    await p.getByRole("dialog", { name: "Maria's Soul" }).first().waitFor({ state: "visible" });
    await shot(p, "expert-soul-panel-open", vp);
  } },
];
