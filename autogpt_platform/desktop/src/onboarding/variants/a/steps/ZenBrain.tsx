import { useMemo } from "react";
import { AgentAvatar } from "../../../../components/AgentAvatar";
import { Composer } from "../../../blocks/Composer";
import { understand } from "../../../core/understand";
import { ExpertStack } from "../../../ui/ExpertStack";
import type { ZenStepProps } from "../ZenOnboarding";
import { Reveal, ZenHeader } from "../parts";

export function ZenBrain({ flow }: ZenStepProps) {
  const { tasks } = useMemo(() => understand(flow.state.brain), [flow.state.brain]);

  return (
    <>
      <ZenHeader step="brain" moved={flow.state.moved} visual={<AgentAvatar character="otto" size={40} decorative />} />
      <Reveal className="zen-stack">
        <Composer flow={flow} id="zen-brain" chips={4} placeholder="I run a four-person design studio. Keep client email and invoices under control." />
        <p className="zen-drafts ob-meta" aria-live="polite" data-visible={tasks.length > 0 || undefined}>
          {tasks.length > 0 && <ExpertStack ids={tasks.map((t) => t.character)} size={20} />}
          <span>
            {tasks.length === 0
              ? "Otto drafts an agent for each task you mention"
              : `${tasks.length === 1 ? "1 agent" : `${tasks.length} agents`} to draft: ${tasks.map((t) => t.title.toLowerCase()).join(", ")}`}
          </span>
        </p>
      </Reveal>
    </>
  );
}
