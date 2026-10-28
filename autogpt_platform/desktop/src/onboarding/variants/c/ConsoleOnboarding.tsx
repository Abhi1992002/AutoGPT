import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
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
 * Variant C – Console. Setup inside the app's own shell, the way Linear lays out a workspace:
 * a sidebar checklist, an inset main panel with a breadcrumb bar, dense tables and a terminal.
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

const AUTO: Partial<Record<StepId, string>> = { download: "Continues when the download finishes", start: "Continues when the engine is healthy" };

export function ConsoleOnboarding({ flow }: { flow: Onboarding }) {
  const { step } = flow.state;
  const Panel = PANELS[step];
  const enter = useEnterExit(6);
  const waiting = !flow.canContinue ? AUTO[step] : undefined;

  return (
    <div className="ob con">
      <Stepper flow={flow} />
      <main className="con__main">
        <header className="con__bar">
          <p className="ob-meta con__crumbs">
            <span>Setup</span>
            <Icon icon={ArrowRight01Icon} size={12} />
            <span className="ob-label">{STEPS[step].label}</span>
          </p>
          <span className="ob-meta ob-num">
            {stepIndex(step) + 1} / {STEP_IDS.length}
          </span>
        </header>
        <div className="con__scroll">
          <AnimatePresence mode="wait" initial={false}>
            <motion.section key={step} className="con__view" data-step={step} aria-labelledby="con-title" variants={stagger(0.05)} initial="hidden" animate="show" exit="exit">
              <ConsoleHeader flow={flow} step={step} />
              <motion.div className="con__panel" variants={enter}>
                <Panel flow={flow} />
              </motion.div>
            </motion.section>
          </AnimatePresence>
        </div>
        <footer className="con__footer">
          {step !== "welcome" && step !== "done" && (
            <Button variant="ghost" icon={<Icon icon={ArrowLeft01Icon} />} onClick={flow.back}>
              Back
            </Button>
          )}
          {waiting && <span className="ob-meta con__waiting">{waiting}</span>}
          <Button className="con__primary" disabled={!flow.canContinue} onClick={flow.next}>
            {STEPS[step].action}
          </Button>
        </footer>
      </main>
    </div>
  );
}

function ConsoleHeader({ flow, step }: { flow: Onboarding; step: StepId }) {
  const enter = useEnterExit(6);
  const heading = useRef<HTMLHeadingElement>(null);
  useStepFocus(heading, flow.state.moved);
  return (
    <motion.header className="con__header" variants={enter}>
      <h1 id="con-title" ref={heading} tabIndex={-1} className="ob-title">
        {STEPS[step].title}
      </h1>
      <p className="ob-lead">{STEPS[step].description}</p>
    </motion.header>
  );
}
