// Evidence only (DS3a-1), never committed: the real MCPToolDialog in each state, the MCP endpoints stubbed with MSW.
import type { Meta, StoryObj } from "@storybook/nextjs";
import { BackendAPIProvider } from "@/lib/autogpt-server-api/context";
import { delay, http, HttpResponse } from "msw";
import { useState } from "react";
import { userEvent, within } from "storybook/test";
import { MCPToolDialog } from "@/app/(platform)/build/components/MCPToolDialog";

const TOOLS = Array.from({ length: 14 }, (_, i) => ({
  name: `tool_${String(i + 1).padStart(2, "0")}`,
  description: `Tool number ${i + 1}: reads and writes records in the example server, with a description long enough to wrap onto a second line.`,
  input_schema: { type: "object", properties: { query: { type: "string", description: "What to look up" } }, required: ["query"] },
}));

const discover = (kind: "pending" | "tools" | "error" | "auth") =>
  http.post("*/api/mcp/discover-tools", async () => {
    if (kind === "pending") { await delay("infinite"); }
    if (kind === "error") return HttpResponse.json({ detail: "Could not reach https://mcp.example.com/mcp" }, { status: 502 });
    if (kind === "auth") return HttpResponse.json({ detail: "Authentication required" }, { status: 401 });
    return HttpResponse.json({ tools: TOOLS, server_name: "Example MCP", protocol_version: "2025-06-18" });
  });
const noOAuth = http.post("*/api/mcp/oauth/login", () =>
  HttpResponse.json({ detail: { code: "no_oauth", message: "This server does not offer OAuth sign-in." } }, { status: 400 }));

async function connect() {
  const body = within(document.body);
  await userEvent.type(await body.findByLabelText("Server URL"), "https://mcp.example.com/mcp");
  await userEvent.click(body.getByRole("button", { name: "Discover Tools" }));
  return body;
}
function viewport() {
  return document.querySelector("[role=dialog] [data-radix-scroll-area-viewport]") as HTMLElement;
}

// Like a real caller, the story owns `open`: Escape and Cancel close it.
function Controlled() {
  const [open, setOpen] = useState(true);
  return <MCPToolDialog open={open} onClose={() => setOpen(false)} onConfirm={() => setOpen(false)} />;
}

const meta: Meta<typeof MCPToolDialog> = {
  title: "Evidence/MCPToolDialog",
  render: () => <Controlled />,
  decorators: [(Story) => <BackendAPIProvider><Story /></BackendAPIProvider>],
  component: MCPToolDialog,
  args: { open: true, onClose: () => {}, onConfirm: () => {} },
};
export default meta;
type Story = StoryObj<typeof MCPToolDialog>;

export const UrlStep: Story = {};
export const Connecting: Story = {
  parameters: { msw: { handlers: [discover("pending")] } },
  play: async () => { const b = await connect(); await b.findByText("Connecting..."); },
};
export const Tools: Story = {
  parameters: { msw: { handlers: [discover("tools")] } },
  play: async () => { const b = await connect(); await b.findByText("tool_01"); },
};
export const ToolsScrolled: Story = {
  parameters: { msw: { handlers: [discover("tools")] } },
  play: async () => {
    const b = await connect(); await b.findByText("tool_14");
    const v = viewport(); v.scrollTop = v.scrollHeight;
  },
};
export const ToolHovered: Story = {
  parameters: { msw: { handlers: [discover("tools")] } },
  play: async () => { const b = await connect(); await userEvent.hover(await b.findByText("tool_02")); },
};
export const ErrorState: Story = {
  parameters: { msw: { handlers: [discover("error")] } },
  play: async () => { const b = await connect(); await b.findByRole("alert"); },
};
export const ManualCredential: Story = {
  parameters: { msw: { handlers: [discover("auth"), noOAuth] } },
  play: async () => { const b = await connect(); await b.findByLabelText(/token|key|credential/i); },
};
