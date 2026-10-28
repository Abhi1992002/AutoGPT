import { Clock01Icon } from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, type ReactNode } from "react";
import { AgentAvatar } from "../../components/AgentAvatar";
import { springFast, useEnterExit } from "../core/motion";
import { understand } from "../core/understand";
import type { Onboarding } from "../core/useOnboarding";
import { Icon } from "../ui/Icon";
import { StatusMark } from "../ui/StatusMark";

/** What Otto took from the brain dump, filling in as you type: who you are, your tools and the agents to draft */
export function Understood({ flow }: { flow: Onboarding }) {
  const { about, tools, tasks } = useMemo(() => understand(flow.state.brain), [flow.state.brain]);
  const enter = useEnterExit(4);
  const item = { variants: enter, initial: "hidden", animate: "show", exit: "exit", transition: springFast, layout: "position" } as const;

  return (
    <div className="ob-understood">
      <Section title="About you" empty="Your role and team">
        {about.map((label) => (
          <motion.li key={label} className="ob-tag" {...item}>
            {label}
          </motion.li>
        ))}
      </Section>
      <Section title="Tools" empty="Apps you mention">
        {tools.map((tool) => (
          <motion.li key={tool.id} className="ob-tag" {...item}>
            <Icon icon={tool.icon} size={12} />
            {tool.name}
            {flow.state.integrations[tool.id] === "connected" && <StatusMark mark="done" label="connected" />}
          </motion.li>
        ))}
      </Section>
      <Section title="Agents to draft" empty="Tasks you’d hand off" rows>
        {tasks.map((task) => (
          <motion.li key={task.id} className="ob-understood__task" {...item}>
            <AgentAvatar character={task.character} size={24} decorative />
            <span className="ob-label ob-truncate">{task.title}</span>
            {task.when && (
              <span className="ob-meta ob-understood__when">
                <Icon icon={Clock01Icon} size={12} />
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
  const enter = useEnterExit(4);
  return (
    <section className="ob-understood__section">
      <h3 className="ob-micro">{title}</h3>
      <ul className={rows ? "ob-understood__rows" : "ob-understood__tags"} aria-label={title}>
        <AnimatePresence initial={false} mode="popLayout">
          {children.length > 0 ? (
            children
          ) : (
            <motion.li key="empty" className="ob-understood__empty ob-meta" data-rows={rows || undefined} variants={enter} initial="hidden" animate="show" exit="exit">
              {empty}
            </motion.li>
          )}
        </AnimatePresence>
      </ul>
    </section>
  );
}
