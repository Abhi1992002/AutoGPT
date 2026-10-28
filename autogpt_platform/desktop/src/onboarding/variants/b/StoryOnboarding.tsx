import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useRef, type ComponentType } from "react";
import { AgentAvatar } from "../../../components/AgentAvatar";
import { Button } from "../../../design-system/components/button";
import { useStepFocus } from "../../core/hooks";
import { springSlow, stagger, useEnterExit } from "../../core/motion";
import { STEPS, type StepId } from "../../core/steps";
import type { Onboarding } from "../../core/useOnboarding";
import { Icon } from "../../ui/Icon";
import { BrainInput, BrainDemo } from "./demos/BrainDemo";
import { ConnectDemo } from "./demos/ConnectDemo";
import { DownloadDemo } from "./demos/DownloadDemo";
import { StartDemo } from "./demos/StartDemo";
import { TourDemo } from "./demos/TourDemo";
import { Framing } from "./Framing";
import { Hero } from "./Hero";
import "./story.css";

/*
 * Variant B – Story. A full-bleed purple stage with a big headline, Auto as the guide and a live
 * demo beside it. Progress is framed in words ("almost done") rather than a bar.
 */

export type StoryDemoProps = { flow: Onboarding };

const DEMOS: Partial<Record<StepId, ComponentType<StoryDemoProps>>> = {
  download: DownloadDemo,
  start: StartDemo,
  tour: TourDemo,
  connect: ConnectDemo,
  brain: BrainDemo,
};

const GUIDE_STATE: Partial<Record<StepId, "working" | "idle">> = { download: "working", start: "working" };

export function StoryOnboarding({ flow }: { flow: Onboarding }) {
  const { step } = flow.state;
  const Demo = DEMOS[step];
  const hero = !Demo;

  return (
    <main className="ob story dark">
      <div className="story__light" aria-hidden="true" />
      <header className="story__top">
        <span className="story__brand">
          <span className="story__mark" aria-hidden="true" />
          <span className="ui">AutoGPT</span>
        </span>
        <Framing step={step} />
      </header>

      <LayoutGroup>
        {hero ? (
          <Hero flow={flow} />
        ) : (
          <div className="story__split">
            <AnimatePresence mode="wait" initial={false}>
              <StoryCopy key={step} flow={flow} step={step} />
            </AnimatePresence>
            <div className="story__demo">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={step}
                  className="story__demo-inner"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }}
                  transition={springSlow}
                >
                  {Demo && <Demo flow={flow} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </LayoutGroup>
    </main>
  );
}

function StoryCopy({ flow, step }: { flow: Onboarding; step: StepId }) {
  const enter = useEnterExit(16);
  const heading = useRef<HTMLHeadingElement>(null);
  useStepFocus(heading, flow.state.moved);
  const copy = STEPS[step];

  return (
    <motion.section className="story__copy" aria-labelledby="story-title" variants={stagger(0.08)} initial="hidden" animate="show" exit="exit">
      <motion.div layoutId="story-guide" className="story__guide" transition={springSlow}>
        <AgentAvatar character="auto" size={56} state={GUIDE_STATE[step] ?? "idle"} theme="dark" decorative />
      </motion.div>
      <motion.h1 id="story-title" ref={heading} tabIndex={-1} className="ob-hero" variants={enter}>
        {copy.title}
      </motion.h1>
      <motion.p className="ob-lead story__lead" variants={enter}>
        {copy.description}
      </motion.p>
      {step === "brain" && (
        <motion.div variants={enter}>
          <BrainInput flow={flow} />
        </motion.div>
      )}
      <motion.div className="story__actions" variants={enter}>
        <Button size="lg" disabled={!flow.canContinue} onClick={flow.next} iconRight={<Icon icon={ArrowRight01Icon} />}>
          {copy.action}
        </Button>
        <Button variant="ghost" size="lg" icon={<Icon icon={ArrowLeft01Icon} />} onClick={flow.back}>
          Back
        </Button>
      </motion.div>
    </motion.section>
  );
}
