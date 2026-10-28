import { Link01Icon } from "@hugeicons/core-free-icons";
import { ToolGrid } from "../../../blocks/ToolGrid";
import { connectedCount } from "../../../core/machine";
import type { StoryDemoProps } from "../StoryOnboarding";
import { Window } from "../Window";

export function ConnectDemo({ flow }: StoryDemoProps) {
  const n = connectedCount(flow.state.integrations);
  return (
    <Window icon={Link01Icon} title="Integrations" meta={n === 0 ? "None connected, optional" : `${n} connected`}>
      <ToolGrid flow={flow} />
    </Window>
  );
}
