import { AgentAvatar } from "../../../../components/AgentAvatar";
import type { ZenStepProps } from "../ZenOnboarding";
import { Reveal, ZenHeader } from "../parts";

export function ZenWelcome({ flow }: ZenStepProps) {
  return (
    <>
      <ZenHeader step="welcome" moved={flow.state.moved} visual={<AgentAvatar character="auto" size={104} interactive decorative />} />
      <Reveal>
        <p className="small text-subtle zen__note">Setup takes about three minutes</p>
      </Reveal>
    </>
  );
}
