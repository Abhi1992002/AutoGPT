import { Tick02Icon } from "@hugeicons/core-free-icons";
import { INTEGRATIONS } from "../../../core/data";
import { Icon } from "../../../ui/Icon";
import type { ZenStepProps } from "../ZenOnboarding";
import { ZenHero } from "../ZenHero";
import { Reveal, ZenHeader } from "../parts";

export function ZenDone({ flow }: ZenStepProps) {
  const tools = INTEGRATIONS.filter((i) => flow.state.integrations[i.id] === "connected");
  const briefed = flow.state.brain.trim().length > 0;
  const items = [
    { text: "Engine running on this computer", done: true },
    { text: tools.length === 0 ? "Connect tools anytime in Settings" : tools.length === 1 ? "1 tool connected" : `${tools.length} tools connected`, done: tools.length > 0 },
    { text: briefed ? "Auto has your brief" : "Tell Auto about you anytime", done: briefed },
  ];

  return (
    <>
      <ZenHeader step="done" moved={flow.state.moved} visual={<ZenHero tools={tools} hat="party" still={flow.freeze} />} />
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
