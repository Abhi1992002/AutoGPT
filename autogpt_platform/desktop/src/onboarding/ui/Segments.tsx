import { STEP_IDS, STEPS, stepIndex, type StepId } from "../core/steps";

/** Seven hairline segments: done and current ones fill with the accent */
export function Segments({ step, className }: { step: StepId; className?: string }) {
  const current = stepIndex(step);
  return (
    <div
      className={["ob-segments", className].filter(Boolean).join(" ")}
      role="progressbar"
      aria-label="Setup progress"
      aria-valuemin={1}
      aria-valuemax={STEP_IDS.length}
      aria-valuenow={current + 1}
      aria-valuetext={`Step ${current + 1} of ${STEP_IDS.length}: ${STEPS[step].label}`}
    >
      {STEP_IDS.map((id, i) => (
        <span key={id} className="ob-segments__seg" data-on={i <= current || undefined} />
      ))}
    </div>
  );
}
