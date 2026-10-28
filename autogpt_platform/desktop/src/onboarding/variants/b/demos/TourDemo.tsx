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
import type { StoryDemoProps } from "../StoryOnboarding";

/** Show, don't tell: each capability plays as a short mock agent run */
export function TourDemo({ flow }: StoryDemoProps) {
  const [active, setActive] = useState(CAPABILITIES[0].id);
  const capability = CAPABILITIES.find((c) => c.id === active)!;
  const { shown, done, isFinished } = useRunPlayback(active, capability.run.length, { freeze: flow.freeze, stepMs: 750 });
  const enter = useEnterExit(8);
  const agent = characters[capability.character];

  return (
    <div className="story-tour">
      <div className="story-tabs" role="group" aria-label="Capabilities">
        {CAPABILITIES.map((c) => (
          <button key={c.id} type="button" className="story-tabs__tab" aria-pressed={c.id === active} onClick={() => setActive(c.id)}>
            {c.id === active && <motion.span layoutId="story-tab" className="story-tabs__bg" transition={spring} />}
            <Icon icon={c.icon} size={16} />
            <span className="ui">{c.short}</span>
          </button>
        ))}
      </div>

      <div className="story-panel story-run">
        <div className="story-run__head">
          <AgentAvatar character={capability.character} size={44} state={done ? "idle" : "working"} theme="dark" decorative />
          <div>
            <p className="ui">{agent.name}</p>
            <p className="small story__muted">{done ? "Finished" : "Working…"}</p>
          </div>
        </div>
        <p className="story-run__prompt body">{capability.prompt}</p>
        <ol className="story-run__steps" aria-label="Agent steps">
          <AnimatePresence initial={false}>
            {capability.run.slice(0, shown).map((line, i) => (
              <motion.li key={`${active}-${line}`} className="story-run__step" variants={enter} initial="hidden" animate="show" exit="exit">
                <span className="story-run__mark">{isFinished(i) ? <Icon icon={Tick02Icon} size={14} strokeWidth={2} /> : <Spinner size="sm" label="Working" />}</span>
                <span className="ui">{line}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
        <div className="story-run__result" aria-live="polite">
          <AnimatePresence>
            {done && (
              <motion.p key={active} className="ui" variants={enter} initial="hidden" animate="show" exit="exit">
                {capability.result}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
