// Evidence only (DS3a-1), never committed: a builder node in the running state, its output dialog,
// and the workflow outputs sheet, rendered from a seeded node store.
import type { Meta, StoryObj } from "@storybook/nextjs";
import { BackendAPIProvider } from "@/lib/autogpt-server-api/context";
import { userEvent, within } from "storybook/test";
import { useNodeStore } from "@/app/(platform)/build/stores/nodeStore";
import { useGraphStore } from "@/app/(platform)/build/stores/graphStore";
import { BlockUIType } from "@/app/(platform)/build/components/types";
import { NodeExecutionBadge } from "@/app/(platform)/build/components/FlowEditor/nodes/CustomNode/components/NodeExecutionBadge";
import { ViewMoreData } from "@/app/(platform)/build/components/FlowEditor/nodes/CustomNode/components/NodeOutput/components/ViewMoreData";
import { AgentOutputs } from "@/app/(platform)/build/components/BuilderActions/components/AgentOutputs/AgentOutputs";

const LONG = "The quarterly report covers revenue, churn and pipeline. ".repeat(12).trim();
function result(i: number, status: string) {
  return {
    user_id: "u1", graph_id: "g1", graph_version: 1, graph_exec_id: "ge1",
    node_exec_id: `exec-${String(i).padStart(4, "0")}-6c1f-4b8e-9a51-0d2e7b3c${i}f00`, node_id: "node-1", block_id: "b1",
    status, input_data: { prompt: `Summarise item ${i}` }, output_data: { output: [`${LONG} (${i})`] },
    add_time: new Date("2026-10-24T09:00:00Z"), queue_time: null, start_time: null, end_time: null,
  };
}
function seed(status: string, results = 0) {
  useNodeStore.setState({
    nodes: [{
      id: "node-1", type: "custom", position: { x: 0, y: 0 },
      data: {
        status, uiType: BlockUIType.OUTPUT, title: "Report", description: "", hardcodedValues: { name: "Report", description: "The summarised report" },
        nodeExecutionResults: Array.from({ length: results }, (_, i) => result(i + 1, "COMPLETED")),
        inputSchema: {}, outputSchema: {}, block_id: "b1", costs: [], categories: [],
      },
    }],
  } as never);
  useGraphStore.setState({ hasOutputs: () => results > 0 } as never);
  return {};
}
function scrollDialog() {
  const v = document.querySelector("[role=dialog] [data-radix-scroll-area-viewport]") as HTMLElement | null;
  if (v) v.scrollTop = v.scrollHeight;
}

const meta: Meta = { title: "Evidence/NodeRun", decorators: [(Story) => <BackendAPIProvider><Story /></BackendAPIProvider>] };
export default meta;
type Story = StoryObj;

export const BadgeRunning: Story = { loaders: [() => seed("RUNNING")], render: () => <NodeExecutionBadge nodeId="node-1" /> };
export const BadgeQueued: Story = { loaders: [() => seed("QUEUED")], render: () => <NodeExecutionBadge nodeId="node-1" /> };
export const ViewMoreOpen: Story = {
  loaders: [() => seed("COMPLETED", 3)],
  render: () => <ViewMoreData nodeId="node-1" dataType="output" />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "View More" }));
    await within(document.body).findByText(/Complete Output Data/);
  },
};
export const ViewMoreScrolled: Story = {
  ...ViewMoreOpen,
  play: async (ctx) => { await ViewMoreOpen.play!(ctx); scrollDialog(); },
};
export const OutputsSheet: Story = {
  loaders: [() => seed("COMPLETED", 3)],
  render: () => <AgentOutputs flowID="flow-1" />,
  play: async ({ canvasElement }) => {
    await userEvent.click(canvasElement.querySelector('[data-id="agent-outputs-button"]') as HTMLElement);
    await within(document.body).findByText("Run Outputs");
  },
};
export const OutputsSheetScrolled: Story = {
  ...OutputsSheet,
  play: async (ctx) => {
    await OutputsSheet.play!(ctx);
    const v = document.querySelector("[role=dialog] [data-radix-scroll-area-viewport]") as HTMLElement | null;
    if (v) v.scrollTop = v.scrollHeight;
  },
};
// Closed, for the harness to open by keyboard.
export const ViewMoreClosed: Story = { loaders: [() => seed("COMPLETED", 3)], render: () => <ViewMoreData nodeId="node-1" dataType="output" /> };
export const OutputsSheetClosed: Story = { loaders: [() => seed("COMPLETED", 3)], render: () => <AgentOutputs flowID="flow-1" /> };
