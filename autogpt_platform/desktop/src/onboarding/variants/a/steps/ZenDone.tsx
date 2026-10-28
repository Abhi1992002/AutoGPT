import { useMemo } from "react";
import { AgentAvatar } from "../../../../components/AgentAvatar";
import { INTEGRATIONS, SERVICE_IDS } from "../../../core/data";
import { understand } from "../../../core/understand";
import { ExpertStack } from "../../../ui/ExpertStack";
import { Icon } from "../../../ui/Icon";
import { StatusMark } from "../../../ui/StatusMark";
import type { ZenStepProps } from "../ZenOnboarding";
import { Reveal, ZenHeader } from "../parts";

export function ZenDone({ flow }: ZenStepProps) {
  const tools = INTEGRATIONS.filter((i) => flow.state.integrations[i.id] === "connected");
  const brief = flow.state.brain.trim();
  const { tasks } = useMemo(() => understand(brief), [brief]);
  const experts = tasks.map((t) => t.character);

  return (
    <>
      <ZenHeader
        step="done"
        moved={flow.state.moved}
        visual={
          <span className="zen-team">
            <AgentAvatar character="otto" size={48} decorative />
            {experts.length > 0 && <ExpertStack ids={experts} size={28} />}
          </span>
        }
      />
      <Reveal>
        <ul className="ob-panel ob-rows zen-list">
          <li className="ob-row">
            <StatusMark mark="done" />
            <span className="ob-label">Engine running on this computer</span>
            <span className="ob-meta ob-num ob-row__end">{SERVICE_IDS.length} services</span>
          </li>
          <li className="ob-row">
            <StatusMark mark={tools.length ? "done" : "pending"} />
            <span className="ob-label">{tools.length === 0 ? "No tools yet" : tools.length === 1 ? "1 tool connected" : `${tools.length} tools connected`}</span>
            <span className="ob-row__end zen-icons">
              {tools.length ? tools.map((t) => <Icon key={t.id} icon={t.icon} size={14} label={t.name} />) : <span className="ob-meta">Add them in Settings</span>}
            </span>
          </li>
          <li className="ob-row">
            <StatusMark mark={tasks.length ? "done" : "pending"} />
            <span className="ob-label">{tasks.length === 0 ? "No brief yet" : tasks.length === 1 ? "1 agent to draft" : `${tasks.length} agents to draft`}</span>
            {experts.length === 0 && <span className="ob-meta ob-row__end">Tell Otto anytime</span>}
          </li>
          {tasks.length > 0 && (
            <li>
              <ul className="zen-drafting" aria-label="Agents Otto is drafting">
                {tasks.map((task) => (
                  <li key={task.id}>
                    <AgentAvatar character={task.character} size={20} decorative />
                    <span className="ob-text">{task.title}</span>
                    <span className="ob-meta">{task.when ?? "On demand"}</span>
                  </li>
                ))}
              </ul>
            </li>
          )}
        </ul>
      </Reveal>
    </>
  );
}
