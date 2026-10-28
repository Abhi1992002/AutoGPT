import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "./icon";

/*
 * Toast – short notices. The card is the AffectUI notification-stack card (20px corners, 16px title,
 * 14px grey text, a white action button with a hairline) and it leaves the way their cards do: sliding
 * out to the right. <ToastProvider> keeps a stack in the corner; useToast() adds to it.
 */

export type ToastTone = "neutral" | "info" | "success" | "warning" | "danger";

export type ToastOptions = {
  title: ReactNode;
  text?: ReactNode;
  tone?: ToastTone;
  action?: { label: ReactNode; onClick: () => void };
  /** Milliseconds until it goes; 0 keeps it until dismissed */
  duration?: number;
};

export type ToastProps = ToastOptions & {
  onDismiss?: () => void;
  /** Plays the leaving animation */
  leaving?: boolean;
  className?: string;
};

const icons = { info: Info, success: CheckCircle2, warning: AlertTriangle, danger: AlertCircle };

export function Toast({ title, text, tone = "neutral", action, onDismiss, leaving, className }: ToastProps) {
  const Glyph = tone === "neutral" ? null : icons[tone];
  return (
    <>
      <style href="ui-toast" precedence="default">
        {css}
      </style>
      <div className={["ui-toast", className].filter(Boolean).join(" ")} data-tone={tone} data-leaving={leaving || undefined} role="status">
        {Glyph && (
          <span className="ui-toast__glyph" aria-hidden="true">
            <Icon icon={Glyph} size="md" />
          </span>
        )}
        <div className="ui-toast__body">
          <p className="ui-toast__title">{title}</p>
          {text != null && <p className="ui-toast__text">{text}</p>}
          {action && (
            <button
              type="button"
              className="ui-toast__btn"
              onClick={() => {
                action.onClick();
                onDismiss?.();
              }}
            >
              {action.label}
            </button>
          )}
        </div>
        {onDismiss && (
          <button type="button" className="ui-toast__close" aria-label="Dismiss" onClick={onDismiss}>
            <Icon icon={X} />
          </button>
        )}
      </div>
    </>
  );
}

/* ---------- Provider ---------- */

type Entry = ToastOptions & { id: number; leaving?: boolean };

const ToastContext = createContext<((options: ToastOptions) => void) | null>(null);

export function useToast() {
  const push = useContext(ToastContext);
  if (!push) throw new Error("useToast needs a <ToastProvider> above it");
  return push;
}

export function ToastProvider({ children, position = "bottom-right" }: { children: ReactNode; position?: "bottom-right" | "top-right" | "bottom-center" }) {
  const [list, setList] = useState<Entry[]>([]);
  const seq = useRef(0);
  const timers = useRef(new Map<number, number>());

  const dismiss = (id: number) => {
    clearTimeout(timers.current.get(id));
    setList((l) => l.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    window.setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 320);
  };
  const push = (options: ToastOptions) => {
    const id = ++seq.current;
    setList((l) => [...l, { ...options, id }]);
    const ms = options.duration ?? 5000;
    if (ms > 0) timers.current.set(id, window.setTimeout(() => dismiss(id), ms));
  };
  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <style href="ui-toast" precedence="default">
        {css}
      </style>
      <div className="ui-toast-viewport" data-position={position}>
        {list.map((t) => (
          <Toast key={t.id} {...t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const css = /* css */ `
.ui-toast {
  --ui-toast-tone: var(--ds-soft);
  position: relative;
  box-sizing: border-box;
  display: flex;
  gap: 12px;
  width: 100%;
  max-width: 380px;
  padding: 16px 18px 16px 18px;
  border: 1px solid var(--ds-line);
  border-radius: 20px;
  background: var(--ds-surface);
  box-shadow: var(--ds-shadow-float);
  font-family: var(--font-sans);
  color: var(--ds-ink);
  animation: ui-toast-in 460ms var(--ds-ease) both;
  transition: transform 320ms var(--ds-ease), opacity 240ms ease;
}
.ui-toast[data-leaving] { opacity: 0; transform: translateX(40px) scale(0.98); }
.ui-toast[data-tone="info"] { --ui-toast-tone: var(--ds-accent-text); }
.ui-toast[data-tone="success"] { --ui-toast-tone: #2f7d32; }
.ui-toast[data-tone="warning"] { --ui-toast-tone: #c2570c; }
.ui-toast[data-tone="danger"] { --ui-toast-tone: #c8372d; }
.ui-toast__glyph { display: grid; flex: none; padding-top: 1px; color: var(--ui-toast-tone); }
.ui-toast__body { flex: 1; min-width: 0; }
.ui-toast__title { margin: 0; padding-right: 20px; font: 500 15px/22px var(--font-sans); letter-spacing: -0.01em; overflow-wrap: anywhere; }
.ui-toast__text { margin: 4px 0 0; max-width: 34ch; font: 400 13.5px/20px var(--font-sans); color: var(--ds-soft); overflow-wrap: anywhere; }
.ui-toast__btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  max-width: 100%;
  margin-top: 12px;
  padding: 6px 12px;
  border: 0;
  border-radius: 9px;
  background: var(--ds-surface);
  box-shadow: 0 0 0 1px var(--ds-line), 0 1px 2px rgba(0, 0, 0, 0.04);
  font: 500 13px/20px var(--font-sans);
  color: var(--ds-ink);
  cursor: pointer;
  transition: background-color 160ms ease, transform 160ms ease;
}
.ui-toast__btn:hover { background: #f7f7f7; }
.ui-toast__btn:active { transform: scale(0.98); }
.ui-toast__close {
  position: absolute;
  top: 12px;
  right: 12px;
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
.ui-toast__close:hover { background: rgba(0, 0, 0, 0.05); color: var(--ds-ink); }
.ui-toast button:focus-visible { outline: 2px solid var(--ds-accent); outline-offset: 2px; }
.ui-toast-viewport { position: fixed; z-index: 50; display: grid; gap: 10px; width: min(380px, calc(100vw - 32px)); pointer-events: none; }
.ui-toast-viewport > * { pointer-events: auto; }
.ui-toast-viewport[data-position="bottom-right"] { right: 16px; bottom: 16px; }
.ui-toast-viewport[data-position="top-right"] { right: 16px; top: 16px; }
.ui-toast-viewport[data-position="bottom-center"] { left: 50%; bottom: 16px; transform: translateX(-50%); }
@keyframes ui-toast-in { from { opacity: 0; transform: translateY(12px) scale(0.98); } }
@media (prefers-reduced-motion: reduce) { .ui-toast { animation: none; transition: opacity 1ms; } }

:where(.dark, [data-theme="dark"]) .ui-toast[data-tone="success"] { --ui-toast-tone: #4cc38a; }
:where(.dark, [data-theme="dark"]) .ui-toast[data-tone="warning"] { --ui-toast-tone: #fb9a4b; }
:where(.dark, [data-theme="dark"]) .ui-toast[data-tone="danger"] { --ui-toast-tone: #ff6369; }
:where(.dark, [data-theme="dark"]) .ui-toast__btn { background: #2a2a2d; box-shadow: 0 0 0 1px var(--ds-line), 0 1px 2px rgba(0, 0, 0, 0.4); }
:where(.dark, [data-theme="dark"]) .ui-toast__btn:hover { background: #313135; }
:where(.dark, [data-theme="dark"]) .ui-toast__close:hover { background: rgba(255, 255, 255, 0.06); }
`;
