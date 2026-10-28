import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "framer-motion";
import { useRef, type ComponentType } from "react";
import { Button } from "../../../design-system/components/button";
import { useStepFocus } from "../../core/hooks";
import { stagger, useEnterExit } from "../../core/motion";
import { STEP_IDS, STEPS, stepIndex, type StepId } from "../../core/steps";
import type { Onboarding } from "../../core/useOnboarding";
import { Icon } from "../../ui/Icon";
import { BrainPanel } from "./panels/BrainPanel";
import { ConnectPanel } from "./panels/ConnectPanel";
import { DonePanel } from "./panels/DonePanel";
import { DownloadPanel } from "./panels/DownloadPanel";
import { StartPanel } from "./panels/StartPanel";
import { TourPanel } from "./panels/TourPanel";
import { WelcomePanel } from "./panels/WelcomePanel";
import { Stepper } from "./Stepper";
import "./console.css";

/*
 * Variant C – Console. A checklist stepper on the left, a rich visual panel on the right:
 * the download as a stylised terminal with layer bars, the start as a service table.
 */

export type ConsolePanelProps = { flow: Onboarding };

const PANELS: Record<StepId, ComponentType<ConsolePanelProps>> = {
  welcome: WelcomePanel,
  download: DownloadPanel,
  start: StartPanel,
  tour: TourPanel,
  connect: ConnectPanel,
  brain: BrainPanel,
  done: DonePanel,
};

export function ConsoleOnboarding({ flow }: { flow: Onboarding }) {
  const { step } = flow.state;
  const Panel = PANELS[step];
  const enter = useEnterExit(10);

  return (
    <div className="ob con">
      <Stepper flow={flow} />
      <main className="con__main">
        <AnimatePresence mode="wait" initial={false}>
          <motion.section key={step} className="con__view" aria-labelledby="con-title" variants={stagger(0.08)} initial="hidden" animate="show" exit="exit">
            {/* The brain dump sets its own minimal prompt */}
            {step !== "brain" && <ConsoleHeader flow={flow} step={step} />}
            <motion.div className="con__panel" variants={enter}>
              <Panel flow={flow} />
            </motion.div>
            <motion.footer className="con__footer" variants={enter}>
              {step !== "welcome" && step !== "done" && (
                <Button variant="ghost" icon={<Icon icon={ArrowLeft01Icon} />} onClick={flow.back}>
                  Back
                </Button>
              )}
              <Button className="con__primary" disabled={!flow.canContinue} onClick={flow.next}>
                {STEPS[step].action}
              </Button>
            </motion.footer>
          </motion.section>
        </AnimatePresence>
      </main>
    </div>
  );
}

function ConsoleHeader({ flow, step }: { flow: Onboarding; step: StepId }) {
  const enter = useEnterExit(10);
  const heading = useRef<HTMLHeadingElement>(null);
  useStepFocus(heading, flow.state.moved);
  return (
    <motion.header className="con__header" variants={enter}>
      <p className="eyebrow text-subtle ob-num">
        Step {stepIndex(step) + 1} of {STEP_IDS.length}
      </p>
      <h1 id="con-title" ref={heading} tabIndex={-1} className="ob-display">
        {STEPS[step].title}
      </h1>
      <p className="ob-lead text-muted">{STEPS[step].description}</p>
    </motion.header>
  );
}
