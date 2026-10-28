import { BotAvatar, type BotAvatarHat } from "bot-avatars";
import { characters, type CharacterId } from "../assets/avatars";

/*
 * AgentAvatar – the one place the app renders an agent character.
 * Characters come from src/assets/avatars; the drawing library stays behind this component.
 */

export type AgentState = "idle" | "working" | "sleeping";

export type AgentAvatarProps = {
  character?: CharacterId;
  state?: AgentState;
  /** px */
  size?: number;
  /** Overrides the character's own hat, e.g. a party hat on the last screen */
  hat?: BotAvatarHat;
  /** The surface it sits on, so the ink and shading read against it */
  theme?: "auto" | "light" | "dark";
  /** Follows the pointer and hops on click */
  interactive?: boolean;
  /** Hidden from assistive tech when the surrounding text already says who this is */
  decorative?: boolean;
  className?: string;
};

const STATES = { idle: "default", working: "working", sleeping: "sleeping" } as const;

export function AgentAvatar({
  character = "auto",
  state = "idle",
  size = 64,
  hat,
  theme = "auto",
  interactive = false,
  decorative = false,
  className,
}: AgentAvatarProps) {
  const c = characters[character];
  return (
    <BotAvatar
      type={c.type}
      color={c.color}
      ink={c.ink}
      brightness={c.brightness}
      hat={hat ?? c.hat}
      glasses={c.glasses}
      headphones={c.headphones}
      state={STATES[state]}
      size={size}
      theme={theme}
      interactive={interactive}
      className={className}
      aria-label={decorative ? undefined : `${c.name}, ${state === "idle" ? "ready" : state}`}
      aria-hidden={decorative || undefined}
      role={decorative ? "presentation" : "img"}
    />
  );
}
