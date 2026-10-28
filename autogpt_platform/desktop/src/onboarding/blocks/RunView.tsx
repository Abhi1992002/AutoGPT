import { Tick02Icon } from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "framer-motion";
import { characters } from "../../assets/avatars";
import { AgentAvatar } from "../../components/AgentAvatar";
import type { Capability } from "../core/data";
import { useRunPlayback } from "../core/hooks";
import { useEnterExit } from "../core/motion";
import { Icon } from "../ui/Icon";
import { StatusMark } from "../ui/StatusMark";

/** One capability as a short agent run: who runs it, the request, its steps and the result */
export function RunView({ capability, freeze, stepMs }: { capability: Capability; freeze: boolean; stepMs?: number }) {
  const { shown, done, isFinished } = useRunPlayback(capability.id, capability.run.length, { freeze, stepMs });
  const line = useEnterExit(4);
  const agent = characters[capability.character];

  return (
    <div className="ob-run">
      <div className="ob-run__head">
        <AgentAvatar character={capability.character} size={28} state={done ? "idle" : "working"} decorative />
        <span className="ob-run__who">
          <span className="ob-label">{agent.name}</span>
          <span className="ob-meta">{agent.role} agent</span>
        </span>
        <span className="ob-tag ob-run__status" data-done={done || undefined}>
          {done ? "Done" : "Running"}
        </span>
      </div>
      <p className="ob-run__prompt">{capability.prompt}</p>
      <ol className="ob-run__steps" aria-label="Agent steps">
        <AnimatePresence initial={false}>
          {capability.run.slice(0, shown).map((step, i) => (
            <motion.li key={`${capability.id}-${step}`} className="ob-run__step" variants={line} initial="hidden" animate="show" exit="exit">
              <StatusMark mark={isFinished(i) ? "done" : "active"} />
              <span className="ob-text">{step}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
      <p className="ob-run__result" data-visible={done || undefined} aria-live="polite">
        <Icon icon={Tick02Icon} size={14} strokeWidth={2} />
        <span>{done ? capability.result : ""}</span>
      </p>
    </div>
  );
}
