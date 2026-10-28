import { Tick02Icon } from "@hugeicons/core-free-icons";
import { AgentAvatar } from "../../../../components/AgentAvatar";
import { connectedCount } from "../../../core/machine";
import { Icon } from "../../../ui/Icon";
import type { ZenStepProps } from "../ZenOnboarding";
import { Reveal, ZenHeader } from "../parts";

export function ZenDone({ flow }: ZenStepProps) {
  const tools = connectedCount(flow.state.integrations);
  const briefed = flow.state.brain.trim().length > 0;
  const items = [
    { text: "Engine running on this computer", done: true },
    { text: tools === 0 ? "Connect tools anytime in Settings" : tools === 1 ? "1 tool connected" : `${tools} tools connected`, done: tools > 0 },
    { text: briefed ? "Auto has your brief" : "Tell Auto about you anytime", done: briefed },
  ];

  return (
    <>
      <ZenHeader step="done" moved={flow.state.moved} visual={<AgentAvatar character="auto" size={112} hat="party" interactive decorative />} />
      <Reveal>
        <ul className="zen-summary">
          {items.map((item) => (
            <li key={item.text} className="ui" data-done={item.done || undefined}>
              <span className="zen-summary__mark">{item.done && <Icon icon={Tick02Icon} size={12} strokeWidth={2.5} />}</span>
              {item.text}
            </li>
          ))}
        </ul>
      </Reveal>
    </>
  );
}
