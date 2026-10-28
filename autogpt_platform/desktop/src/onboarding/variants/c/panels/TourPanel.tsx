import { motion } from "framer-motion";
import { useState } from "react";
import { characters } from "../../../../assets/avatars";
import { AgentAvatar } from "../../../../components/AgentAvatar";
import { RunView } from "../../../blocks/RunView";
import { CAPABILITIES } from "../../../core/data";
import { spring } from "../../../core/motion";
import { Icon } from "../../../ui/Icon";
import type { ConsolePanelProps } from "../ConsoleOnboarding";

export function TourPanel({ flow }: ConsolePanelProps) {
  const [active, setActive] = useState(CAPABILITIES[0].id);
  const capability = CAPABILITIES.find((c) => c.id === active)!;

  return (
    <div className="con-tour">
      <div className="con-tour__list" role="group" aria-label="Capabilities">
        {CAPABILITIES.map((c) => (
          <button key={c.id} type="button" className="con-tour__item" aria-pressed={c.id === active} onClick={() => setActive(c.id)}>
            {c.id === active && <motion.span layoutId="con-tour-item" className="con-tour__item-bg" transition={spring} />}
            <span className="ob-tile">
              <Icon icon={c.icon} size={14} />
            </span>
            <span className="con-tour__text">
              <span className="ob-label">{c.title}</span>
              <span className="ob-meta">{c.description}</span>
            </span>
            <AgentAvatar character={c.character} size={20} decorative />
            <span className="ob-sr">Run by {characters[c.character].name}</span>
          </button>
        ))}
      </div>
      <div className="ob-panel con-run">
        <RunView capability={capability} freeze={flow.freeze} />
      </div>
    </div>
  );
}
