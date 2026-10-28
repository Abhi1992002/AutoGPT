import { AiMagicIcon } from "@hugeicons/core-free-icons";
import { useMemo } from "react";
import { Understood } from "../../../blocks/Understood";
import { understand } from "../../../core/understand";
import type { StoryDemoProps } from "../StoryOnboarding";
import { Window } from "../Window";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** What Otto understood, filling in as you type on the left */
export function BrainDemo({ flow }: StoryDemoProps) {
  const { tools, tasks } = useMemo(() => understand(flow.state.brain), [flow.state.brain]);
  return (
    <Window icon={AiMagicIcon} title="What Otto understood" meta={`${plural(tasks.length, "task", "tasks")} · ${plural(tools.length, "tool", "tools")}`}>
      <Understood flow={flow} />
    </Window>
  );
}
