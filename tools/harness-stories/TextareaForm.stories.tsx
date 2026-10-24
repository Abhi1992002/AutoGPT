/* TEMPORARY evidence harness for the DS3a-2 Textarea/Form swap. Not for commit.
 * Imports only the real importer components so the same file renders in the
 * old and new checkouts. */
import type { Meta, StoryObj } from "@storybook/nextjs";
import { delay, http, HttpResponse } from "msw";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { useState } from "react";

import { TooltipProvider } from "@/components/atoms/Tooltip/BaseTooltip";
import { CredentialsProvidersContext } from "@/providers/agent-credentials/credentials-provider";

import { ApproveRejectButtons } from "@/app/(platform)/admin/marketplace/components/ApproveRejectButton";
import { AdminAddMoneyButton } from "@/app/(platform)/admin/spending/components/AddMoneyButton";
import { ExecutionAnalyticsForm } from "@/app/(platform)/admin/execution-analytics/components/ExecutionAnalyticsForm";
import { RefundModal } from "@/app/(platform)/profile/(user)/credits/RefundModal";
import { EmailForm } from "@/app/(platform)/profile/(user)/settings/components/SettingsForm/components/EmailForm/EmailForm";
import { NotificationForm } from "@/app/(platform)/profile/(user)/settings/components/SettingsForm/components/NotificationForm/NotificationForm";
import { TimezoneForm } from "@/app/(platform)/profile/(user)/settings/components/SettingsForm/components/TimezoneForm/TimezoneForm";
import { APIKeyCredentialsModal } from "@/components/contextual/CredentialsInput/components/APIKeyCredentialsModal/APIKeyCredentialsModal";
import { PasswordCredentialsModal } from "@/components/contextual/CredentialsInput/components/PasswordCredentialsModal/PasswordCredentialsModal";
import { HostScopedCredentialsModal } from "@/components/contextual/CredentialsInput/components/HotScopedCredentialsModal/HotScopedCredentialsModal";
import { CredentialTypeSelector } from "@/components/contextual/CredentialsInput/components/CredentialTypeSelector/CredentialTypeSelector";
import { EditAgentForm } from "@/components/contextual/EditAgentModal/components/EditAgentForm";
import { AgentInfoStep } from "@/components/contextual/PublishAgentModal/components/AgentInfoStep/AgentInfoStep";
import { WalletRefill } from "@/components/layout/Navbar/components/Wallet/components/WalletRefill";
import { NewSaveControl } from "@/app/(platform)/build/components/NewControlPanel/NewSaveControl/NewSaveControl";

/* ------------------------------------------------------------------ */
/* Fixed fixtures                                                      */
/* ------------------------------------------------------------------ */

const USER: any = {
  id: "user-1",
  email: "ada@example.com",
  email_verified: true,
  role: "user",
  created_at: "2025-01-01T00:00:00.000Z",
  user_metadata: { name: "Ada Lovelace" },
};

const SUBMISSION_PENDING: any = {
  listing_id: "listing-1",
  user_id: "user-1",
  slug: "lead-finder",
  listing_version_id: "lv-1",
  listing_version: 1,
  graph_id: "graph-1",
  graph_version: 3,
  name: "Lead Finder",
  sub_heading: "Find decision-makers at any company",
  description: "Finds people.",
  instructions: null,
  categories: ["productivity"],
  image_urls: [],
  video_url: null,
  agent_output_demo_url: null,
  submitted_at: new Date("2025-01-02T10:00:00.000Z"),
  changes_summary: null,
  status: "PENDING",
  internal_comments: null,
};

const TRANSACTIONS: any[] = [
  {
    transaction_key: "tx-1",
    transaction_time: new Date("2025-01-05T09:30:00.000Z"),
    transaction_type: "TOP_UP",
    amount: 2000,
    running_balance: 2000,
    current_balance: 2000,
    description: "Top up",
    usage_graph_id: "",
    usage_execution_id: "",
    usage_node_count: 0,
    usage_starting_time: new Date("2025-01-05T09:30:00.000Z"),
    user_id: "user-1",
    user_email: "ada@example.com",
    reason: null,
  },
  {
    transaction_key: "tx-2",
    transaction_time: new Date("2025-01-07T14:15:00.000Z"),
    transaction_type: "TOP_UP",
    amount: 5000,
    running_balance: 7000,
    current_balance: 7000,
    description: "Top up",
    usage_graph_id: "",
    usage_execution_id: "",
    usage_node_count: 0,
    usage_starting_time: new Date("2025-01-07T14:15:00.000Z"),
    user_id: "user-1",
    user_email: "ada@example.com",
    reason: null,
  },
];

const ANALYTICS_CONFIG = {
  available_models: [
    { value: "gpt-4o-mini", label: "GPT-4o mini", provider: "openai" },
    { value: "gpt-4o", label: "GPT-4o", provider: "openai" },
  ],
  default_system_prompt:
    "You are an evaluator. Decide whether the execution succeeded.",
  default_user_prompt:
    "Workflow: {{GRAPH_NAME}}\nData: {{EXECUTION_DATA}}\nGive a score.",
  recommended_model: "gpt-4o-mini",
};

const STORE_CATEGORIES = [
  { value: "productivity", label: "Productivity", description: "" },
  { value: "marketing", label: "Marketing", description: "" },
  { value: "research", label: "Research", description: "" },
];

const EDIT_SUBMISSION: any = {
  name: "Lead Finder",
  sub_heading: "Find decision-makers at any company",
  description: "Finds the right people at a company and drafts an intro.",
  image_urls: ["/placeholder.png"],
  video_url: "",
  agent_output_demo_url: "",
  categories: ["productivity"],
  changes_summary: "",
  store_listing_version_id: "lv-1",
  graph_id: "graph-1",
};

const SAVED_GRAPH = {
  id: "graph-1",
  version: 3,
  is_active: true,
  name: "Lead Finder",
  description: "Finds decision-makers",
  nodes: [],
  links: [],
  sub_graphs: [],
  input_schema: { type: "object", properties: {} },
  output_schema: { type: "object", properties: {} },
  credentials_input_schema: { type: "object", properties: {} },
  has_external_trigger: false,
  has_human_in_the_loop: false,
  user_id: "user-1",
  created_at: "2025-01-01T00:00:00.000Z",
};

/* ------------------------------------------------------------------ */
/* Credentials context                                                 */
/* ------------------------------------------------------------------ */

function providerData(provider: string, providerName: string): any {
  const created = (type: string) => async (c: any) => ({
    id: `cred-${type}`,
    provider,
    type,
    title: c?.title ?? providerName,
  });
  return {
    provider,
    providerName,
    savedCredentials: [],
    isSystemProvider: false,
    oAuthCallback: created("oauth2"),
    mcpOAuthCallback: created("oauth2"),
    mcpStoreToken: created("oauth2"),
    createAPIKeyCredentials: created("api_key"),
    createUserPasswordCredentials: created("user_password"),
    createHostScopedCredentials: created("host_scoped"),
    deleteCredentials: async () => ({ deleted: true, revoked: true }),
  };
}

const CREDENTIAL_PROVIDERS: any = {
  openai: providerData("openai", "OpenAI"),
  smtp: providerData("smtp", "SMTP"),
  http: providerData("http", "HTTP"),
};

const API_KEY_SCHEMA: any = {
  type: "object",
  title: "Credentials",
  description: "An OpenAI API key with model access.",
  properties: {},
  required: [],
  credentials_provider: ["openai"],
  credentials_types: ["api_key"],
  credentials_scopes: ["models:read", "chat:write"],
};

const SELECTOR_SCHEMA: any = {
  ...API_KEY_SCHEMA,
  credentials_types: ["api_key", "oauth2"],
};

const PASSWORD_SCHEMA: any = {
  type: "object",
  title: "Credentials",
  properties: {},
  required: [],
  credentials_provider: ["smtp"],
  credentials_types: ["user_password"],
};

const HOST_SCOPED_SCHEMA: any = {
  type: "object",
  title: "Credentials",
  description: "Headers sent with every request to this host.",
  properties: {},
  required: [],
  credentials_provider: ["http"],
  credentials_types: ["host_scoped"],
};

/* ------------------------------------------------------------------ */
/* Harness wrappers (identical in both checkouts)                      */
/* ------------------------------------------------------------------ */

function OpenButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      data-testid="harness-open"
      onClick={onClick}
      className="rounded border border-zinc-400 px-3 py-1 text-sm"
    >
      Open
    </button>
  );
}

function WithTrigger({
  render,
}: {
  render: (open: boolean, close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <OpenButton onClick={() => setOpen(true)} />
      {render(open, () => setOpen(false))}
    </div>
  );
}

function withCredentials(Story: any) {
  return (
    <CredentialsProvidersContext.Provider value={CREDENTIAL_PROVIDERS}>
      <Story />
    </CredentialsProvidersContext.Provider>
  );
}

const noop = () => undefined;

/* ------------------------------------------------------------------ */
/* Meta                                                                */
/* ------------------------------------------------------------------ */

const meta: Meta = {
  title: "DS3aEvidence/TextareaForm",
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
  parameters: {
    layout: "padded",
    msw: {
      handlers: [
        http.get("*/api/store/categories", () =>
          HttpResponse.json(STORE_CATEGORIES),
        ),
      ],
    },
  },
};

export default meta;
type Story = StoryObj;

/* ------------------------------------------------------------------ */
/* Textarea call sites                                                 */
/* ------------------------------------------------------------------ */

export const ApproveRejectButtonsPending: Story = {
  render: () => <ApproveRejectButtons version={SUBMISSION_PENDING} />,
  parameters: {
    msw: {
      handlers: [
        http.post("*/api/store/admin/submissions/*", async () => {
          await delay("infinite");
          return HttpResponse.json({});
        }),
      ],
    },
  },
};

export const ApproveRejectButtonsApproved: Story = {
  render: () => (
    <ApproveRejectButtons
      version={{ ...SUBMISSION_PENDING, status: "APPROVED" }}
    />
  ),
};

export const AddMoneyButton: Story = {
  render: () => (
    <AdminAddMoneyButton
      userId="user-1"
      userEmail="ada@example.com"
      currentBalance={12345}
    />
  ),
  parameters: {
    msw: {
      handlers: [
        http.post("*/api/credits/admin/add_credits", async () => {
          await delay("infinite");
          return HttpResponse.json({});
        }),
      ],
    },
  },
};

export const ExecutionAnalytics: Story = {
  render: () => <ExecutionAnalyticsForm />,
  parameters: {
    msw: {
      handlers: [
        http.get("*/api/executions/admin/execution_analytics/config", () =>
          HttpResponse.json(ANALYTICS_CONFIG),
        ),
      ],
    },
  },
};

export const Refund: Story = {
  render: () => (
    <WithTrigger
      render={(open, close) => (
        <RefundModal
          isOpen={open}
          onClose={close}
          transactions={TRANSACTIONS}
          formatCredits={(c) => `$${(c / 100).toFixed(2)}`}
          refundCredits={async () => {
            await new Promise(() => undefined);
          }}
        />
      )}
    />
  ),
};

/* ------------------------------------------------------------------ */
/* Form call sites                                                     */
/* ------------------------------------------------------------------ */

export const SettingsEmailForm: Story = {
  render: () => (
    <div className="max-w-xl">
      <EmailForm user={USER} />
    </div>
  ),
};

export const SettingsNotificationForm: Story = {
  render: () => (
    <div className="max-w-xl">
      <NotificationForm
        user={USER}
        preferences={{
          user_id: "user-1",
          email: "ada@example.com",
          briefing_frequency: "WEEKLY",
          alerts_enabled: true,
          store_verdicts_enabled: false,
        }}
      />
    </div>
  ),
  parameters: {
    msw: {
      handlers: [
        http.post("*/api/auth/user/preferences", async () => {
          await delay("infinite");
          return HttpResponse.json({});
        }),
      ],
    },
  },
};

export const SettingsTimezoneForm: Story = {
  render: () => (
    <div className="max-w-xl">
      <TimezoneForm user={USER} currentTimezone="Europe/London" />
    </div>
  ),
  parameters: {
    msw: {
      handlers: [
        http.post("*/api/auth/user/timezone", async () => {
          await delay("infinite");
          return HttpResponse.json({});
        }),
      ],
    },
  },
};

export const SettingsTimezoneFormEmpty: Story = {
  render: () => (
    <div className="max-w-xl">
      <TimezoneForm user={USER} currentTimezone="" />
    </div>
  ),
};

export const APIKeyCredentials: Story = {
  decorators: [withCredentials],
  render: () => (
    <WithTrigger
      render={(open, close) => (
        <APIKeyCredentialsModal
          schema={API_KEY_SCHEMA}
          open={open}
          onClose={close}
          onCredentialsCreate={noop}
        />
      )}
    />
  ),
};

export const PasswordCredentials: Story = {
  decorators: [withCredentials],
  render: () => (
    <WithTrigger
      render={(open, close) => (
        <PasswordCredentialsModal
          schema={PASSWORD_SCHEMA}
          open={open}
          onClose={close}
          onCredentialsCreate={noop}
        />
      )}
    />
  ),
};

export const HostScopedCredentials: Story = {
  decorators: [withCredentials],
  render: () => (
    <WithTrigger
      render={(open, close) => (
        <HostScopedCredentialsModal
          schema={HOST_SCOPED_SCHEMA}
          open={open}
          onClose={close}
          onCredentialsCreate={noop}
        />
      )}
    />
  ),
};

export const CredentialTypeSelectorApiKey: Story = {
  decorators: [withCredentials],
  render: () => (
    <WithTrigger
      render={(open, close) => (
        <CredentialTypeSelector
          schema={SELECTOR_SCHEMA}
          open={open}
          onClose={close}
          provider="openai"
          providerName="OpenAI"
          supportedTypes={["api_key", "oauth2"]}
          onCredentialsCreate={noop}
          onOAuthLogin={noop}
          onOpenPasswordModal={noop}
          onOpenHostScopedModal={noop}
        />
      )}
    />
  ),
};

export const EditAgent: Story = {
  render: () => (
    <div className="max-w-3xl">
      <EditAgentForm
        submission={EDIT_SUBMISSION}
        onClose={noop}
        onSuccess={noop}
      />
    </div>
  ),
};

export const PublishAgentInfoStep: Story = {
  render: () => (
    <div className="max-w-3xl">
      <AgentInfoStep
        onBack={noop}
        onSuccess={noop}
        selectedAgentId="graph-1"
        selectedAgentVersion={3}
      />
    </div>
  ),
};

export const PublishAgentInfoStepUpdate: Story = {
  render: () => (
    <div className="max-w-3xl">
      <AgentInfoStep
        onBack={noop}
        onSuccess={noop}
        selectedAgentId="graph-1"
        selectedAgentVersion={3}
        isMarketplaceUpdate
      />
    </div>
  ),
};

export const WalletRefillPanel: Story = {
  render: () => (
    <div className="w-[26rem]">
      <WalletRefill />
    </div>
  ),
  parameters: {
    msw: {
      handlers: [
        http.get("*/api/credits/auto-top-up", () =>
          HttpResponse.json({ amount: 0, threshold: 0 }),
        ),
        http.post("*/api/credits/auto-top-up", async () => {
          await delay("infinite");
          return HttpResponse.json({});
        }),
      ],
    },
  },
};

export const SaveControl: Story = {
  decorators: [
    (Story) => (
      <NuqsTestingAdapter searchParams="?flowID=graph-1&flowVersion=3">
        <div className="pl-2 pt-2">
          <Story />
        </div>
      </NuqsTestingAdapter>
    ),
  ],
  render: () => <NewSaveControl />,
  parameters: {
    msw: {
      handlers: [
        http.get("*/api/graphs/graph-1", () => HttpResponse.json(SAVED_GRAPH)),
        http.put("*/api/graphs/graph-1", async () => {
          await delay("infinite");
          return HttpResponse.json({});
        }),
      ],
    },
  },
};
