import type { CSSProperties } from "react";
import { characters, tileFor, type CharacterId } from "../assets/avatars";

/*
 * AgentAvatar – the one place the app renders an agent character: the character's own tile, round,
 * with a hairline ring. The artwork is never tinted; state shows as a small dot on the edge.
 */

export type AgentState = "idle" | "working" | "sleeping";

export type AgentAvatarProps = {
  character?: CharacterId;
  state?: AgentState;
  /** px */
  size?: number;
  /** Hidden from assistive tech when the surrounding text already says who this is */
  decorative?: boolean;
  className?: string;
};

const SAY: Record<AgentState, string> = { idle: "ready", working: "working", sleeping: "idle" };

export function AgentAvatar({ character = "otto", state = "idle", size = 32, decorative = false, className }: AgentAvatarProps) {
  const c = characters[character];
  return (
    <>
      <style href="agent-avatar" precedence="default">
        {css}
      </style>
      <span
        className={["agent-avatar", className].filter(Boolean).join(" ")}
        data-state={state}
        style={{ "--av-size": `${size}px` } as CSSProperties}
        role={decorative ? undefined : "img"}
        aria-label={decorative ? undefined : `${c.name}, ${SAY[state]}`}
        aria-hidden={decorative || undefined}
      >
        <img className="agent-avatar__img" src={tileFor(character, size)} alt="" width={size} height={size} draggable={false} />
        {state !== "idle" && <span className="agent-avatar__dot" />}
      </span>
    </>
  );
}

const css = /* css */ `
.agent-avatar {
  --av-ring: oklch(0 0 0 / 0.1);
  --av-cut: var(--ob-canvas, var(--ds-surface));
  position: relative;
  display: inline-block;
  flex: none;
  width: var(--av-size);
  height: var(--av-size);
  vertical-align: middle;
}
.agent-avatar__img {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  outline: 1px solid var(--av-ring);
  outline-offset: -1px;
  user-select: none;
}
.agent-avatar__dot {
  position: absolute;
  inset-block-end: 0;
  inset-inline-end: 0;
  width: max(8px, calc(var(--av-size) * 0.2));
  height: max(8px, calc(var(--av-size) * 0.2));
  border-radius: 50%;
  background: var(--ds-faint);
  box-shadow: 0 0 0 2px var(--av-cut);
}
.agent-avatar[data-state="working"] .agent-avatar__dot { background: var(--ds-accent); animation: agent-avatar-pulse 1.4s ease-in-out infinite; }
@keyframes agent-avatar-pulse { 50% { opacity: 0.45; } }
@media (prefers-reduced-motion: reduce) { .agent-avatar__dot { animation: none !important; } }
:where(.dark, [data-theme="dark"]) .agent-avatar { --av-ring: oklch(1 0 0 / 0.1); }
`;
