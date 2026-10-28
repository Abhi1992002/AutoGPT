import { ArrowRight01Icon, GithubIcon, Mail01Icon, SlackIcon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { motion } from "framer-motion";
import { useRef } from "react";
import { AgentAvatar } from "../../../components/AgentAvatar";
import { Button } from "../../../design-system/components/button";
import { useStepFocus } from "../../core/hooks";
import { INTEGRATIONS } from "../../core/data";
import { springSlow, stagger, useEnterExit } from "../../core/motion";
import { STEPS } from "../../core/steps";
import type { Onboarding } from "../../core/useOnboarding";
import { Icon } from "../../ui/Icon";

/** Finished work Auto shows off on the first screen */
const TASKS: { icon: IconSvgElement; text: string; meta: string }[] = [
  { icon: Mail01Icon, text: "Sorted 42 emails, drafted 6 replies", meta: "Inbox · 8:02" },
  { icon: GithubIcon, text: "Reviewed PR #128 and left 3 notes", meta: "GitHub · 9:15" },
  { icon: SlackIcon, text: "Posted the standup summary", meta: "Slack · 9:30" },
];

/** Welcome and done: a centered stage with Auto large */
export function Hero({ flow }: { flow: Onboarding }) {
  const { step } = flow.state;
  const done = step === "done";
  const copy = STEPS[step];
  const enter = useEnterExit(16);
  const heading = useRef<HTMLHeadingElement>(null);
  useStepFocus(heading, flow.state.moved);
  const tools = INTEGRATIONS.filter((i) => flow.state.integrations[i.id] === "connected");

  return (
    <motion.section key={step} className="story-hero" aria-labelledby="story-title" variants={stagger(0.1)} initial="hidden" animate="show">
      <div className="story-hero__stage">
        <motion.div layoutId="story-guide" className="story__guide" transition={springSlow}>
          <AgentAvatar character="auto" size={168} hat={done ? "party" : undefined} theme="dark" interactive decorative />
        </motion.div>
        {!done && (
          <motion.ul className="story-hero__tasks" variants={stagger(0.12, 0.5)} aria-label="Things agents do">
            {TASKS.map((task, i) => (
              <motion.li key={task.text} className="story-task" data-slot={i} variants={enter}>
                <span className="story-task__icon">
                  <Icon icon={task.icon} size={16} />
                </span>
                <span className="story-task__text">
                  <span className="small">{task.text}</span>
                  <span className="caption story__muted">{task.meta}</span>
                </span>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>
      <motion.h1 id="story-title" ref={heading} tabIndex={-1} className="ob-hero" variants={enter}>
        {copy.title}
      </motion.h1>
      <motion.p className="ob-lead story__lead" variants={enter}>
        {copy.description}
      </motion.p>
      {done && tools.length > 0 && (
        <motion.ul className="story-hero__tools" variants={enter} aria-label="Connected tools">
          {tools.map((tool) => (
            <li key={tool.id} title={tool.name}>
              <Icon icon={tool.icon} size={16} label={tool.name} />
            </li>
          ))}
        </motion.ul>
      )}
      <motion.div className="story__actions story__actions--center" variants={enter}>
        <Button size="lg" onClick={flow.next} iconRight={<Icon icon={ArrowRight01Icon} />}>
          {copy.action}
        </Button>
      </motion.div>
    </motion.section>
  );
}
