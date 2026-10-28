import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "framer-motion";
import { useLayoutEffect, useRef, useState, type ComponentType } from "react";
import { Button } from "../../../design-system/components/button";
import { springSlow, stagger, useEnterExit } from "../../core/motion";
import { STEPS, type StepId } from "../../core/steps";
import type { Onboarding } from "../../core/useOnboarding";
import { Icon } from "../../ui/Icon";
import { PillProgress } from "./PillProgress";
import { ZenBrain } from "./steps/ZenBrain";
import { ZenConnect } from "./steps/ZenConnect";
import { ZenDone } from "./steps/ZenDone";
import { ZenDownload } from "./steps/ZenDownload";
import { ZenStart } from "./steps/ZenStart";
import { ZenTour } from "./steps/ZenTour";
import { ZenWelcome } from "./steps/ZenWelcome";
import "./zen.css";

/*
 * Variant A – Zen. One centered card, one idea per screen. The card's height glides between steps
 * while the content cross-fades; a pill progress sits at the top.
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

export function ZenOnboarding({ flow }: { flow: Onboarding }) {
  const { state } = flow;
  const View = VIEWS[state.step];
  const copy = STEPS[state.step];
  const enter = useEnterExit(8);
  const showBack = state.step !== "welcome" && state.step !== "done";
  const centered = state.step === "welcome" || state.step === "done";

  return (
    <main className="ob zen">
      <div className="zen__glow" aria-hidden="true" />
      <header className="zen__top">
        <PillProgress step={state.step} />
      </header>

      <AutoHeight className="zen__card">
        <AnimatePresence mode="wait" initial={false}>
          <motion.section
            key={state.step}
            className="zen__content"
            data-centered={centered || undefined}
            aria-labelledby="zen-title"
            variants={stagger(0.06)}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <View flow={flow} />
            <motion.footer className="zen__footer" variants={enter}>
              {showBack && (
                <Button variant="ghost" icon={<Icon icon={ArrowLeft01Icon} />} onClick={flow.back}>
                  Back
                </Button>
              )}
              <Button size={centered ? "lg" : "md"} className="zen__primary" disabled={!flow.canContinue} onClick={flow.next}>
                {copy.action}
              </Button>
            </motion.footer>
          </motion.section>
        </AnimatePresence>
      </AutoHeight>
    </main>
  );
}

/** Animates its height to fit the content, so a step change glides instead of jumping */
function AutoHeight({ className, children }: { className: string; children: React.ReactNode }) {
  const inner = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">("auto");
  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setHeight(entry.borderBoxSize[0]?.blockSize ?? el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <motion.div className={className} animate={{ height }} transition={springSlow} initial={false}>
      <div ref={inner}>{children}</div>
    </motion.div>
  );
}
