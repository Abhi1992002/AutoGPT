import { motion, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { AgentAvatar } from "../../../../components/AgentAvatar";
import { SUGGESTIONS } from "../../../core/data";
import { useAgentMood, useStepFocus } from "../../../core/hooks";
import { springSlow } from "../../../core/motion";
import { STEPS } from "../../../core/steps";
import type { ConsolePanelProps } from "../ConsoleOnboarding";

const HINT = { idle: "Auto is listening", working: "Auto is taking notes", sleeping: "Auto dozed off. Start typing to wake it." };

/** A minimal "say a few words" prompt around a soft orb that brightens while you type */
export function BrainPanel({ flow }: ConsolePanelProps) {
  const text = flow.state.brain;
  const mood = useAgentMood(text);
  const reduce = useReducedMotion();
  const heading = useRef<HTMLHeadingElement>(null);
  useStepFocus(heading, flow.state.moved);
  const add = (line: string) => flow.setBrain(text.trim() ? `${text.trim()}\n${line}` : line);
  const unused = SUGGESTIONS.filter((s) => !text.includes(s.text)).slice(0, 3);

  return (
    <div className="con-duet">
      <motion.div className="con-orb" data-mood={mood} animate={reduce ? undefined : { scale: mood === "working" ? 1.08 : mood === "sleeping" ? 0.94 : 1 }} transition={springSlow}>
        <span className="con-orb__glow" aria-hidden="true" />
        <AgentAvatar character="auto" size={120} state={mood} decorative />
      </motion.div>
      <div className="con-duet__copy">
        <h1 id="con-title" ref={heading} tabIndex={-1} className="ob-display">
          Say a few words about you
        </h1>
        <p className="ob-lead text-muted">{STEPS.brain.description}</p>
      </div>
      <div className="con-duet__field">
        <label htmlFor="con-brain" className="ob-sr">
          About you and what your agents should do
        </label>
        <textarea
          id="con-brain"
          rows={3}
          value={text}
          placeholder="I lead a support team of six. Mornings are a blur of tickets and Slack threads…"
          onChange={(e) => flow.setBrain(e.target.value)}
        />
        <p className="small text-subtle" role="status">
          {HINT[mood]}
        </p>
      </div>
      {unused.length > 0 && (
        <div className="con-duet__chips" role="group" aria-label="Suggestions">
          {unused.map((s) => (
            <button key={s.label} type="button" className="con-chip small" onClick={() => add(s.text)}>
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
