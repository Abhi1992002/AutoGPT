import { AnimatePresence, motion } from "framer-motion";
import { AgentAvatar, type AgentState } from "../../../components/AgentAvatar";
import { useAgentMood } from "../../core/hooks";
import { useEnterExit } from "../../core/motion";
import type { StepId } from "../../core/steps";
import type { Onboarding } from "../../core/useOnboarding";

/** What Otto says above the headline, by step and by what it's doing */
function line(step: StepId, flow: Onboarding, mood: AgentState): string {
  const { download, start } = flow.state;
  switch (step) {
    case "download":
      return download.phase === "done" ? "Got everything I need" : download.phase === "error" ? "The download stopped" : "Fetching the engine for you";
    case "start":
      return start.phase === "healthy" ? "Everything’s running" : start.phase === "error" ? "Something didn’t start" : "Warming up the services";
    case "tour":
      return "Here’s what my team can do";
    case "connect":
      return "Pick the tools you use, and we’ll work in them";
    case "brain":
      return mood === "working" ? "Taking notes…" : "I’m listening";
    default:
      return "";
  }
}

/** Otto as a one-line narrator: avatar, name and what it's doing right now */
export function Narrator({ flow, step }: { flow: Onboarding; step: StepId }) {
  const mood = useAgentMood(flow.state.brain);
  const { download, start } = flow.state;
  const busy = (step === "download" && download.phase === "running") || (step === "start" && (start.phase === "running" || start.phase === "checking"));
  const state: AgentState = step === "brain" ? (mood === "working" ? "working" : "idle") : busy ? "working" : "idle";
  const text = line(step, flow, state);
  const enter = useEnterExit(4);

  return (
    <p className="story-narrator" aria-live="polite">
      <AgentAvatar character="otto" size={20} state={state} decorative />
      <span className="ob-label">Otto</span>
      <span className="story-narrator__line">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={text} variants={enter} initial="hidden" animate="show" exit="exit">
            {text}
          </motion.span>
        </AnimatePresence>
      </span>
    </p>
  );
}
