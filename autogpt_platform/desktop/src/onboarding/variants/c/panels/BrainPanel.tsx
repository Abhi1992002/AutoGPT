import { Composer } from "../../../blocks/Composer";
import { Understood } from "../../../blocks/Understood";
import type { ConsolePanelProps } from "../ConsoleOnboarding";

/** The brief as a composer, with what Otto picked up beside it */
export function BrainPanel({ flow }: ConsolePanelProps) {
  return (
    <div className="con-brain">
      <Composer flow={flow} id="con-brain" rows={4} chips={5} placeholder="I lead a support team of six. Mornings are a blur of tickets and Slack threads…" />
      <aside className="ob-panel con-brain__side" aria-label="What Otto picked up">
        <Understood flow={flow} />
      </aside>
    </div>
  );
}
