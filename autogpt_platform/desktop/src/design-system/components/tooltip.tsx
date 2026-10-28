import { useId, type ReactNode } from "react";

/*
 * Tooltip – the small dark label of AffectUI's Message Actions: above (or below) its trigger,
 * on hover after a beat (380ms), at once on keyboard focus. Pure CSS, no positioning library.
 */

export type TooltipProps = {
  /** The tooltip text */
  content: ReactNode;
  /** The element it describes – a focusable element gets the tooltip on keyboard focus too */
  children: ReactNode;
  side?: "top" | "bottom";
  className?: string;
};

export function Tooltip({ content, children, side = "top", className }: TooltipProps) {
  const id = useId();
  return (
    <>
      <style href="ui-tooltip" precedence="default">
        {css}
      </style>
      <span className={["ui-tooltip", className].filter(Boolean).join(" ")} data-side={side}>
        <span className="ui-tooltip__anchor" aria-describedby={id}>
          {children}
        </span>
        <span className="ui-tooltip__tip" role="tooltip" id={id}>
          {content}
        </span>
      </span>
    </>
  );
}

const css = /* css */ `
.ui-tooltip {
  --ui-tip-bg: #171717;
  --ui-tip-text: #ffffff;
  --ui-tip-ease: cubic-bezier(0.32, 0.72, 0.24, 1);
  position: relative;
  display: inline-flex;
  vertical-align: middle;
}
.ui-tooltip__anchor { display: inline-flex; min-width: 0; }
.ui-tooltip__tip {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  z-index: 3;
  display: block;
  width: max-content;
  max-width: 240px;
  padding: 3px 7px;
  border-radius: 6px;
  background: var(--ui-tip-bg);
  font: 500 11.5px/16px var(--font-sans);
  color: var(--ui-tip-text);
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: translate(-50%, 3px);
  transition: opacity 140ms ease, transform 200ms var(--ui-tip-ease);
}
.ui-tooltip[data-side="bottom"] .ui-tooltip__tip { bottom: auto; top: calc(100% + 6px); transform: translate(-50%, -3px); }
.ui-tooltip:has(:focus-visible) .ui-tooltip__tip { opacity: 1; transform: translate(-50%, 0); transition-delay: 0ms; }
@media (hover: hover) {
  .ui-tooltip:hover .ui-tooltip__tip { opacity: 1; transform: translate(-50%, 0); transition-delay: 380ms; }
}
@media (prefers-reduced-motion: reduce) { .ui-tooltip__tip { transition: opacity 1ms; } }

:where(.dark, [data-theme="dark"]) .ui-tooltip { --ui-tip-bg: #ededed; --ui-tip-text: #171717; }
`;
