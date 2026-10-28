import { Tick02Icon } from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { AgentAvatar } from "../../../../components/AgentAvatar";
import { Spinner } from "../../../../design-system/components/spinner";
import { CAPABILITIES } from "../../../core/data";
import { useRunPlayback } from "../../../core/hooks";
import { spring, useEnterExit } from "../../../core/motion";
import { Icon } from "../../../ui/Icon";
import type { ZenStepProps } from "../ZenOnboarding";
import { Reveal, ZenHeader } from "../parts";

export function ZenTour({ flow }: ZenStepProps) {
  const [active, setActive] = useState(CAPABILITIES[0].id);
  const capability = CAPABILITIES.find((c) => c.id === active)!;
  const { shown, done, isFinished } = useRunPlayback(active, capability.run.length, { freeze: flow.freeze });
  const line = useEnterExit(6);

  return (
    <>
      <ZenHeader step="tour" moved={flow.state.moved} />
      <Reveal className="zen-tour">
        <div className="zen-tour__tabs" role="group" aria-label="Capabilities">
          {CAPABILITIES.map((c) => (
            <button key={c.id} type="button" className="zen-tour__tab" aria-pressed={c.id === active} onClick={() => setActive(c.id)}>
              {c.id === active && <motion.span layoutId="zen-tour-tab" className="zen-tour__tab-bg" transition={spring} />}
              <Icon icon={c.icon} size={16} />
              <span className="ui">{c.short}</span>
            </button>
          ))}
        </div>

        <div className="zen-run">
          <p className="ui zen-run__title">
            {capability.title} <span className="text-muted">· {capability.description}</span>
          </p>
          <div className="zen-run__prompt">
            <AgentAvatar character={capability.character} size={32} state={done ? "idle" : "working"} decorative />
            <p className="ui">{capability.prompt}</p>
          </div>
          <ol className="zen-run__steps" aria-label="Agent steps">
            <AnimatePresence initial={false}>
              {capability.run.slice(0, shown).map((step, i) => (
                <motion.li key={`${active}-${step}`} className="zen-run__step" variants={line} initial="hidden" animate="show" exit="exit">
                  <span className="zen-run__mark">{isFinished(i) ? <Icon icon={Tick02Icon} size={14} strokeWidth={2} /> : <Spinner size="sm" label="Working" />}</span>
                  <span className="small">{step}</span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>
          <p className="small zen-run__result" data-visible={done || undefined} aria-live="polite">
            {done ? capability.result : ""}
          </p>
        </div>
      </Reveal>
    </>
  );
}
