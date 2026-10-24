// TEMPORARY evidence harness for the ui/skeleton -> atoms/Skeleton move.
// Never commit. Renders each real importer's skeleton/loading state.
import type { Meta, StoryObj } from "@storybook/nextjs";
import { delay, http } from "msw";
import { NuqsAdapter } from "nuqs/adapters/react";
import React from "react";

import { LoadingLogin } from "@/app/(no-navbar)/login/components/LoadingLogin";
import { LoadingSignup } from "@/app/(no-navbar)/signup/components/LoadingSignup";
import SettingsLoading from "@/app/(platform)/profile/(user)/settings/loading";
import { MainMarketplacePageLoading } from "@/app/(platform)/marketplace/components/MainMarketplacePageLoading";
import { SubmissionsLoading } from "@/app/(platform)/profile/(user)/dashboard/components/MainDashboardPage/components/SubmissionsLoading";
import { AgentRunsLoading } from "@/app/(platform)/library/agents/[id]/components/NewAgentLibraryView/components/other/AgentRunsLoading";
import { LoadingSelectedContent } from "@/app/(platform)/library/agents/[id]/components/NewAgentLibraryView/components/selected-views/LoadingSelectedContent";
import { SidebarRunsList } from "@/app/(platform)/library/agents/[id]/components/NewAgentLibraryView/components/sidebar/SidebarRunsList/SidebarRunsList";
import { AgentVersionChangelog } from "@/app/(platform)/library/agents/[id]/components/NewAgentLibraryView/components/AgentVersionChangelog";
import { Block } from "@/app/(platform)/build/components/NewControlPanel/NewBlockMenu/Block";
import { Integration } from "@/app/(platform)/build/components/NewControlPanel/NewBlockMenu/Integration";
import { IntegrationChip } from "@/app/(platform)/build/components/NewControlPanel/NewBlockMenu/IntegrationChip";
import { IntegrationBlock } from "@/app/(platform)/build/components/NewControlPanel/NewBlockMenu/IntergrationBlock";
import { MarketplaceAgentBlock } from "@/app/(platform)/build/components/NewControlPanel/NewBlockMenu/MarketplaceAgentBlock";
import { SearchHistoryChip } from "@/app/(platform)/build/components/NewControlPanel/NewBlockMenu/SearchHistoryChip";
import { UGCAgentBlock } from "@/app/(platform)/build/components/NewControlPanel/NewBlockMenu/UGCAgentBlock";
import { BlockMenuSidebar } from "@/app/(platform)/build/components/NewControlPanel/NewBlockMenu/BlockMenuSidebar/BlockMenuSidebar";
import { IntegrationBlocks } from "@/app/(platform)/build/components/NewControlPanel/NewBlockMenu/IntegrationBlocks/IntegrationBlocks";
import { PublishAgentModal } from "@/components/contextual/PublishAgentModal/PublishAgentModal";
import { PublishAuthPromptSkeleton } from "@/components/contextual/PublishAgentModal/components/PublishAuthPrompt";
import { AgentSelectStep } from "@/components/contextual/PublishAgentModal/components/AgentSelectStep/AgentSelectStep";
import { BackendAPIProvider } from "@/lib/autogpt-server-api/context";
import { useAuthStore } from "@/lib/auth/hooks/useAuthStore";

const pendingApi = [http.all("*/api/*", () => delay("infinite"))];

const fakeAgent: any = {
  id: "lib-agent-1",
  graph_id: "graph-1",
  graph_version: 3,
  name: "Weekly Digest",
  description: "Summarises the week",
  has_human_in_the_loop: false,
  has_sensitive_action: false,
  settings: {},
  marketplace_listing: {
    id: "listing-1",
    slug: "weekly-digest",
    name: "Weekly Digest",
    creator: { id: "creator-1", slug: "evidence-creator", name: "Evidence" },
  },
};

const fakeUser: any = {
  id: "user-1",
  email: "evidence@example.com",
  role: "authenticated",
  user_metadata: { name: "Evidence" },
};

const neverResolves = new Promise<void>(() => {});

function setSignedIn() {
  useAuthStore.setState({
    user: fakeUser,
    hasLoadedUser: true,
    isUserLoading: false,
    initializationPromise: null,
  } as any);
}

function setUserLoading() {
  useAuthStore.setState({
    user: null,
    hasLoadedUser: false,
    isUserLoading: true,
    initializationPromise: neverResolves,
  } as any);
}

function withProviders(Story: any) {
  return (
    <BackendAPIProvider>
      <NuqsAdapter>
        <Story />
      </NuqsAdapter>
    </BackendAPIProvider>
  );
}

function SignedIn({ children }: { children: React.ReactNode }) {
  setSignedIn();
  return <>{children}</>;
}

function UserLoading({ children }: { children: React.ReactNode }) {
  setUserLoading();
  return <>{children}</>;
}

const noop = () => {};

const meta: Meta = {
  title: "DS3aEvidence/Skeleton",
  decorators: [withProviders],
  parameters: { msw: { handlers: pendingApi } },
};
export default meta;

type Story = StoryObj;

export const LoadingLoginPage: Story = {
  parameters: { layout: "fullscreen" },
  render: () => <LoadingLogin />,
};

export const LoadingSignupPage: Story = {
  parameters: { layout: "fullscreen" },
  render: () => <LoadingSignup />,
};

export const SettingsLoadingPage: Story = {
  render: () => <SettingsLoading />,
};

export const MarketplacePageLoading: Story = {
  render: () => <MainMarketplacePageLoading />,
};

export const DashboardSubmissionsLoading: Story = {
  render: () => <SubmissionsLoading />,
};

export const LibraryAgentRunsLoading: Story = {
  render: () => <AgentRunsLoading />,
};

export const LibraryLoadingSelectedContent: Story = {
  render: () => <LoadingSelectedContent agent={fakeAgent} />,
};

export const LibrarySidebarRunsListLoading: Story = {
  render: () => <SidebarRunsList agent={fakeAgent} onSelectRun={noop} />,
};

export const LibraryAgentVersionChangelogLoading: Story = {
  render: () => (
    <AgentVersionChangelog agent={fakeAgent} isOpen onClose={noop} />
  ),
};

export const BuilderBlockSkeleton: Story = {
  render: () => (
    <div className="w-[30rem]">
      <Block.Skeleton />
    </div>
  ),
};

export const BuilderIntegrationSkeleton: Story = {
  render: () => (
    <div className="w-[30rem]">
      <Integration.Skeleton />
    </div>
  ),
};

export const BuilderIntegrationChipSkeleton: Story = {
  render: () => (
    <div className="w-[30rem]">
      <IntegrationChip.Skeleton />
    </div>
  ),
};

export const BuilderIntegrationBlockSkeleton: Story = {
  render: () => (
    <div className="w-[30rem]">
      <IntegrationBlock.Skeleton />
    </div>
  ),
};

export const BuilderMarketplaceAgentBlockSkeleton: Story = {
  render: () => (
    <div className="w-[30rem]">
      <MarketplaceAgentBlock.Skeleton />
    </div>
  ),
};

export const BuilderSearchHistoryChipSkeleton: Story = {
  render: () => (
    <div className="w-[30rem]">
      <SearchHistoryChip.Skeleton />
    </div>
  ),
};

export const BuilderUgcAgentBlockSkeleton: Story = {
  render: () => (
    <div className="w-[30rem]">
      <UGCAgentBlock.Skeleton />
    </div>
  ),
};

export const BuilderBlockMenuSidebarLoading: Story = {
  render: () => <BlockMenuSidebar />,
};

export const BuilderIntegrationBlocksLoading: Story = {
  render: () => (
    <div className="w-[30rem]">
      <IntegrationBlocks />
    </div>
  ),
};

export const PublishModalAuthLoading: Story = {
  render: () => (
    <UserLoading>
      <PublishAgentModal
        showTrigger={false}
        targetState={{ isOpen: true, step: "select", submissionData: null }}
      />
    </UserLoading>
  ),
};

export const PublishModalReviewLoading: Story = {
  render: () => (
    <SignedIn>
      <PublishAgentModal
        showTrigger={false}
        targetState={{ isOpen: true, step: "review", submissionData: null }}
      />
    </SignedIn>
  ),
};

export const PublishAuthPromptSkeletonOnly: Story = {
  render: () => (
    <div className="w-[48rem]">
      <PublishAuthPromptSkeleton />
    </div>
  ),
};

export const PublishAgentSelectStepLoading: Story = {
  render: () => (
    <SignedIn>
      <div className="w-[48rem]">
        <AgentSelectStep
          onSelect={noop}
          onCancel={noop}
          onNext={noop}
          onOpenBuilder={noop}
        />
      </div>
    </SignedIn>
  ),
};
