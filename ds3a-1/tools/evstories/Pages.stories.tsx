// Evidence only (DS3a-1), never committed: call sites a signed-in run of the app cannot reach
// (redirecting pages, a shared run, a crash, an AI run summary, transient loading UI), rendered as
// the real components with their data stubbed through MSW or passed as props.
import type { Meta, StoryObj } from "@storybook/nextjs";
import { BackendAPIProvider } from "@/lib/autogpt-server-api/context";
import { delay, http, HttpResponse } from "msw";
import { userEvent, within } from "storybook/test";
import ApiKeysPage from "@/app/(platform)/profile/(user)/api-keys/page";
import SharePage from "@/app/(no-navbar)/share/[token]/page";
import { CronScheduler } from "@/components/contextual/CronScheduler/cron-scheduler";
import AppError from "@/app/error";
import { RunSummary } from "@/app/(platform)/library/agents/[id]/components/NewAgentLibraryView/components/selected-views/SelectedRunView/components/RunSummary";
import { MainDashboardPage } from "@/app/(platform)/profile/(user)/dashboard/components/MainDashboardPage/MainDashboardPage";
import { AgentTable } from "@/app/(platform)/profile/(user)/dashboard/components/AgentTable/AgentTable";
import SettingsLoading from "@/app/(platform)/profile/(user)/settings/loading";
import { FilterSheet } from "@/app/(platform)/build/components/NewControlPanel/NewBlockMenu/FilterSheet/FilterSheet";
import { useBlockMenuStore } from "@/app/(platform)/build/stores/blockMenuStore";

const T = "2026-10-24T09:00:00Z";
const KEYS = [
  { id: "k1", user_id: "u1", name: "CI pipeline", head: "agpt_3f9", tail: "a21c", status: "ACTIVE", scopes: ["EXECUTE_GRAPH", "READ_GRAPH"], created_at: T, last_used_at: T, description: "Used by the nightly build" },
  { id: "k2", user_id: "u1", name: "Zapier", head: "agpt_7d2", tail: "90be", status: "ACTIVE", scopes: ["READ_GRAPH"], created_at: T, last_used_at: null, description: null },
];
const apiKeys = http.get("*/api/api-keys", () => HttpResponse.json(KEYS));
const shared = (kind: "ok" | "missing") =>
  http.get("*/api/public/shared/:token", () =>
    kind === "missing"
      ? HttpResponse.json({ detail: "Not found" }, { status: 404 })
      : HttpResponse.json({
          id: "exec-1", graph_name: "Morning newsletter", graph_description: "Writes a short newsletter from the day's headlines.",
          status: "COMPLETED", created_at: T,
          outputs: { newsletter: ["Good morning! Here are today's three stories worth your time."], word_count: [412] },
        }));
const SUBMISSIONS = (["APPROVED", "PENDING", "REJECTED"] as const).map((status, i) => ({
  listing_id: `l${i}`, user_id: "u1", slug: `workflow-${i}`, listing_version_id: `v${i}`, listing_version: 1,
  graph_id: `g${i}`, graph_version: 1, name: ["Morning newsletter", "Lead enricher", "Invoice chaser"][i],
  sub_heading: "Sub heading", description: "Does the thing every morning.", instructions: null, categories: ["productivity"],
  image_urls: [], video_url: null, agent_output_demo_url: null, submitted_at: new Date(T), changes_summary: null,
  status, run_count: [120, 4, 0][i], review_count: [8, 0, 0][i], review_avg_rating: [4.6, 0, 0][i],
}));
const run = (score: number) => ({ stats: { activity_status: "Summarised 14 support tickets and drafted replies for the 3 that need a human.", correctness_score: score } }) as never;

const meta: Meta = { title: "Evidence/Pages", decorators: [(Story) => <BackendAPIProvider><Story /></BackendAPIProvider>] };
export default meta;
type Story = StoryObj;

export const ProfileApiKeys: Story = { parameters: { msw: { handlers: [apiKeys] } }, render: () => <ApiKeysPage /> };
export const ProfileApiKeysCreateOpen: Story = {
  ...ProfileApiKeys,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Create Key" }));
    await within(document.body).findByText("Create New API Key");
  },
};
const shareParams = { nextjs: { appDirectory: true, navigation: { segments: [["token", "tok-123"]] } } };
export const ShareLoaded: Story = { parameters: { ...shareParams, msw: { handlers: [shared("ok")] } }, render: () => <SharePage /> };
export const ShareNotFound: Story = { parameters: { ...shareParams, msw: { handlers: [shared("missing")] } }, render: () => <SharePage /> };
export const CronDaily: Story = { render: () => <CronScheduler onCronExpressionChange={() => {}} /> };
export const CronWeekly: Story = { render: () => <CronScheduler onCronExpressionChange={() => {}} initialCronExpression="0 9 * * 1,3,5" /> };
export const CronMonthly: Story = { render: () => <CronScheduler onCronExpressionChange={() => {}} initialCronExpression="0 9 1,15 * *" /> };
export const CronCustom: Story = { render: () => <CronScheduler onCronExpressionChange={() => {}} initialCronExpression="*/15 * * * *" /> };
export const AppErrorPage: Story = { render: () => <AppError error={new globalThis.Error("boom")} reset={() => {}} /> };
export const RunSummaryHigh: Story = { render: () => <RunSummary run={run(0.92)} /> };
export const RunSummaryMid: Story = { render: () => <RunSummary run={run(0.65)} /> };
export const RunSummaryLow: Story = { render: () => <RunSummary run={run(0.31)} /> };
export const RunSummaryIconHover: Story = {
  render: () => <RunSummary run={run(0.65)} />,
  play: async ({ canvasElement }) => {
    const icon = canvasElement.querySelector('svg[aria-label="Icon"]');
    if (icon) await userEvent.hover(icon as Element);
  },
};
export const DashboardPage: Story = { render: () => <MainDashboardPage /> };
export const DashboardAgentTable: Story = {
  render: () => <AgentTable storeAgentSubmissions={SUBMISSIONS as never} onViewSubmission={() => {}} onDeleteSubmission={() => {}} onEditSubmission={() => {}} />,
};
export const DashboardAgentMenuHover: Story = {
  ...DashboardAgentTable,
  play: async ({ canvasElement }) => {
    const more = canvasElement.querySelector("button[aria-haspopup], [data-testid*=more], button:has(svg)");
    if (more) await userEvent.hover(more as Element);
  },
};
export const SettingsLoadingSkeleton: Story = { render: () => <SettingsLoading /> };
const CATEGORIES = [
  { key: "blocks", name: "Blocks" }, { key: "integrations", name: "Integrations" },
  { key: "marketplace_agents", name: "Marketplace workflows" }, { key: "my_agents", name: "My workflows" },
] as never;
export const BlockMenuFilterSheet: Story = {
  loaders: [() => { useBlockMenuStore.setState({ creators_list: ["autogpt", "alice", "bob"], creators: [], filters: [] } as never); return {}; }],
  render: () => <div className="relative h-[620px] w-[740px] rounded-xl border"><FilterSheet categories={CATEGORIES} /></div>,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByText("All filters"));
    await within(canvasElement).findByText("Filters");
    await delay(800);
  },
};
