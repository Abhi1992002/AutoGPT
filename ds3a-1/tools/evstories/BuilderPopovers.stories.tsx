// Evidence only (DS3a-1), never committed: the builder's block menu and save popover (the PopoverContent
// call sites) mounted as the real components at both widths. At 390px the builder hides its control
// panel, so this is the only way to see them there. The block menu's data is a recorded live response.
import type { Meta, StoryObj } from "@storybook/nextjs";
import { http, HttpResponse, type JsonBodyType } from "msw";
import { userEvent, waitFor } from "storybook/test";
import { ReactFlowProvider } from "@xyflow/react";
import { NuqsAdapter } from "nuqs/adapters/react";
import { BlockMenu } from "@/app/(platform)/build/components/NewControlPanel/NewBlockMenu/BlockMenu/BlockMenu";
import { NewSaveControl } from "@/app/(platform)/build/components/NewControlPanel/NewSaveControl/NewSaveControl";
import { BackendAPIProvider } from "@/lib/autogpt-server-api/context";
import { TooltipProvider } from "@/components/atoms/Tooltip/BaseTooltip";
import recorded from "./builder-recorded.json";

const rec = recorded as Record<string, { body: JsonBodyType }>;
const handlers = [
  http.get("*/api/builder/suggestions", () => HttpResponse.json(rec["/api/builder/suggestions"].body)),
  http.get("*/api/builder/counts", () => HttpResponse.json(rec["/api/builder/counts"].body)),
];
function Frame({ children }: { children: React.ReactNode }) {
  return (
    <BackendAPIProvider>
      <NuqsAdapter>
        <ReactFlowProvider>
          <TooltipProvider>
            <div className="relative flex h-[760px] w-full items-start justify-start p-4">{children}</div>
          </TooltipProvider>
        </ReactFlowProvider>
      </NuqsAdapter>
    </BackendAPIProvider>
  );
}
const meta: Meta = { title: "Evidence/BuilderPopovers", parameters: { msw: { handlers } } };
export default meta;
type Story = StoryObj;

const open = (trigger: string, content: string) => async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  await userEvent.click(canvasElement.querySelector(`[data-id="${trigger}"]`) as HTMLElement);
  await waitFor(() => { if (!document.querySelector(`[data-id="${content}"]`)) throw new Error("not open"); });
};
export const BlockMenuClosed: Story = { render: () => <Frame><BlockMenu /></Frame> };
export const BlockMenuOpen: Story = { render: () => <Frame><BlockMenu /></Frame>, play: open("blocks-control-popover-trigger", "blocks-control-popover-content") };
export const SaveControlClosed: Story = { render: () => <Frame><NewSaveControl /></Frame> };
export const SaveControlOpen: Story = { render: () => <Frame><NewSaveControl /></Frame>, play: open("save-control-popover-trigger", "save-control-popover-content") };
