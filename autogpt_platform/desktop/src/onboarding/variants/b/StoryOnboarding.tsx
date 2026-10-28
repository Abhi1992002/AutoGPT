import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "framer-motion";
import { useRef, type ComponentType } from "react";
import { Button } from "../../../design-system/components/button";
import { Composer } from "../../blocks/Composer";
import { useStepFocus } from "../../core/hooks";
import { stagger, useEnterExit, useFade } from "../../core/motion";
import { STEPS, type StepId } from "../../core/steps";
import type { Onboarding } from "../../core/useOnboarding";
import { Brand } from "../../ui/Brand";
import { Icon } from "../../ui/Icon";
import { BrainDemo } from "./demos/BrainDemo";
import { ConnectDemo } from "./demos/ConnectDemo";
import { DownloadDemo } from "./demos/DownloadDemo";
import { StartDemo } from "./demos/StartDemo";
import { TourDemo } from "./demos/TourDemo";
import { Framing } from "./Framing";
import { Hero } from "./Hero";
import { Narrator } from "./Narrator";
import { StoryWait } from "./StoryWait";
import "./story.css";

/*
 * Variant B – Story. A neutral dark stage, like Linear's: a large headline on the left with Otto
 * narrating in one line, and the product itself on the right in a window that shows the step live.
 * Progress is framed in words ("about a minute left") with a small ring.
 */

export type StoryDemoProps = { flow: Onboarding };

const DEMOS: Partial<Record<StepId, ComponentType<StoryDemoProps>>> = {
  download: DownloadDemo,
  start: StartDemo,
  tour: TourDemo,
  connect: ConnectDemo,
  brain: BrainDemo,
};

export function StoryOnboarding({ flow }: { flow: Onboarding }) {
  const { step } = flow.state;
  const Demo = DEMOS[step];

  return (
    <main className="ob story dark">
      <header className="story__top">
        <Brand />
        <Framing step={step} />
      </header>

      {Demo ? (
        <div className="story__split">
          <AnimatePresence mode="wait" initial={false}>
            <StoryCopy key={step} flow={flow} step={step} />
          </AnimatePresence>
          <div className="story__demo">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                className="story__demo-inner"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.2, 0, 0, 1], delay: 0.08 } }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
              >
                <Demo flow={flow} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <Hero key={step} flow={flow} />
        </AnimatePresence>
      )}
    </main>
  );
}

function StoryCopy({ flow, step }: { flow: Onboarding; step: StepId }) {
  const enter = useEnterExit(8);
  const swap = useFade();
  const heading = useRef<HTMLHeadingElement>(null);
  useStepFocus(heading, flow.state.moved);
  const copy = STEPS[step];

  return (
    <motion.section className="story__copy" aria-labelledby="story-title" variants={stagger(0.06)} initial="hidden" animate="show" exit="exit">
      <motion.div variants={enter}>
        <Narrator flow={flow} step={step} />
      </motion.div>
      <motion.h1 id="story-title" ref={heading} tabIndex={-1} className="ob-hero" variants={enter}>
        {copy.title}
      </motion.h1>
      <motion.p className="ob-lead story__lead" variants={enter}>
        {copy.description}
      </motion.p>
      {step === "brain" && (
        <motion.div variants={enter}>
          <Composer flow={flow} id="story-brain" rows={3} chips={4} placeholder="I’m a product manager. Every Friday I write the team update from Linear…" />
        </motion.div>
      )}
      <motion.div className="story__actions" variants={enter}>
        <AnimatePresence mode="popLayout" initial={false}>
          {flow.canContinue ? (
            <motion.span key="go" className="story__action" {...swap}>
              <Button size="lg" onClick={flow.next} iconRight={<Icon icon={ArrowRight01Icon} />}>
                {copy.action}
              </Button>
            </motion.span>
          ) : (
            <motion.span key="wait" className="story__action" {...swap}>
              <StoryWait flow={flow} />
            </motion.span>
          )}
        </AnimatePresence>
        <Button variant="ghost" size="lg" icon={<Icon icon={ArrowLeft01Icon} />} onClick={flow.back}>
          Back
        </Button>
      </motion.div>
    </motion.section>
  );
}
