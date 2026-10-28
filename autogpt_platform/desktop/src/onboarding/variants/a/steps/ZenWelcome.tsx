import { INTEGRATIONS } from "../../../core/data";
import type { ZenStepProps } from "../ZenOnboarding";
import { ZenHero } from "../ZenHero";
import { Reveal, ZenHeader } from "../parts";

const ORBIT = ["github", "slack", "notion", "google", "linear"].map((id) => INTEGRATIONS.find((i) => i.id === id)!);

export function ZenWelcome({ flow }: ZenStepProps) {
  return (
    <>
      <ZenHeader step="welcome" moved={flow.state.moved} visual={<ZenHero tools={ORBIT} still={flow.freeze} />} />
      <Reveal>
        <p className="ui text-subtle zen__note">Setup takes about three minutes</p>
      </Reveal>
    </>
  );
}
