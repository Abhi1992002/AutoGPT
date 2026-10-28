import { Add01Icon } from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "framer-motion";
import { AgentAvatar } from "../../../../components/AgentAvatar";
import { SUGGESTIONS } from "../../../core/data";
import { useAgentMood } from "../../../core/hooks";
import { springFast, useEnterExit } from "../../../core/motion";
import { Icon } from "../../../ui/Icon";
import type { StoryDemoProps } from "../StoryOnboarding";

/** What Auto picks up from the brain dump, shown live as notes */
const TOPICS: { note: string; match: RegExp }[] = [
  { note: "Email triage", match: /\b(e-?mail|inbox|gmail)/i },
  { note: "GitHub", match: /\b(github|pull request|pr\b|repo)/i },
  { note: "Slack", match: /\bslack/i },
  { note: "Linear", match: /\blinear/i },
  { note: "Weekly report", match: /\b(weekly|every friday|team update)/i },
  { note: "Daily schedule", match: /\b(every (morning|day|weekday)|daily|at \d)/i },
  { note: "Research", match: /\b(research|papers?|competitor|sources)/i },
  { note: "Invoices", match: /\b(invoice|billing|finance)/i },
  { note: "Small team", match: /\b(startup|studio|founder|team of|\d+-person)/i },
];

const MOOD = { idle: "Listening", working: "Taking notes", sleeping: "Dozing – start typing to wake Auto" };

export function BrainDemo({ flow }: StoryDemoProps) {
  const mood = useAgentMood(flow.state.brain);
  const notes = TOPICS.filter((t) => t.match.test(flow.state.brain)).map((t) => t.note);
  const enter = useEnterExit(8);

  return (
    <div className="story-panel story-brain">
      <AgentAvatar character="auto" size={132} state={mood} theme="dark" interactive decorative />
      <p className="ui story-brain__mood" role="status">
        {MOOD[mood]}
      </p>
      <div className="story-brain__notes">
        <p className="eyebrow story__muted">Auto’s notes</p>
        <ul aria-label="Auto’s notes">
          <AnimatePresence initial={false} mode="popLayout">
            {notes.length === 0 ? (
              <motion.li key="empty" className="small story__muted story-brain__empty" variants={enter} initial="hidden" animate="show" exit="exit">
                Notes appear as you write
              </motion.li>
            ) : (
              notes.map((note) => (
                <motion.li key={note} layout className="story-note small" variants={enter} initial="hidden" animate="show" exit="exit" transition={springFast}>
                  {note}
                </motion.li>
              ))
            )}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  );
}

export function BrainInput({ flow }: StoryDemoProps) {
  const text = flow.state.brain;
  const add = (line: string) => flow.setBrain(text.trim() ? `${text.trim()}\n${line}` : line);
  const unused = SUGGESTIONS.filter((s) => !text.includes(s.text)).slice(0, 4);

  return (
    <div className="story-input">
      <label htmlFor="story-brain" className="ob-sr">
        About you and what your agents should do
      </label>
      <textarea
        id="story-brain"
        className="story-input__field"
        rows={3}
        value={text}
        placeholder="I’m a product manager. Every Friday I write the team update from Linear…"
        onChange={(e) => flow.setBrain(e.target.value)}
      />
      {unused.length > 0 && (
        <div className="story-chips" role="group" aria-label="Suggestions">
          {unused.map((s) => (
            <button key={s.label} type="button" className="story-chip small" onClick={() => add(s.text)}>
              <Icon icon={Add01Icon} size={14} />
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
