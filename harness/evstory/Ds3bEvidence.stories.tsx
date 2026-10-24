// EVIDENCE ONLY (DS3b part 2). Copied into throwaway worktrees of a PR's base
// and head, never committed. Renders the real components the running app never
// mounts: WalletFullPanel (only the compact wallet is rendered), the
// TextGenerateEffect path of EmptyHero (EmptySession always passes a recipient
// picker), and AccountMenuFeedbackRow (CLOUD builds only). Fixed data.
import type { Meta, StoryObj } from "@storybook/nextjs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/molecules/Popover/Popover";
import { WalletFullPanel } from "@/components/layout/Navbar/components/Wallet/components/WalletFullPanel";
import { AccountMenuFeedbackRow } from "@/components/layout/Navbar/components/AccountMenu/components/AccountMenuFeedbackRow";
import { EmptyHero } from "@/app/(platform)/copilot/components/EmptySession/components/EmptyHero";
import { BackendAPIProvider } from "@/lib/autogpt-server-api/context";
import OnboardingProvider from "@/providers/onboarding/onboarding-provider";

function Providers({ children }: { children: React.ReactNode }) {
  return <BackendAPIProvider><OnboardingProvider>{children}</OnboardingProvider></BackendAPIProvider>;
}

const meta: Meta = { title: "Evidence/DS3b", parameters: { layout: "fullscreen" } };
export default meta;
type Story = StoryObj;

const groups = [
  { name: "First Wins", details: "Kickstart your journey with quick wins.", tasks: [
    { id: "ONBOARDING_COMPLETE", name: "Complete onboarding", amount: 3, details: "Finish the steps." },
    { id: "AGENT_NEW_RUN", name: "Run a workflow", amount: 3, details: "Run anything once." },
  ] },
  { name: "Get going", details: "Make it yours.", tasks: [
    { id: "MARKETPLACE_VISIT", name: "Visit the marketplace", amount: 1, details: "Look around." },
  ] },
] as never;

export const WalletPanel: Story = {
  render: () => (
    <Providers><div className="p-6">
      <Popover open>
        <PopoverTrigger asChild><span /></PopoverTrigger>
        <PopoverContent align="start" className="w-[400px] p-0"><WalletFullPanel groups={groups} formattedCredits="$12.50" /></PopoverContent>
      </Popover>
    </div></Providers>
  ),
};
export const FeedbackRow: Story = { render: () => <BackendAPIProvider><div className="w-[280px] bg-white p-4"><AccountMenuFeedbackRow /></div></BackendAPIProvider> };
export const HeroTextGenerateEffect: Story = {
  render: () => <Providers><div className="mx-auto max-w-[52rem] pt-6 text-center"><EmptyHero name="Screens" intro="I'm your Head of AI. Tell me what slows you down and I'll put the right team to work." /></div></Providers>,
};
