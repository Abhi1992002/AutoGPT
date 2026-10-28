import { Tick02Icon } from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { characters } from "../../../../assets/avatars";
import { AgentAvatar } from "../../../../components/AgentAvatar";
import { Spinner } from "../../../../design-system/components/spinner";
import { CAPABILITIES } from "../../../core/data";
import { useRunPlayback } from "../../../core/hooks";
import { spring, useEnterExit } from "../../../core/motion";
import { Icon } from "../../../ui/Icon";
import type { ConsolePanelProps } from "../ConsoleOnboarding";

export function TourPanel({ flow }: ConsolePanelProps) {
  const [active, setActive] = useState(CAPABILITIES[0].id);
  const capability = CAPABILITIES.find((c) => c.id === active)!;
  const { shown, done, isFinished } = useRunPlayback(active, capability.run.length, { freeze: flow.freeze });
  const enter = useEnterExit(6);

  return (
    <div className="con-tour">
      <div className="con-tour__list" role="group" aria-label="Capabilities">
        {CAPABILITIES.map((c) => (
          <button key={c.id} type="button" className="con-tour__item" aria-pressed={c.id === active} onClick={() => setActive(c.id)}>
            {c.id === active && <motion.span layoutId="con-tour-item" className="con-tour__item-bg" transition={spring} />}
            <span className="con-icon">
              <Icon icon={c.icon} size={18} />
            </span>
            <span className="con-tour__text">
              <span className="ui">{c.title}</span>
              <span className="small text-muted">{c.description}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="con-card con-run">
        <div className="con-run__head">
          <AgentAvatar character={capability.character} size={48} state={done ? "idle" : "working"} decorative />
          <span className="ui">{characters[capability.character].name}</span>
          <span className="small text-subtle con-run__status">{done ? "Finished" : "Running"}</span>
        </div>
        <p className="body con-run__prompt">“{capability.prompt}”</p>
        <ol className="con-run__steps" aria-label="Agent steps">
          <AnimatePresence initial={false}>
            {capability.run.slice(0, shown).map((line, i) => (
              <motion.li key={`${active}-${line}`} variants={enter} initial="hidden" animate="show" exit="exit">
                <span className="con-run__mark">{isFinished(i) ? <Icon icon={Tick02Icon} size={14} strokeWidth={2} /> : <Spinner size="sm" label="Working" />}</span>
                <span className="small">{line}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
        <p className="small con-run__result" data-visible={done || undefined} aria-live="polite">
          {done ? capability.result : ""}
        </p>
      </div>
    </div>
  );
}
