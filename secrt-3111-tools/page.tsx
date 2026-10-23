"use client";

// DS5g screenshot harness: renders the real copilot tool cards with fixture
// parts in plain document flow, so a full-page screenshot shows every class
// the token refactor touched. Temporary, never committed.
//
// After mount it clicks every collapsed ToolAccordion header once (several
// passes, for nested ones) and then sets data-harness-ready="true" on the
// root. Add ?collapsed=1 to skip the auto-expand.

import { CopilotChatActionsProvider } from "@/app/(platform)/copilot/components/CopilotChatActionsProvider/CopilotChatActionsProvider";
import { AskQuestionTool } from "@/app/(platform)/copilot/tools/AskQuestion/AskQuestion";
import { ConnectIntegrationTool } from "@/app/(platform)/copilot/tools/ConnectIntegrationTool/ConnectIntegrationTool";
import { CreateAgentTool } from "@/app/(platform)/copilot/tools/CreateAgent/CreateAgent";
import { SuggestedGoalCard } from "@/app/(platform)/copilot/tools/CreateAgent/components/SuggestedGoalCard";
import { DecomposeGoalTool } from "@/app/(platform)/copilot/tools/DecomposeGoal/DecomposeGoal";
import { StepItem } from "@/app/(platform)/copilot/tools/DecomposeGoal/components/StepItem";
import { EditAgentTool } from "@/app/(platform)/copilot/tools/EditAgent/EditAgent";
import {
  CreateFeatureRequestTool,
  SearchFeatureRequestsTool,
} from "@/app/(platform)/copilot/tools/FeatureRequests/FeatureRequests";
import { FindAgentsTool } from "@/app/(platform)/copilot/tools/FindAgents/FindAgents";
import { FindBlocksTool } from "@/app/(platform)/copilot/tools/FindBlocks/FindBlocks";
import { FindCapabilitiesTool } from "@/app/(platform)/copilot/tools/FindCapabilities/FindCapabilities";
import { FolderTool } from "@/app/(platform)/copilot/tools/FolderTool/FolderTool";
import { GenericTool } from "@/app/(platform)/copilot/tools/GenericTool/GenericTool";
import { RunAgentTool } from "@/app/(platform)/copilot/tools/RunAgent/RunAgent";
import { AgentDetailsCard } from "@/app/(platform)/copilot/tools/RunAgent/components/AgentDetailsCard/AgentDetailsCard";
import { ErrorCard as RunAgentErrorCard } from "@/app/(platform)/copilot/tools/RunAgent/components/ErrorCard/ErrorCard";
import { ExecutionStartedCard } from "@/app/(platform)/copilot/tools/RunAgent/components/ExecutionStartedCard/ExecutionStartedCard";
import { RunBlockTool } from "@/app/(platform)/copilot/tools/RunBlock/RunBlock";
import { BlockOutputCard } from "@/app/(platform)/copilot/tools/RunBlock/components/BlockOutputCard/BlockOutputCard";
import { ErrorCard as RunBlockErrorCard } from "@/app/(platform)/copilot/tools/RunBlock/components/ErrorCard/ErrorCard";
import { RunMCPToolComponent } from "@/app/(platform)/copilot/tools/RunMCPTool/RunMCPTool";
import { MCPSetupCard } from "@/app/(platform)/copilot/tools/RunMCPTool/components/MCPSetupCard/MCPSetupCard";
import { MCPToolOutputCard } from "@/app/(platform)/copilot/tools/RunMCPTool/components/MCPToolOutputCard/MCPToolOutputCard";
import { SearchDocsTool } from "@/app/(platform)/copilot/tools/SearchDocs/SearchDocs";
import { SetupTriggerTool } from "@/app/(platform)/copilot/tools/SetupTrigger/SetupTrigger";
import { ViewAgentOutputTool } from "@/app/(platform)/copilot/tools/ViewAgentOutput/ViewAgentOutput";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  type FixtureCase,
  type FixturePart,
  agentDetails,
  askQuestion,
  blockErrorOutput,
  blockOutputDryRun,
  connectIntegration,
  createAgent,
  createFeatureRequest,
  decomposeGoal,
  decompositionSteps,
  editAgent,
  executionStarted,
  findAgents,
  findBlocks,
  findCapabilities,
  folderTool,
  genericTool,
  mcpSetupConnected,
  mcpSetupDisconnected,
  mcpToolOutput,
  runAgent,
  runBlock,
  runErrorOutput,
  runMcpTool,
  searchDocs,
  searchFeatureRequests,
  setupTrigger,
  viewAgentOutput,
} from "./fixtures";

// A private client whose queries are disabled unless a hook enables them
// explicitly: MCPSetupCard's live-credential lookup never fires, so it always
// falls back to the fixture's has_all_credentials snapshot, and nothing in the
// harness depends on what the backend returns.
const harnessQueryClient = new QueryClient({
  defaultOptions: {
    queries: { enabled: false, retry: false, refetchOnWindowFocus: false },
  },
});

// Pause every CSS animation and transition inside the harness (spinners,
// loaders, tailwind animate-in) so screenshots are pixel-stable. Applies to
// both builds equally.
const FREEZE_CSS = `
[data-ds5g-harness] *, [data-ds5g-harness] *::before, [data-ds5g-harness] *::after {
  animation: none !important;
  transition: none !important;
}
`;

// Each tool component declares its own structurally compatible part type;
// let the call site pick it.
function asPart<T>(part: FixturePart): T {
  return part as unknown as T;
}

function noop() {}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-10 border-t border-neutral-300 pt-4">
      <h2 className="mb-3 font-mono text-lg font-semibold text-neutral-900">
        {title}
      </h2>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function Case({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-1 font-mono text-xs uppercase tracking-wide text-neutral-500">
        {label}
      </h3>
      {children}
    </div>
  );
}

function Cases({
  cases,
  render,
}: {
  cases: FixtureCase[];
  render: (part: FixturePart) => ReactNode;
}) {
  return (
    <>
      {cases.map((c) => (
        <Case key={c.part.toolCallId} label={`${c.part.type} · ${c.label}`}>
          {render(c.part)}
        </Case>
      ))}
    </>
  );
}

function useAutoExpand() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(function expandCollapsedAccordions() {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const skip = new URLSearchParams(window.location.search).has("collapsed");
    let passes = 0;

    function finish() {
      timers.push(setTimeout(() => setReady(true), 800));
    }

    function expandPass() {
      const root = rootRef.current;
      if (!root) return finish();
      // ToolAccordion headers: aria-expanded + aria-controls and no Radix
      // data-state (excludes the folder tree's Radix triggers).
      const collapsed = Array.from(
        root.querySelectorAll<HTMLButtonElement>(
          'button[aria-expanded="false"][aria-controls]:not([data-state])',
        ),
      );
      collapsed.forEach((button) => button.click());
      passes += 1;
      if (collapsed.length > 0 && passes < 5) {
        timers.push(setTimeout(expandPass, 150));
      } else {
        finish();
      }
    }

    timers.push(setTimeout(skip ? finish : expandPass, 300));
    return () => timers.forEach(clearTimeout);
  }, []);

  return { rootRef, ready };
}

export default function DS5gToolsHarnessPage() {
  const { rootRef, ready } = useAutoExpand();

  return (
    <QueryClientProvider client={harnessQueryClient}>
      <CopilotChatActionsProvider onSend={noop}>
        <style>{FREEZE_CSS}</style>
        <div
          ref={rootRef}
          data-ds5g-harness
          data-harness-ready={ready ? "true" : "false"}
          className="mx-auto w-full max-w-5xl bg-white px-6 py-8"
        >
          <h1 className="mb-8 text-2xl font-semibold">
            DS5g copilot tool cards harness
          </h1>

          <Section title="FindCapabilities">
            <Cases
              cases={findCapabilities}
              render={(p) => <FindCapabilitiesTool part={asPart(p)} />}
            />
          </Section>

          <Section title="FindBlocks">
            <Cases
              cases={findBlocks}
              render={(p) => <FindBlocksTool part={asPart(p)} />}
            />
          </Section>

          <Section title="FindAgents">
            <Cases
              cases={findAgents}
              render={(p) => <FindAgentsTool part={asPart(p)} />}
            />
          </Section>

          <Section title="SearchDocs (search_docs + get_doc_page)">
            <Cases
              cases={searchDocs}
              render={(p) => <SearchDocsTool part={asPart(p)} />}
            />
          </Section>

          <Section title="RunBlock">
            <Cases
              cases={runBlock}
              render={(p) => <RunBlockTool part={asPart(p)} />}
            />
            <Case label="BlockOutputCard direct (dry run, Show all 6 items)">
              <BlockOutputCard output={blockOutputDryRun} />
            </Case>
            <Case label="RunBlock ErrorCard direct">
              <RunBlockErrorCard output={blockErrorOutput} />
            </Case>
          </Section>

          <Section title="RunAgent (run_agent + schedule_agent)">
            <Cases
              cases={runAgent}
              render={(p) => <RunAgentTool part={asPart(p)} />}
            />
            <Case label="ExecutionStartedCard direct">
              <ExecutionStartedCard output={executionStarted} />
            </Case>
            <Case label="AgentDetailsCard direct">
              <AgentDetailsCard output={agentDetails} />
            </Case>
            <Case label="RunAgent ErrorCard direct">
              <RunAgentErrorCard output={runErrorOutput} />
            </Case>
          </Section>

          <Section title="RunMCPTool">
            <Cases
              cases={runMcpTool}
              render={(p) => <RunMCPToolComponent part={asPart(p)} />}
            />
            <Case label="MCPToolOutputCard direct">
              <MCPToolOutputCard output={mcpToolOutput} />
            </Case>
            <Case label="MCPSetupCard direct (connected)">
              <MCPSetupCard output={mcpSetupConnected} />
            </Case>
            <Case label="MCPSetupCard direct (not connected)">
              <MCPSetupCard output={mcpSetupDisconnected} />
            </Case>
          </Section>

          <Section title="CreateAgent">
            <Cases
              cases={createAgent}
              render={(p) => <CreateAgentTool part={asPart(p)} />}
            />
            <Case label="SuggestedGoalCard direct (vague)">
              <SuggestedGoalCard
                message="That goal is too vague to build."
                suggestedGoal="Track 5 stock prices daily and email me a summary"
                reason="The original goal has no measurable outcome."
                goalType="vague"
                onUseSuggestedGoal={noop}
              />
            </Case>
          </Section>

          <Section title="EditAgent">
            <Cases
              cases={editAgent}
              render={(p) => <EditAgentTool part={asPart(p)} />}
            />
          </Section>

          <Section title="DecomposeGoal">
            <Cases
              cases={decomposeGoal}
              render={(p) => <DecomposeGoalTool part={asPart(p)} />}
            />
            <Case label="StepItem direct (completed / in_progress / failed / pending)">
              <div className="rounded-lg border p-3">
                {decompositionSteps.map((step, i) => (
                  <StepItem
                    key={step.step_id}
                    index={i}
                    description={step.description}
                    blockName={step.block_name}
                    status={step.status}
                  />
                ))}
              </div>
            </Case>
          </Section>

          <Section title="FolderTool">
            <Cases
              cases={folderTool}
              render={(p) => <FolderTool part={asPart(p)} />}
            />
          </Section>

          <Section title="FeatureRequests">
            <Cases
              cases={searchFeatureRequests}
              render={(p) => <SearchFeatureRequestsTool part={asPart(p)} />}
            />
            <Cases
              cases={createFeatureRequest}
              render={(p) => <CreateFeatureRequestTool part={asPart(p)} />}
            />
          </Section>

          <Section title="SetupTrigger">
            <Cases
              cases={setupTrigger}
              render={(p) => <SetupTriggerTool part={asPart(p)} />}
            />
          </Section>

          <Section title="ViewAgentOutput">
            <Cases
              cases={viewAgentOutput}
              render={(p) => <ViewAgentOutputTool part={asPart(p)} />}
            />
          </Section>

          <Section title="ConnectIntegrationTool">
            <Cases
              cases={connectIntegration}
              render={(p) => <ConnectIntegrationTool part={asPart(p)} />}
            />
          </Section>

          <Section title="AskQuestion">
            <Cases
              cases={askQuestion}
              render={(p) => <AskQuestionTool part={asPart(p)} />}
            />
          </Section>

          <Section title="GenericTool">
            <Cases
              cases={genericTool}
              render={(p) => <GenericTool part={asPart(p)} />}
            />
          </Section>
        </div>
      </CopilotChatActionsProvider>
    </QueryClientProvider>
  );
}
