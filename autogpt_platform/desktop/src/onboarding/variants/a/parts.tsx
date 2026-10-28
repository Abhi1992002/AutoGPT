import type { IconSvgElement } from "@hugeicons/react";
import { motion } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { useStepFocus } from "../../core/hooks";
import { useEnterExit } from "../../core/motion";
import { STEPS, type StepId } from "../../core/steps";
import { Icon } from "../../ui/Icon";

/** A chunk of a Zen step that takes part in the staggered entrance */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const variants = useEnterExit(8);
  return (
    <motion.div className={className} variants={variants}>
      {children}
    </motion.div>
  );
}

/** Visual, title and description – the top of every Zen step */
export function ZenHeader({ step, moved, visual, icon }: { step: StepId; moved: boolean; visual?: ReactNode; icon?: IconSvgElement }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useStepFocus(heading, moved);
  const copy = STEPS[step];
  return (
    <Reveal className="zen__head">
      {(visual || icon) && (
        <div className="zen__visual">
          {visual ?? (
            <span className="ob-tile ob-tile--lg">
              <Icon icon={icon!} size={18} />
            </span>
          )}
        </div>
      )}
      <h1 id="zen-title" ref={heading} tabIndex={-1} className="ob-display">
        {copy.title}
      </h1>
      <p className="ob-lead">{copy.description}</p>
    </Reveal>
  );
}
