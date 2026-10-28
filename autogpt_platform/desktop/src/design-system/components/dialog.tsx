import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { Icon } from "./icon";

/*
 * Dialog – a modal on the native <dialog>, so focus stays inside and Escape closes it.
 * The panel is the AffectUI notification card (20px corners, 16px title, a soft drop shadow) stepping
 * in with a small scale; the backdrop dims the page.
 */

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Buttons at the bottom, right-aligned */
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  /** Hide the × in the corner */
  dismissible?: boolean;
  /** Renders the panel in place instead of as a modal – for previews and docs */
  inline?: boolean;
  className?: string;
};

export function Dialog({ open, onClose, title, description, children, footer, size = "md", dismissible = true, inline = false, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el || inline) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  return (
    <>
      <style href="ui-dialog" precedence="default">
        {css}
      </style>
      <dialog
        ref={ref}
        className={["ui-dialog", className].filter(Boolean).join(" ")}
        data-size={size}
        data-inline={inline || undefined}
        open={inline ? true : undefined}
        aria-labelledby={title != null ? `${id}-title` : undefined}
        aria-describedby={description != null ? `${id}-desc` : undefined}
        onCancel={(e) => {
          e.preventDefault();
          onClose();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="ui-dialog__panel">
          {dismissible && (
            <button type="button" className="ui-dialog__close" aria-label="Close" onClick={onClose}>
              <Icon icon={X} />
            </button>
          )}
          {title != null && (
            <h2 className="ui-dialog__title" id={`${id}-title`}>
              {title}
            </h2>
          )}
          {description != null && (
            <p className="ui-dialog__desc" id={`${id}-desc`}>
              {description}
            </p>
          )}
          {children != null && <div className="ui-dialog__body">{children}</div>}
          {footer != null && <div className="ui-dialog__footer">{footer}</div>}
        </div>
      </dialog>
    </>
  );
}

const css = /* css */ `
.ui-dialog {
  --ui-dlg-w: 440px;
  width: min(var(--ui-dlg-w), calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  margin: auto;
  padding: 0;
  border: 0;
  border-radius: 20px;
  background: transparent;
  color: var(--ds-ink);
  font-family: var(--font-sans);
  overflow: visible;
}
.ui-dialog[data-size="sm"] { --ui-dlg-w: 360px; }
.ui-dialog[data-size="lg"] { --ui-dlg-w: 640px; }
.ui-dialog[data-inline] { position: static; margin: 0; max-width: 100%; }
.ui-dialog[data-inline] .ui-dialog__panel { animation: none; }
.ui-dialog::backdrop { background: rgba(23, 23, 23, 0.32); animation: ui-dialog-fade 200ms ease both; }
.ui-dialog[open] .ui-dialog__panel { animation: ui-dialog-in 240ms var(--ds-ease) both; }
.ui-dialog__panel {
  position: relative;
  box-sizing: border-box;
  max-height: calc(100vh - 32px);
  overflow: auto;
  padding: 20px 20px 18px;
  border: 1px solid var(--ds-line);
  border-radius: 20px;
  background: var(--ds-surface);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03), 0 8px 24px rgba(0, 0, 0, 0.035), 0 24px 60px rgba(0, 0, 0, 0.12);
}
.ui-dialog__close {
  position: absolute;
  top: 14px;
  right: 14px;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--ds-soft);
  cursor: pointer;
  transition: background-color 140ms ease, color 140ms ease;
}
.ui-dialog__close:hover { background: rgba(0, 0, 0, 0.05); color: var(--ds-ink); }
.ui-dialog__close:focus-visible { outline: 2px solid var(--ds-focus); outline-offset: 1px; }
.ui-dialog__title { margin: 0; padding-right: 28px; font: 600 16px/22px var(--font-sans); letter-spacing: -0.01em; overflow-wrap: anywhere; }
.ui-dialog__desc { margin: 6px 0 0; font: 400 14px/21px var(--font-sans); color: var(--ds-soft); overflow-wrap: anywhere; }
.ui-dialog__body { margin-top: 16px; font: 400 14px/20px var(--font-sans); color: var(--ds-text); }
.ui-dialog__footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
@keyframes ui-dialog-in { from { opacity: 0; transform: translateY(8px) scale(0.98); } }
@keyframes ui-dialog-fade { from { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .ui-dialog[open] .ui-dialog__panel, .ui-dialog::backdrop { animation: none; } }

:where(.dark, [data-theme="dark"]) .ui-dialog::backdrop { background: rgba(0, 0, 0, 0.55); }
:where(.dark, [data-theme="dark"]) .ui-dialog__panel { box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4), 0 8px 24px rgba(0, 0, 0, 0.35), 0 24px 60px rgba(0, 0, 0, 0.4); }
:where(.dark, [data-theme="dark"]) .ui-dialog__close:hover { background: rgba(255, 255, 255, 0.06); }
`;
