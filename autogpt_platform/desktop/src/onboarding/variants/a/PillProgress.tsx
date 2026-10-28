import { motion } from "framer-motion";
import { spring } from "../../core/motion";
import { STEP_IDS, STEPS, stepIndex, type StepId } from "../../core/steps";

/** Seven pills – done ones filled, the current one stretched – with the step named beside them */
export function PillProgress({ step }: { step: StepId }) {
  const current = stepIndex(step);
  return (
    <div className="zen-progress">
      <div
        className="zen-pills"
        role="progressbar"
        aria-label="Setup progress"
        aria-valuemin={1}
        aria-valuemax={STEP_IDS.length}
        aria-valuenow={current + 1}
        aria-valuetext={`Step ${current + 1} of ${STEP_IDS.length}: ${STEPS[step].label}`}
      >
        {STEP_IDS.map((id, i) => (
          <motion.span
            key={id}
            className="zen-pills__pill"
            data-state={i < current ? "done" : i === current ? "current" : "upcoming"}
            animate={{ width: i === current ? 44 : 10 }}
            transition={spring}
            initial={false}
          />
        ))}
      </div>
      <p className="ui zen-progress__label ob-num" aria-hidden="true">
        <span className="text-subtle">
          {current + 1} of {STEP_IDS.length}
        </span>
        <span className="zen-progress__sep" />
        {STEPS[step].label}
      </p>
    </div>
  );
}
