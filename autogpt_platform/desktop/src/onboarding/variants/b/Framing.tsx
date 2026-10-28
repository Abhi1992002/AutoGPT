import { AnimatePresence, motion } from "framer-motion";
import { springSlow, useEnterExit } from "../../core/motion";
import { STEP_IDS, stepIndex, type StepId } from "../../core/steps";

/** "Almost done" framing: a sentence about what's left, with a small ring instead of a bar */
const FRAMES: Record<StepId, string> = {
  welcome: "About three minutes",
  download: "About two minutes left",
  start: "About a minute left",
  tour: "Almost done",
  connect: "Two quick questions left",
  brain: "Last question",
  done: "All done",
};

const R = 5.5;
const C = 2 * Math.PI * R;

export function Framing({ step }: { step: StepId }) {
  const enter = useEnterExit(4);
  const ratio = stepIndex(step) / (STEP_IDS.length - 1);
  return (
    <p className="story-framing ob-meta" role="status">
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
        <circle cx="7" cy="7" r={R} fill="none" stroke="currentColor" strokeOpacity="0.16" strokeWidth="1.5" />
        <motion.circle
          className="story-framing__arc"
          cx="7"
          cy="7"
          r={R}
          fill="none"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={C}
          animate={{ strokeDashoffset: C * (1 - Math.max(ratio, 0.06)) }}
          transition={springSlow}
          initial={false}
          transform="rotate(-90 7 7)"
        />
      </svg>
      <span className="story-framing__text">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={step} variants={enter} initial="hidden" animate="show" exit="exit">
            {FRAMES[step]}
          </motion.span>
        </AnimatePresence>
      </span>
    </p>
  );
}
