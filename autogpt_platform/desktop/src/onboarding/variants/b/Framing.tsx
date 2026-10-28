import { AnimatePresence, motion } from "framer-motion";
import { springSlow, useEnterExit } from "../../core/motion";
import { STEP_IDS, stepIndex, type StepId } from "../../core/steps";

/** "Almost done" framing: a sentence about what's left, with a small ring instead of a bar */
const FRAMES: Record<StepId, string> = {
  welcome: "Takes about three minutes",
  download: "About two minutes left",
  start: "About a minute left",
  tour: "Almost done",
  connect: "Almost done – two quick questions",
  brain: "Last question",
  done: "All done",
};

const R = 6;
const C = 2 * Math.PI * R;

export function Framing({ step }: { step: StepId }) {
  const enter = useEnterExit(6);
  const ratio = stepIndex(step) / (STEP_IDS.length - 1);
  return (
    <p className="story__framing small" role="status">
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r={R} fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
        <motion.circle
          cx="8"
          cy="8"
          r={R}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={C}
          animate={{ strokeDashoffset: C * (1 - Math.max(ratio, 0.04)) }}
          transition={springSlow}
          initial={false}
          transform="rotate(-90 8 8)"
        />
      </svg>
      <span className="story__framing-text">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={step} variants={enter} initial="hidden" animate="show" exit="exit">
            {FRAMES[step]}
          </motion.span>
        </AnimatePresence>
      </span>
    </p>
  );
}
