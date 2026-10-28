import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";

/*
 * Popover – a floating panel under (or above) its trigger. Closes on a click outside or Escape.
 * The panel is the AffectUI email-draft menu surface: 12px corners, a hairline ring and a soft drop shadow,
 * unfolding from its corner in 200ms. Dropdown menu and Select build on these primitives.
 */

export type PopoverSide = "bottom" | "top";
export type PopoverAlign = "start" | "end";

export type PopoverTriggerProps = {
  ref: RefObject<HTMLButtonElement | null>;
  onClick: () => void;
  "aria-expanded": boolean;
  "aria-haspopup": "dialog" | "menu" | "listbox";
  "aria-controls": string;
};

export type PopoverProps = {
  trigger: (props: PopoverTriggerProps) => ReactNode;
  children: ReactNode;
  side?: PopoverSide;
  align?: PopoverAlign;
  /** Controlled open state */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Width of the panel; defaults to its content */
  width?: number | string;
  className?: string;
};

/** Open state plus the outside-click and Escape handling shared by every floating panel */
export function usePopover(controlled?: boolean, onChange?: (open: boolean) => void) {
  const [inner, setInner] = useState(false);
  const open = controlled ?? inner;
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const setOpen = (next: boolean) => {
    if (controlled === undefined) setInner(next);
    onChange?.(next);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      trigger.current?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return { open, setOpen, root, trigger };
}

export function Popover({ trigger, children, side = "bottom", align = "start", open: controlled, onOpenChange, width, className }: PopoverProps) {
  const { open, setOpen, root, trigger: triggerRef } = usePopover(controlled, onOpenChange);
  const id = useId();
  return (
    <>
      <PopoverStyle />
      <div ref={root} className={["ui-popover", className].filter(Boolean).join(" ")} data-side={side} data-align={align}>
        {trigger({ ref: triggerRef, onClick: () => setOpen(!open), "aria-expanded": open, "aria-haspopup": "dialog", "aria-controls": id })}
        {open && (
          <div className="ui-popover__panel ui-popover__panel--padded" id={id} role="dialog" style={{ width: typeof width === "number" ? `${width}px` : width }}>
            {children}
          </div>
        )}
      </div>
    </>
  );
}

export function PopoverStyle() {
  return (
    <style href="ui-popover" precedence="default">
      {css}
    </style>
  );
}

const css = /* css */ `
.ui-popover { position: relative; display: inline-flex; }
.ui-popover__panel {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 20;
  box-sizing: border-box;
  min-width: 100%;
  max-height: 320px;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 5px;
  border-radius: 12px;
  background: var(--ds-surface);
  box-shadow: var(--ds-shadow-menu);
  color: var(--ds-ink);
  font: 500 13px/20px var(--font-sans);
  transform-origin: top left;
  animation: ui-popover-in 200ms var(--ds-ease) both;
}
.ui-popover__panel--padded { padding: 14px; }
.ui-popover[data-align="end"] .ui-popover__panel { left: auto; right: 0; transform-origin: top right; }
.ui-popover[data-side="top"] .ui-popover__panel { top: auto; bottom: calc(100% + 6px); transform-origin: bottom left; }
.ui-popover[data-side="top"][data-align="end"] .ui-popover__panel { transform-origin: bottom right; }
@keyframes ui-popover-in { from { opacity: 0; transform: scale(0.96) translateY(-2px); } }
@media (prefers-reduced-motion: reduce) { .ui-popover__panel { animation: none; } }
`;
