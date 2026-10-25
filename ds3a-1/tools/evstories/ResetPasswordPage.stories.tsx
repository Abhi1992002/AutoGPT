// Evidence only (DS3a-1), never committed: the real reset-password page. In production the page
// never suspends (the server renders its content), so its Suspense fallback is reached here by
// making useSearchParams suspend, which is what the boundary in page.tsx catches.
import type { Meta, StoryObj } from "@storybook/nextjs";
import { useSearchParams } from "@storybook/nextjs/navigation.mock";
import ResetPasswordPage from "@/app/(platform)/reset-password/page";

const never = new Promise<never>(() => {});
const meta: Meta = { title: "Evidence/ResetPasswordPage" };
export default meta;
type Story = StoryObj;

export const Suspended: Story = {
  beforeEach: () => {
    useSearchParams.mockImplementation(() => { throw never; });
    return () => useSearchParams.mockReset();
  },
  render: () => <ResetPasswordPage />,
};
export const Loaded: Story = { render: () => <ResetPasswordPage /> };
