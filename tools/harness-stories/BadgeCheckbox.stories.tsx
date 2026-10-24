// TEMPORARY evidence harness for the DS3a-2 Badge/Checkbox swap. Never commit.
// Renders only the real importer components so the same file builds in the
// pre-refactor checkout too.
import type { Meta, StoryObj } from "@storybook/nextjs";
import { http, HttpResponse } from "msw";
import { NuqsAdapter } from "nuqs/adapters/react";
import { useState } from "react";

import { NodeBadges } from "@/app/(platform)/build/components/FlowEditor/nodes/CustomNode/components/NodeBadges";
import { NodeExecutionBadge } from "@/app/(platform)/build/components/FlowEditor/nodes/CustomNode/components/NodeExecutionBadge";
import { useNodeStore } from "@/app/(platform)/build/stores/nodeStore";
import { useBlockMenuStore } from "@/app/(platform)/build/stores/blockMenuStore";
import { APIKeysSection } from "@/app/(platform)/profile/(user)/api-keys/components/APIKeySection/APIKeySection";
import { APIKeysModals } from "@/app/(platform)/profile/(user)/api-keys/components/APIKeysModals/APIKeysModals";
import { ExpandableRow } from "@/app/(platform)/admin/marketplace/components/ExpandleRow";
import { MCPToolDialog } from "@/app/(platform)/build/components/MCPToolDialog";
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from "@/components/__legacy__/ui/multiselect";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/__legacy__/ui/table";
import { ExecutionAnalyticsForm } from "@/app/(platform)/admin/execution-analytics/components/ExecutionAnalyticsForm";
import { AccountChecklist } from "@/app/(platform)/admin/users/components/AccessDialogs/AccountChecklist";
import { AlsoBlockList } from "@/app/(platform)/admin/users/components/AccessDialogs/BanAllDialog/AlsoBlockList";
import { BlockDomainDialog } from "@/app/(platform)/admin/users/components/AccessDialogs/BlockDomainDialog/BlockDomainDialog";
import { SchedulesTable } from "@/app/(platform)/admin/diagnostics/components/SchedulesTable";
import { ExecutionsTable } from "@/app/(platform)/admin/diagnostics/components/ExecutionsTable";
import { FilterSheet } from "@/app/(platform)/build/components/NewControlPanel/NewBlockMenu/FilterSheet/FilterSheet";

const FIXED = "2026-01-15T12:00:00Z";

const meta: Meta = {
  title: "DS3aEvidence/BadgeCheckbox",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

// ---------------------------------------------------------------- Badge ---

export const NodeBadgesCategories: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <NodeBadges
        categories={[
          { category: "AI", description: "AI blocks" },
          { category: "TEXT", description: "Text blocks" },
          { category: "DEVELOPER_TOOLS", description: "Dev tools" },
        ]}
      />
    </div>
  ),
};

function nodeWithStatus(status: string) {
  return () => {
    useNodeStore.setState({
      nodes: [
        {
          id: "node-1",
          type: "custom",
          position: { x: 0, y: 0 },
          data: { status },
        } as any,
      ],
    });
  };
}

function ExecutionBadgeFrame() {
  return (
    <div className="w-[320px] rounded-xl border border-slate-300 bg-white">
      <div className="p-4 text-sm">Node body</div>
      <NodeExecutionBadge nodeId="node-1" />
    </div>
  );
}

export const NodeExecutionBadgeIncomplete: Story = {
  beforeEach: nodeWithStatus("INCOMPLETE"),
  render: () => <ExecutionBadgeFrame />,
};
export const NodeExecutionBadgeQueued: Story = {
  beforeEach: nodeWithStatus("QUEUED"),
  render: () => <ExecutionBadgeFrame />,
};
export const NodeExecutionBadgeRunning: Story = {
  beforeEach: nodeWithStatus("RUNNING"),
  render: () => <ExecutionBadgeFrame />,
};
export const NodeExecutionBadgeReview: Story = {
  beforeEach: nodeWithStatus("REVIEW"),
  render: () => <ExecutionBadgeFrame />,
};
export const NodeExecutionBadgeCompleted: Story = {
  beforeEach: nodeWithStatus("COMPLETED"),
  render: () => <ExecutionBadgeFrame />,
};
export const NodeExecutionBadgeTerminated: Story = {
  beforeEach: nodeWithStatus("TERMINATED"),
  render: () => <ExecutionBadgeFrame />,
};
export const NodeExecutionBadgeFailed: Story = {
  beforeEach: nodeWithStatus("FAILED"),
  render: () => <ExecutionBadgeFrame />,
};

const API_KEYS = [
  {
    id: "key-1",
    user_id: "user-1",
    name: "Production key",
    head: "agpt_ab1",
    tail: "9f8e7d6c",
    status: "ACTIVE",
    scopes: ["EXECUTE_GRAPH", "READ_GRAPH"],
    created_at: FIXED,
    last_used_at: "2026-02-01T09:30:00Z",
    description: "Prod",
  },
  {
    id: "key-2",
    user_id: "user-1",
    name: "CI key",
    head: "agpt_cd2",
    tail: "1a2b3c4d",
    status: "ACTIVE",
    scopes: ["READ_BLOCK"],
    created_at: FIXED,
    last_used_at: null,
    description: null,
  },
  {
    id: "key-3",
    user_id: "user-1",
    name: "Old key (revoked, filtered out by the hook)",
    head: "agpt_ef3",
    tail: "00000000",
    status: "REVOKED",
    scopes: [],
    created_at: FIXED,
    last_used_at: null,
    description: null,
  },
];

export const APIKeysSectionActive: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("*/api/api-keys", () => HttpResponse.json(API_KEYS)),
      ],
    },
  },
  render: () => (
    <div className="w-[900px]">
      <APIKeysSection />
    </div>
  ),
};

function version(
  n: number,
  status: string,
  extra: Record<string, unknown> = {},
): any {
  return {
    listing_id: "listing-1",
    user_id: "creator-1",
    slug: "weather-reporter",
    listing_version_id: `lv-${n}`,
    listing_version: n,
    graph_id: "graph-1",
    graph_version: n,
    name: "Weather Reporter",
    sub_heading: `Daily weather summary v${n}`,
    description: "Fetches the forecast and writes a summary.",
    instructions: null,
    categories: n % 2 ? ["productivity"] : [],
    image_urls: [],
    video_url: null,
    agent_output_demo_url: null,
    submitted_at: FIXED,
    changes_summary: `Changes in v${n}`,
    status,
    reviewed_at: null,
    review_comments: null,
    internal_comments: null,
    ...extra,
  };
}

const LISTING: any = {
  listing_id: "listing-1",
  graph_id: "graph-1",
  slug: "weather-reporter",
  active_listing_version_id: "lv-3",
  has_approved_version: true,
  creator_email: "creator@example.com",
  versions: [
    version(4, "PENDING"),
    version(3, "APPROVED", {
      reviewed_at: FIXED,
      review_comments: "Looks good",
      internal_comments: "Checked by ops",
    }),
    version(2, "REJECTED", {
      reviewed_at: FIXED,
      review_comments: "Missing description",
    }),
    version(1, "DRAFT", { submitted_at: null }),
  ],
};

export const AdminMarketplaceExpandableRow: Story = {
  render: () => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Creator</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <ExpandableRow listing={LISTING} latestVersion={LISTING.versions[0]} />
        </TableBody>
      </Table>
    </div>
  ),
};

const MCP_TOOLS = {
  server_name: "Example MCP",
  protocol_version: "2025-03-26",
  tools: [
    {
      name: "search_documents",
      description:
        "Search the document index with filters for author, tags, dates, and paging. Returns matching documents ranked by relevance with highlighted snippets.",
      input_schema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search text" },
          author: { type: "string" },
          tags: { type: "array" },
          after: { type: "string" },
          before: { type: "string" },
          limit: { type: "integer" },
          offset: { type: "integer" },
          sort: { anyOf: [{ type: "string" }, { type: "null" }] },
        },
        required: ["query"],
      },
    },
    {
      name: "send_message",
      description: "Send a message to a channel.",
      input_schema: {
        type: "object",
        properties: {
          channel: { type: "string", description: "Channel id" },
          text: { type: "string", description: "Message body" },
        },
        required: ["channel", "text"],
      },
    },
    {
      name: "ping",
      description: "Check that the server is alive.",
      input_schema: { type: "object", properties: {} },
    },
  ],
};

function MCPToolDialogHarness() {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button
        type="button"
        className="rounded border px-3 py-1 text-sm"
        onClick={() => setOpen(true)}
      >
        Open MCP dialog
      </button>
      <MCPToolDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
      />
    </div>
  );
}

export const MCPToolDialogTools: Story = {
  parameters: {
    msw: {
      handlers: [
        http.post("*/api/mcp/discover-tools", () =>
          HttpResponse.json(MCP_TOOLS),
        ),
      ],
    },
  },
  render: () => <MCPToolDialogHarness />,
};

const MULTI_OPTIONS = ["Email", "Slack", "Discord", "Teams", "SMS"];

function MultiSelectHarness() {
  const [values, setValues] = useState<string[]>(["Email", "Slack", "Discord"]);
  return (
    <div className="flex w-[420px] flex-col">
      <MultiSelector
        className="nodrag"
        values={values}
        onValuesChange={setValues}
      >
        <MultiSelectorTrigger className="rounded-3xl border border-border-base bg-surface px-2 shadow-none">
          <MultiSelectorInput placeholder="Select channels..." />
        </MultiSelectorTrigger>
        <MultiSelectorContent className="nowheel">
          <MultiSelectorList>
            {MULTI_OPTIONS.map((option) => (
              <MultiSelectorItem key={option} value={option}>
                {option}
              </MultiSelectorItem>
            ))}
          </MultiSelectorList>
        </MultiSelectorContent>
      </MultiSelector>
    </div>
  );
}

export const MultiSelectorChips: Story = {
  render: () => <MultiSelectHarness />,
};

// ------------------------------------------------------------- Checkbox ---

const ANALYTICS_CONFIG = {
  available_models: [
    { value: "gpt-4o-mini", label: "GPT-4o mini", provider: "openai" },
    { value: "gpt-4o", label: "GPT-4o", provider: "openai" },
  ],
  default_system_prompt: "You are an execution analyst.",
  default_user_prompt: "Summarise this execution.",
  recommended_model: "gpt-4o-mini",
};

export const ExecutionAnalyticsFormCheckboxes: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("*/api/executions/admin/execution_analytics/config", () =>
          HttpResponse.json(ANALYTICS_CONFIG),
        ),
      ],
    },
  },
  render: () => (
    <div className="w-[900px]">
      <ExecutionAnalyticsForm />
    </div>
  ),
};

const CHECKLIST_ACCOUNTS = [
  {
    id: "acc-1",
    email: "alice@example.com",
    name: "Alice",
    banned: false,
    badges: ["same IP"],
  },
  {
    id: "acc-2",
    email: "bob@example.com",
    name: "Bob",
    banned: false,
    badges: ["same IP", "same domain"],
  },
  {
    id: "acc-3",
    email: "carol@example.com",
    name: "",
    banned: false,
    badges: [],
  },
  {
    id: "acc-4",
    email: "dave@example.com",
    name: "Dave",
    banned: true,
    badges: ["same IP"],
  },
];

function AccountChecklistHarness() {
  const [ticked, setTicked] = useState<Set<string>>(
    new Set(["acc-1", "acc-2"]),
  );
  return (
    <div className="w-[560px]">
      <AccountChecklist
        accounts={CHECKLIST_ACCOUNTS}
        ticked={ticked}
        onToggle={(id) =>
          setTicked((current) => {
            const next = new Set(current);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
          })
        }
        results={
          new Map([
            ["acc-1", { userId: "acc-1", ok: true }],
            ["acc-2", { userId: "acc-2", ok: false, error: "timeout" }],
          ])
        }
        maxHeightClassName="max-h-[300px]"
      />
    </div>
  );
}

export const AccountChecklistStates: Story = {
  render: () => <AccountChecklistHarness />,
};

const ALSO_BLOCK_OPTIONS: any[] = [
  {
    key: "IP:203.0.113.5",
    kind: "IP",
    value: "203.0.113.5",
    label: "203.0.113.5",
    detail: "3 sign-ins",
    isDisabled: false,
  },
  {
    key: "IP:198.51.100.7",
    kind: "IP",
    value: "198.51.100.7",
    label: "198.51.100.7",
    detail: "1 sign-in",
    isDisabled: false,
  },
  {
    key: "IP:192.0.2.9",
    kind: "IP",
    value: "192.0.2.9",
    label: "192.0.2.9",
    detail: "already done",
    isDisabled: false,
  },
  {
    key: "EMAIL_DOMAIN:gmail.com",
    kind: "EMAIL_DOMAIN",
    value: "gmail.com",
    label: "gmail.com",
    detail: "4 accounts",
    isDisabled: true,
    disabledReason: "public email provider",
  },
];

function AlsoBlockListHarness() {
  const [ticked, setTicked] = useState<Set<string>>(
    new Set(["IP:203.0.113.5"]),
  );
  return (
    <div className="w-[560px]">
      <AlsoBlockList
        options={ALSO_BLOCK_OPTIONS}
        ticked={ticked}
        done={new Set(["IP:192.0.2.9"])}
        onToggle={(key) =>
          setTicked((current) => {
            const next = new Set(current);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
          })
        }
        alreadyBlockedDomain="spam.example"
        ownIP="203.0.113.5"
      />
    </div>
  );
}

export const AlsoBlockListStates: Story = {
  render: () => <AlsoBlockListHarness />,
};

function related(id: string, email: string, name: string, banned = false) {
  return {
    id,
    email,
    name,
    role: null,
    created_at: FIXED,
    banned,
    ban_expires: null,
    has_profile: true,
    via_ips: [],
    via_domain: true,
    plan: null,
    payment_status: "no_subscription",
  };
}

const DOMAIN_REPORT: any = {
  retention_days: 90,
  ips: [],
  domain: {
    value: "example.com",
    is_public_provider: false,
    other_account_count: 3,
    block: null,
  },
  related: [
    related("u-1", "alice@example.com", "Alice"),
    related("u-2", "bob@example.com", "Bob"),
    related("u-3", "carol@example.com", "Carol", true),
  ],
  related_total: 3,
};

export const BlockDomainDialogOpen: Story = {
  render: () => (
    <NuqsAdapter>
      <BlockDomainDialog
        report={DOMAIN_REPORT}
        signedInUserId="admin-1"
        showTrigger
      />
    </NuqsAdapter>
  ),
};

const SCHEDULES = {
  schedules: [
    {
      schedule_id: "sched-1",
      schedule_name: "Morning digest",
      graph_id: "graph-1",
      graph_name: "Digest",
      graph_version: 2,
      user_id: "user-aaaaaaaa-1111",
      user_email: "alice@example.com",
      cron: "0 8 * * *",
      timezone: "UTC",
      next_run_time: FIXED,
    },
    {
      schedule_id: "sched-2",
      schedule_name: "Weekly report",
      graph_id: "graph-2",
      graph_name: "Report",
      graph_version: 5,
      user_id: "user-bbbbbbbb-2222",
      user_email: null,
      cron: "0 9 * * 1",
      timezone: "Europe/London",
      next_run_time: FIXED,
    },
    {
      schedule_id: "sched-3",
      schedule_name: "Hourly sync",
      graph_id: "graph-3",
      graph_name: "Sync",
      graph_version: 1,
      user_id: "user-cccccccc-3333",
      user_email: "carol@example.com",
      cron: "0 * * * *",
      timezone: "UTC",
      next_run_time: FIXED,
    },
  ],
  total: 3,
};

export const DiagnosticsSchedulesTable: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("*/api/admin/diagnostics/schedules/all", () =>
          HttpResponse.json(SCHEDULES),
        ),
        http.get("*/api/admin/diagnostics/schedules/orphaned", () =>
          HttpResponse.json({ schedules: [], total: 0 }),
        ),
      ],
    },
  },
  render: () => (
    <div className="w-[1100px]">
      <SchedulesTable diagnosticsData={{ total_orphaned: 0, user_schedules: 3 }} />
    </div>
  ),
};

function execution(n: number, status: string) {
  return {
    execution_id: `exec-${n}${n}${n}${n}${n}${n}${n}${n}-abcd`,
    graph_id: `graph-${n}`,
    graph_name: `Workflow ${n}`,
    graph_version: n,
    user_id: `user-${n}${n}${n}${n}${n}${n}${n}${n}-efgh`,
    user_email: `user${n}@example.com`,
    status,
    created_at: FIXED,
    started_at: null,
    queue_status: null,
  };
}

const EXECUTIONS = {
  executions: [
    execution(1, "RUNNING"),
    execution(2, "QUEUED"),
    execution(3, "RUNNING"),
  ],
  total: 3,
};

const DIAG = {
  orphaned_running: 1,
  orphaned_queued: 0,
  failed_count_24h: 0,
  stuck_running_24h: 0,
  stuck_queued_1h: 0,
  invalid_queued_with_start: 1,
  invalid_running_without_start: 1,
};

const executionHandlers = [
  http.get("*/api/admin/diagnostics/executions/running", () =>
    HttpResponse.json(EXECUTIONS),
  ),
  http.get("*/api/admin/diagnostics/executions/invalid", () =>
    HttpResponse.json(EXECUTIONS),
  ),
];

export const DiagnosticsExecutionsTable: Story = {
  parameters: { msw: { handlers: executionHandlers } },
  render: () => (
    <div className="w-[1200px]">
      <ExecutionsTable diagnosticsData={DIAG} />
    </div>
  ),
};

export const DiagnosticsExecutionsTableInvalidDisabled: Story = {
  parameters: { msw: { handlers: executionHandlers } },
  render: () => (
    <div className="w-[1200px]">
      <ExecutionsTable initialTab="invalid" diagnosticsData={DIAG} />
    </div>
  ),
};

export const BlockMenuFilterSheet: Story = {
  beforeEach: () => {
    useBlockMenuStore.setState({
      filters: ["blocks", "my_agents"],
      creators: ["alice"],
      creators_list: ["alice", "bob", "carol"],
    } as any);
  },
  render: () => (
    <div className="relative h-[640px] w-[420px] overflow-hidden rounded-xl border bg-zinc-50 p-3">
      <FilterSheet
        categories={[
          { key: "blocks", name: "Blocks" },
          { key: "integrations", name: "Integrations" },
          { key: "marketplace_agents", name: "Marketplace workflows" },
          { key: "my_agents", name: "My workflows" },
        ]}
      />
    </div>
  ),
};

export const APIKeysCreateDialog: Story = {
  render: () => (
    <div className="w-[600px]">
      <APIKeysModals />
    </div>
  ),
};
