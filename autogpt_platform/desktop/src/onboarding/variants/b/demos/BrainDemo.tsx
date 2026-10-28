import { Add01Icon, AiMagicIcon, Clock01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, type ReactNode } from "react";
import { SUGGESTIONS } from "../../../core/data";
import { springFast, useEnterExit } from "../../../core/motion";
import { understand } from "../../../core/understand";
import { Icon } from "../../../ui/Icon";
import type { StoryDemoProps } from "../StoryOnboarding";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** "What Auto understood": fills with who you are, your tools and the agents worth drafting as you type */
export function BrainDemo({ flow }: StoryDemoProps) {
  const { about, tools, tasks } = useMemo(() => understand(flow.state.brain), [flow.state.brain]);
  const enter = useEnterExit(8);
  const found = about.length + tools.length + tasks.length;
  const status = found === 0 ? "Nothing yet – start typing on the left" : `Picked up ${plural(tasks.length, "task", "tasks")} and ${plural(tools.length, "tool", "tools")}`;
  const item = { variants: enter, initial: "hidden", animate: "show", exit: "exit", transition: springFast, layout: true } as const;

  return (
    <div className="story-panel story-brain">
      <header className="story-brain__head">
        <span className="story-brain__icon" aria-hidden="true">
          <Icon icon={AiMagicIcon} size={20} />
        </span>
        <div>
          <h2 className="title">What Auto understood</h2>
          <p className="small story__muted ob-num" role="status">
            {status}
          </p>
        </div>
      </header>

      <Section title="About you" empty="Your role and team">
        {about.map((label) => (
          <motion.li key={label} className="story-note ui" {...item}>
            {label}
          </motion.li>
        ))}
      </Section>

      <Section title="Tools it will use" empty="Apps you mention">
        {tools.map((tool) => {
          const connected = flow.state.integrations[tool.id] === "connected";
          return (
            <motion.li key={tool.id} className="story-note story-note--tool ui" {...item}>
              <Icon icon={tool.icon} size={16} />
              {tool.name}
              {connected && (
                <span className="story-note__ok" title="Connected">
                  <Icon icon={Tick02Icon} size={12} strokeWidth={2.5} label="connected" />
                </span>
              )}
            </motion.li>
          );
        })}
      </Section>

      <Section title="Agents to draft" empty="Tasks you’d hand off" rows>
        {tasks.map((task) => (
          <motion.li key={task.id} className="story-task-row" {...item}>
            <span className="story-task-row__icon">
              <Icon icon={task.icon} size={18} />
            </span>
            <span className="ui story-task-row__title">{task.title}</span>
            {task.when && (
              <span className="small story-task-row__when">
                <Icon icon={Clock01Icon} size={14} />
                {task.when}
              </span>
            )}
          </motion.li>
        ))}
      </Section>
    </div>
  );
}

function Section({ title, empty, rows, children }: { title: string; empty: string; rows?: boolean; children: ReactNode[] }) {
  const enter = useEnterExit(8);
  return (
    <section className="story-brain__section">
      <h3 className="eyebrow story__muted">{title}</h3>
      <ul className={rows ? "story-brain__rows" : "story-brain__chips"} aria-label={title}>
        <AnimatePresence initial={false} mode="popLayout">
          {children.length > 0 ? (
            children
          ) : (
            <motion.li key="empty" className={rows ? "story-brain__ghost story-brain__ghost--row small" : "story-brain__ghost small"} variants={enter} initial="hidden" animate="show" exit="exit">
              {empty}
            </motion.li>
          )}
        </AnimatePresence>
      </ul>
    </section>
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
        aria-describedby="story-brain-hint"
        onChange={(e) => flow.setBrain(e.target.value)}
      />
      <p id="story-brain-hint" className="ob-sr">
        Press Control or Command plus Enter to continue.
      </p>
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
