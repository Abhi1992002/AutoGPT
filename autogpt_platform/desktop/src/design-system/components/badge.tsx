import type { ReactNode } from "react";

/*
 * Badge – small labels and status pills.
 * Tones take their colours from AffectUI: neutral (notification-stack badge), accent (segmented-control badge),
 * warning and success (email-draft status), danger (profile-menu badge), purple (smart-recommendation pill).
 */

export type BadgeProps = {
  children: ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning" | "danger" | "purple";
  /** "pill" = fully round ends, "tag" = 8px corners, "eyebrow" = uppercase white tag with a hairline */
  variant?: "pill" | "tag" | "eyebrow";
  /** A coloured dot in front of the label, e.g. for a status */
  dot?: boolean;
  className?: string;
};

export function Badge({ children, tone = "neutral", variant = "pill", dot = false, className }: BadgeProps) {
  return (
    <>
      <style href="ui-badge" precedence="default">
        {css}
      </style>
      <span className={["ui-badge", className].filter(Boolean).join(" ")} data-tone={tone} data-variant={variant}>
        {dot && <span className="ui-badge__dot" aria-hidden="true" />}
        <span className="ui-badge__label">{children}</span>
      </span>
    </>
  );
}

const css = /* css */ `
.ui-badge {
  --ui-badge-bg: #f3f3f3;
  --ui-badge-text: #525252;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--ui-badge-bg);
  font: 500 12px/18px var(--font-sans);
  color: var(--ui-badge-text);
  white-space: nowrap;
  vertical-align: middle;
}
.ui-badge__label { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.ui-badge__dot { flex: none; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.ui-badge[data-variant="tag"] { border-radius: 8px; font-size: 12.5px; }
.ui-badge[data-variant="eyebrow"] {
  padding: 2px 9px;
  background: var(--ds-surface);
  box-shadow: inset 0 0 0 1px var(--ds-line);
  font: 500 11px/18px var(--font-sans);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #525252;
}
.ui-badge[data-tone="accent"] { --ui-badge-bg: var(--ds-accent-soft); --ui-badge-text: var(--ds-accent); }
.ui-badge[data-tone="success"] { --ui-badge-bg: #e8f5e6; --ui-badge-text: #2f7d32; }
.ui-badge[data-tone="warning"] { --ui-badge-bg: #fdeedd; --ui-badge-text: #c2570c; }
.ui-badge[data-tone="danger"] { --ui-badge-bg: #fff0f3; --ui-badge-text: #e11d48; }
.ui-badge[data-tone="purple"] { --ui-badge-bg: #f4f0ff; --ui-badge-text: #7c4dff; }

:where(.dark, [data-theme="dark"]) .ui-badge { --ui-badge-bg: #2a2a2d; --ui-badge-text: #c4c4c4; }
:where(.dark, [data-theme="dark"]) .ui-badge[data-variant="eyebrow"] { background: #2a2a2d; color: #c4c4c4; }
:where(.dark, [data-theme="dark"]) .ui-badge[data-tone="accent"] { --ui-badge-bg: var(--ds-accent-soft); --ui-badge-text: var(--ds-accent); }
:where(.dark, [data-theme="dark"]) .ui-badge[data-tone="success"] { --ui-badge-bg: rgba(42, 157, 92, 0.16); --ui-badge-text: #4cc38a; }
:where(.dark, [data-theme="dark"]) .ui-badge[data-tone="warning"] { --ui-badge-bg: rgba(251, 154, 75, 0.16); --ui-badge-text: #fb9a4b; }
:where(.dark, [data-theme="dark"]) .ui-badge[data-tone="danger"] { --ui-badge-bg: rgba(225, 29, 72, 0.16); --ui-badge-text: #fb7185; }
:where(.dark, [data-theme="dark"]) .ui-badge[data-tone="purple"] { --ui-badge-bg: rgba(124, 77, 255, 0.18); --ui-badge-text: #b39dff; }
`;
