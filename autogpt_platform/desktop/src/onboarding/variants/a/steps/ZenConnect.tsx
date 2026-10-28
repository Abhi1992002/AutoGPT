import { ConnectedNote, ToolGrid } from "../../../blocks/ToolGrid";
import type { ZenStepProps } from "../ZenOnboarding";
import { Reveal, ZenHeader } from "../parts";

export function ZenConnect({ flow }: ZenStepProps) {
  return (
    <>
      <ZenHeader step="connect" moved={flow.state.moved} />
      <Reveal className="zen-stack">
        <ToolGrid flow={flow} />
        <ConnectedNote flow={flow} />
      </Reveal>
    </>
  );
}
