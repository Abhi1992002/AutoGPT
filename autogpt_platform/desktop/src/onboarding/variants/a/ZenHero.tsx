import type { BotAvatarHat } from "bot-avatars";
import { motion, useReducedMotion } from "framer-motion";
import { AgentAvatar } from "../../../components/AgentAvatar";
import type { Integration } from "../../core/data";
import { Icon } from "../../ui/Icon";

/** Where the tool tiles sit on the orbit, as % of the stage, and how they drift */
const SLOTS = [
  { x: 8, y: 40, drift: 5.2 },
  { x: 92, y: 36, drift: 5.6 },
  { x: 50, y: 3, drift: 7.2 },
  { x: 17, y: 88, drift: 6.1 },
  { x: 83, y: 90, drift: 6.6 },
];

/**
 * The welcome and done illustration: Auto with Scout and Tempo, tools floating on an orbit around
 * them. Still under reduced motion and in frozen previews.
 */
export function ZenHero({ tools, hat, still }: { tools: Integration[]; hat?: BotAvatarHat; still: boolean }) {
  const reduce = useReducedMotion();
  const float = !still && !reduce;

  return (
    <div className="zen-hero" aria-hidden="true">
      <svg className="zen-hero__orbit" viewBox="0 0 560 220" preserveAspectRatio="none">
        <ellipse cx="280" cy="112" rx="236" ry="86" />
        <ellipse cx="280" cy="112" rx="168" ry="58" />
      </svg>
      {tools.slice(0, SLOTS.length).map((tool, i) => {
        const slot = SLOTS[i];
        return (
          <motion.span
            key={tool.id}
            className="zen-hero__tool"
            data-slot={i}
            style={{ insetInlineStart: `${slot.x}%`, insetBlockStart: `${slot.y}%` }}
            animate={float ? { y: [0, -7, 0] } : undefined}
            transition={float ? { duration: slot.drift, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 } : undefined}
          >
            <Icon icon={tool.icon} size={20} />
          </motion.span>
        );
      })}
      <div className="zen-hero__cast">
        <Floating float={float} delay={0.6} className="zen-hero__side">
          <AgentAvatar character="scout" size={84} decorative />
        </Floating>
        <Floating float={float} delay={0} className="zen-hero__lead">
          <AgentAvatar character="auto" size={136} hat={hat} interactive decorative />
        </Floating>
        <Floating float={float} delay={1.2} className="zen-hero__side">
          <AgentAvatar character="tempo" size={84} decorative />
        </Floating>
      </div>
    </div>
  );
}

function Floating({ float, delay, className, children }: { float: boolean; delay: number; className: string; children: React.ReactNode }) {
  return (
    <motion.div
      className={className}
      animate={float ? { y: [0, -5, 0] } : undefined}
      transition={float ? { duration: 4.8, repeat: Infinity, ease: "easeInOut", delay } : undefined}
    >
      {children}
    </motion.div>
  );
}
