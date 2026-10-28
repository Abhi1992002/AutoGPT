import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "framer-motion";
import type { ComponentType } from "react";
import { Button } from "../../../design-system/components/button";
import { stagger, useEnterExit } from "../../core/motion";
import { STEP_IDS, STEPS, stepIndex, type StepId } from "../../core/steps";
import type { Onboarding } from "../../core/useOnboarding";
import { Brand } from "../../ui/Brand";
import { Icon } from "../../ui/Icon";
import { Segments } from "../../ui/Segments";
import { ZenBrain } from "./steps/ZenBrain";
import { ZenConnect } from "./steps/ZenConnect";
import { ZenDone } from "./steps/ZenDone";
import { ZenDownload } from "./steps/ZenDownload";
import { ZenStart } from "./steps/ZenStart";
import { ZenTour } from "./steps/ZenTour";
import { ZenWelcome } from "./steps/ZenWelcome";
import "./zen.css";

/*
 * Variant A – Zen. One quiet column on a plain canvas, one idea per screen, the way Linear onboards:
 * a thin seven-segment progress up top, the step's title and a single focused control below it.
 */

export type ZenStepProps = { flow: Onboarding };

const VIEWS: Record<StepId, ComponentType<ZenStepProps>> = {
  welcome: ZenWelcome,
  download: ZenDownload,
  start: ZenStart,
  tour: ZenTour,
  connect: ZenConnect,
  brain: ZenBrain,
  done: ZenDone,
};

/** Steps that hand off on their own once the engine work finishes */
const AUTO: Partial<Record<StepId, string>> = { download: "Continues when the download finishes", start: "Continues when the engine is healthy" };

export function ZenOnboarding({ flow }: { flow: Onboarding }) {
  const { state } = flow;
  const View = VIEWS[state.step];
  const copy = STEPS[state.step];
  const enter = useEnterExit(8);
  const bookend = state.step === "welcome" || state.step === "done";
  const wide = state.step === "connect" || state.step === "tour";
  const waiting = !flow.canContinue ? AUTO[state.step] : undefined;

  return (
    <main className="ob zen">
      <header className="zen__top">
        <Brand />
        <Segments step={state.step} />
        <p className="ob-meta ob-num zen__count" aria-hidden="true">
          {stepIndex(state.step) + 1} of {STEP_IDS.length}
          <span className="zen__count-label">{copy.label}</span>
        </p>
      </header>

      <div className="zen__stage">
        <AnimatePresence mode="wait" initial={false}>
          <motion.section
            key={state.step}
            className="zen__col"
            data-wide={wide || undefined}
            data-bookend={bookend || undefined}
            aria-labelledby="zen-title"
            variants={stagger(0.06)}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <View flow={flow} />
            <motion.footer className="zen__footer" variants={enter}>
              {bookend ? (
                <Button size="lg" className="zen__wide" onClick={flow.next}>
                  {copy.action}
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="lg" icon={<Icon icon={ArrowLeft01Icon} />} onClick={flow.back}>
                    Back
                  </Button>
                  {waiting && <span className="ob-meta zen__waiting">{waiting}</span>}
                  <Button size="lg" className="zen__primary" disabled={!flow.canContinue} onClick={flow.next}>
                    {copy.action}
                  </Button>
                </>
              )}
            </motion.footer>
          </motion.section>
        </AnimatePresence>
      </div>
    </main>
  );
}
