import { AnimatePresence, motion } from "framer-motion";
import { AgentAvatar, type AgentState } from "../../../components/AgentAvatar";
import { useAgentMood } from "../../core/hooks";
import { springSlow, useEnterExit } from "../../core/motion";
import type { StepId } from "../../core/steps";
import type { Onboarding } from "../../core/useOnboarding";

/** What Auto says beside the headline, by step and by what it's doing */
function line(step: StepId, flow: Onboarding, mood: AgentState): string {
  const { download, start } = flow.state;
  switch (step) {
    case "download":
      return download.phase === "done" ? "Got everything I need" : download.phase === "error" ? "The download stopped" : "Fetching the engine for you";
    case "start":
      return start.phase === "healthy" ? "Everything’s running" : start.phase === "error" ? "Something didn’t start" : "Warming up the services";
    case "tour":
      return "Here’s what I can do";
    case "connect":
      return "Pick the tools you use – I’ll work in them";
    case "brain":
      return mood === "working" ? "Taking notes…" : mood === "sleeping" ? "Dozing – start typing to wake me" : "I’m listening";
    default:
      return "";
  }
}

/** Auto as the guide: large enough to read, working while the engine installs, listening on the brain dump */
export function StoryGuide({ flow, step }: { flow: Onboarding; step: StepId }) {
  const mood = useAgentMood(flow.state.brain);
  const { download, start } = flow.state;
  const busy = (step === "download" && download.phase === "running") || (step === "start" && (start.phase === "running" || start.phase === "checking"));
  const state: AgentState = step === "brain" ? mood : busy ? "working" : "idle";
  const text = line(step, flow, state);
  const enter = useEnterExit(6);

  return (
    <div className="story-guide">
      <motion.div layoutId="story-guide" className="story__guide" transition={springSlow}>
        <AgentAvatar character="auto" size={88} state={state} theme="dark" interactive decorative />
      </motion.div>
      <div className="story-guide__bubble">
        <p className="small story-guide__name">Auto</p>
        <p className="ui story-guide__line" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={text} className="story-guide__text" variants={enter} initial="hidden" animate="show" exit="exit">
              {text}
            </motion.span>
          </AnimatePresence>
        </p>
      </div>
    </div>
  );
}
