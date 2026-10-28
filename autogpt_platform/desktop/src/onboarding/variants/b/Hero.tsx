import { ArrowRight01Icon, Calendar03Icon, CheckListIcon, GithubIcon, Mail01Icon, Note01Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { motion } from "framer-motion";
import { useMemo, useRef } from "react";
import type { CharacterId } from "../../../assets/avatars";
import { characters } from "../../../assets/avatars";
import { AgentAvatar } from "../../../components/AgentAvatar";
import { Button } from "../../../design-system/components/button";
import { useStepFocus } from "../../core/hooks";
import { stagger, useEnterExit } from "../../core/motion";
import { STEPS } from "../../core/steps";
import { understand } from "../../core/understand";
import type { Onboarding } from "../../core/useOnboarding";
import { ExpertStack } from "../../ui/ExpertStack";
import { Icon } from "../../ui/Icon";
import { StatusMark } from "../../ui/StatusMark";
import { Window } from "./Window";

type FeedItem = { character: CharacterId; icon: IconSvgElement; text: string; meta: string; drafting?: boolean };

/** Finished work the experts show off on the first screen */
const TODAY: FeedItem[] = [
  { character: "kai", icon: Mail01Icon, text: "Sorted 42 emails and drafted 6 replies", meta: "8:02" },
  { character: "alex", icon: GithubIcon, text: "Reviewed PR #128 and left 3 notes", meta: "9:15" },
  { character: "james", icon: Note01Icon, text: "Posted the standup summary to #team", meta: "9:30" },
];

/** Starter agents when the brief is empty */
const STARTERS: FeedItem[] = [
  { character: "kai", icon: Mail01Icon, text: "Morning inbox sort", meta: "Template", drafting: true },
  { character: "frankie", icon: Calendar03Icon, text: "Meeting prep notes", meta: "Template", drafting: true },
];

/** Welcome and done: a centred headline over a window of agent work */
export function Hero({ flow }: { flow: Onboarding }) {
  const { step } = flow.state;
  const done = step === "done";
  const copy = STEPS[step];
  const enter = useEnterExit(8);
  const heading = useRef<HTMLHeadingElement>(null);
  useStepFocus(heading, flow.state.moved);
  const { tasks } = useMemo(() => understand(flow.state.brain), [flow.state.brain]);

  const items: FeedItem[] = done
    ? tasks.length
      ? tasks.map((t) => ({ character: t.character, icon: t.icon, text: t.title, meta: t.when ?? "On demand", drafting: true }))
      : STARTERS
    : TODAY;

  return (
    <motion.section className="story-hero" aria-labelledby="story-title" variants={stagger(0.06)} initial="hidden" animate="show" exit="exit">
      <motion.div className="story-hero__cast" variants={enter}>
        <AgentAvatar character="otto" size={48} decorative />
        <ExpertStack ids={items.map((i) => i.character)} size={28} />
      </motion.div>
      <motion.h1 id="story-title" ref={heading} tabIndex={-1} className="ob-hero" variants={enter}>
        {copy.title}
      </motion.h1>
      <motion.p className="ob-lead story__lead" variants={enter}>
        {copy.description}
      </motion.p>
      <motion.div className="story-hero__actions" variants={enter}>
        <Button size="lg" onClick={flow.next} iconRight={<Icon icon={ArrowRight01Icon} />}>
          {copy.action}
        </Button>
        {!done && <span className="ob-meta">Takes about three minutes</span>}
      </motion.div>
      <motion.div className="story-hero__window" variants={enter}>
        <Window icon={done ? SparklesIcon : CheckListIcon} title={done ? "Otto is drafting" : "Done today"} meta={done ? `${items.length} agents` : "While you were away"}>
          <ul className="story-feed">
            {items.map((item) => (
              <li key={item.text} className="story-feed__row">
                <AgentAvatar character={item.character} size={24} decorative />
                <span className="ob-label story-feed__who">{characters[item.character].name}</span>
                <Icon icon={item.icon} size={14} className="story-feed__icon" />
                <span className="ob-text ob-truncate">{item.text}</span>
                <span className="story-feed__end">
                  {item.drafting ? <StatusMark mark="active" label="Drafting" /> : <StatusMark mark="done" label="Done" />}
                  <span className="ob-meta ob-num">{item.meta}</span>
                </span>
              </li>
            ))}
          </ul>
        </Window>
      </motion.div>
    </motion.section>
  );
}
