// Evidence only (DS3a-1), never committed: the navbar's real AccountMenu opened, with the args of the repo's own
// AccountMenu stories at this commit (that folder is outside Storybook's story globs, so they never build otherwise).
import type { Meta, StoryObj } from "@storybook/nextjs";
import { userEvent, within } from "storybook/test";
import Base, * as AM from "@/components/layout/Navbar/components/AccountMenu/AccountMenu.stories";

const meta = { ...(Base as Meta), title: "Evidence/AccountMenu" } as Meta;
export default meta;
type Story = StoryObj;

async function open({ canvasElement }: { canvasElement: HTMLElement }) {
  await userEvent.click(within(canvasElement).getByTestId("profile-popout-menu-trigger"));
  await within(document.body).findByTestId("account-menu-popover");
}
export const UserOpen: Story = { args: AM.Default.args, play: open };
export const AdminOpen: Story = { args: AM.AdminUser.args, play: open };
export const AdminOpenItemHover: Story = {
  args: AM.AdminUser.args,
  play: async (ctx) => { await open(ctx); await userEvent.hover(within(document.body).getByText("Admin")); },
};
