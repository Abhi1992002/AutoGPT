import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import type { ReactNode } from "react";
import { Icon } from "./icon";

/*
 * Alert – an inline notice. Tones use the AffectUI status colours: info (accent), success and warning
 * (email-draft "ok" and "warn"), danger (tool-call-card red wash and line).
 */

export type AlertProps = {
  tone?: "info" | "success" | "warning" | "danger" | "neutral";
  title?: ReactNode;
  children?: ReactNode;
  /** Right side, e.g. a small button */
  action?: ReactNode;
  onDismiss?: () => void;
  icon?: ReactNode | false;
  className?: string;
};

const icons = { info: Info, success: CheckCircle2, warning: AlertTriangle, danger: AlertCircle, neutral: Info };

export function Alert({ tone = "info", title, children, action, onDismiss, icon, className }: AlertProps) {
  const Glyph = icons[tone];
  return (
    <>
      <style href="ui-alert" precedence="default">
        {css}
      </style>
      <div className={["ui-alert", className].filter(Boolean).join(" ")} data-tone={tone} role={tone === "danger" || tone === "warning" ? "alert" : "status"}>
        {icon !== false && (
          <span className="ui-alert__glyph" aria-hidden="true">
            {icon ?? <Icon icon={Glyph} size="sm" />}
          </span>
        )}
        <div className="ui-alert__body">
          {title != null && <p className="ui-alert__title">{title}</p>}
          {children != null && <div className="ui-alert__text">{children}</div>}
        </div>
        {action != null && <div className="ui-alert__action">{action}</div>}
        {onDismiss && (
          <button type="button" className="ui-alert__close" aria-label="Dismiss" onClick={onDismiss}>
            <Icon icon={X} size="xs" />
          </button>
        )}
      </div>
    </>
  );
}

const css = /* css */ `
.ui-alert {
  --ui-al-tone: var(--ds-accent-text);
  --ui-al-bg: #f5f8ff;
  --ui-al-line: rgba(47, 107, 255, 0.18);
  box-sizing: border-box;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  padding: 11px 12px;
  border: 1px solid var(--ui-al-line);
  border-radius: 12px;
  background: var(--ui-al-bg);
  font-family: var(--font-sans);
  color: var(--ds-ink);
}
.ui-alert[data-tone="success"] { --ui-al-tone: #2f7d32; --ui-al-bg: #e8f5e6; --ui-al-line: rgba(47, 125, 50, 0.18); }
.ui-alert[data-tone="warning"] { --ui-al-tone: #c2570c; --ui-al-bg: #fdeedd; --ui-al-line: rgba(194, 87, 12, 0.18); }
.ui-alert[data-tone="danger"] { --ui-al-tone: #c8372d; --ui-al-bg: rgba(200, 55, 45, 0.06); --ui-al-line: rgba(200, 55, 45, 0.16); }
.ui-alert[data-tone="neutral"] { --ui-al-tone: var(--ds-soft); --ui-al-bg: var(--ds-field); --ui-al-line: var(--ds-line); }
.ui-alert__glyph { display: grid; flex: none; height: 20px; align-items: center; color: var(--ui-al-tone); }
.ui-alert__body { flex: 1; min-width: 0; }
.ui-alert__title { margin: 0; font: 500 13px/20px var(--font-sans); overflow-wrap: anywhere; }
.ui-alert__text { font: 400 13px/20px var(--font-sans); color: var(--ds-text); overflow-wrap: anywhere; }
.ui-alert__title + .ui-alert__text { margin-top: 1px; }
.ui-alert__action { display: flex; flex: none; align-items: center; }
.ui-alert__close {
  display: grid;
  place-items: center;
  flex: none;
  width: 24px;
  height: 24px;
  margin: -2px -4px -2px 0;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--ds-soft);
  cursor: pointer;
  transition: background-color 140ms ease, color 140ms ease;
}
.ui-alert__close:hover { background: rgba(0, 0, 0, 0.05); color: var(--ds-ink); }
.ui-alert__close:focus-visible { outline: 2px solid var(--ds-focus); outline-offset: 1px; }

:where(.dark, [data-theme="dark"]) .ui-alert { --ui-al-bg: rgba(109, 139, 255, 0.1); --ui-al-line: rgba(109, 139, 255, 0.22); }
:where(.dark, [data-theme="dark"]) .ui-alert[data-tone="success"] { --ui-al-tone: #4cc38a; --ui-al-bg: rgba(42, 157, 92, 0.12); --ui-al-line: rgba(76, 195, 138, 0.22); }
:where(.dark, [data-theme="dark"]) .ui-alert[data-tone="warning"] { --ui-al-tone: #fb9a4b; --ui-al-bg: rgba(251, 154, 75, 0.12); --ui-al-line: rgba(251, 154, 75, 0.22); }
:where(.dark, [data-theme="dark"]) .ui-alert[data-tone="danger"] { --ui-al-tone: #ff6369; --ui-al-bg: rgba(255, 99, 105, 0.1); --ui-al-line: rgba(255, 99, 105, 0.22); }
:where(.dark, [data-theme="dark"]) .ui-alert[data-tone="neutral"] { --ui-al-bg: rgba(255, 255, 255, 0.04); }
:where(.dark, [data-theme="dark"]) .ui-alert__close:hover { background: rgba(255, 255, 255, 0.06); }
`;
