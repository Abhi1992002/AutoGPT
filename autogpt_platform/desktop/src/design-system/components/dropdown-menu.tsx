import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { PopoverStyle, usePopover, type PopoverAlign, type PopoverSide, type PopoverTriggerProps } from "./popover";

/*
 * Dropdown menu – actions under a trigger. Rows are the AffectUI profile-menu items (36px, 12px corners,
 * a 20px icon that darkens on hover) on the email-draft menu surface. Arrow keys move, Enter picks,
 * Escape closes and returns focus; typing jumps to a matching label.
 */

export type MenuItem =
  | {
      kind?: "item";
      label: ReactNode;
      icon?: ReactNode;
      /** Shown right-aligned, e.g. "⌘K" */
      shortcut?: ReactNode;
      tone?: "default" | "danger";
      disabled?: boolean;
      onSelect?: () => void;
    }
  | { kind: "separator" }
  | { kind: "label"; label: ReactNode };

export type DropdownMenuProps = {
  trigger: (props: PopoverTriggerProps) => ReactNode;
  items: MenuItem[];
  side?: PopoverSide;
  align?: PopoverAlign;
  /** Width of the menu; defaults to 220px */
  width?: number | string;
  /** Controlled open state */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
};

export function DropdownMenu({ trigger, items, side = "bottom", align = "start", width = 220, open: controlled, onOpenChange, className }: DropdownMenuProps) {
  const { open, setOpen, root, trigger: triggerRef } = usePopover(controlled, onOpenChange);
  const id = useId();
  const menu = useRef<HTMLDivElement>(null);

  const rows = () => Array.from(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled])') ?? []);

  useEffect(() => {
    if (open) requestAnimationFrame(() => rows()[0]?.focus());
  }, [open]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const all = rows();
    const i = all.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") (e.preventDefault(), all[(i + 1) % all.length]?.focus());
    else if (e.key === "ArrowUp") (e.preventDefault(), all[(i - 1 + all.length) % all.length]?.focus());
    else if (e.key === "Home") (e.preventDefault(), all[0]?.focus());
    else if (e.key === "End") (e.preventDefault(), all[all.length - 1]?.focus());
    else if (e.key === "Tab") setOpen(false);
    else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
      const hit = all.find((el) => el.textContent?.trim().toLowerCase().startsWith(e.key.toLowerCase()));
      hit?.focus();
    }
  };

  return (
    <>
      <PopoverStyle />
      <style href="ui-menu" precedence="default">
        {css}
      </style>
      <div ref={root} className={["ui-popover ui-menu", className].filter(Boolean).join(" ")} data-side={side} data-align={align}>
        {trigger({ ref: triggerRef, onClick: () => setOpen(!open), "aria-expanded": open, "aria-haspopup": "menu", "aria-controls": id })}
        {open && (
          <div ref={menu} className="ui-popover__panel ui-menu__panel" id={id} role="menu" style={{ width: typeof width === "number" ? `${width}px` : width }} onKeyDown={onKeyDown}>
            {items.map((item, i) => {
              if (item.kind === "separator") return <div key={i} className="ui-menu__sep" role="separator" />;
              if (item.kind === "label")
                return (
                  <div key={i} className="ui-menu__label" role="presentation">
                    {item.label}
                  </div>
                );
              return (
                <button
                  key={i}
                  type="button"
                  className="ui-menu__item"
                  role="menuitem"
                  data-tone={item.tone ?? "default"}
                  aria-disabled={item.disabled || undefined}
                  tabIndex={-1}
                  onClick={() => {
                    if (item.disabled) return;
                    setOpen(false);
                    triggerRef.current?.focus();
                    item.onSelect?.();
                  }}
                >
                  {item.icon && (
                    <span className="ui-menu__icon" aria-hidden="true">
                      {item.icon}
                    </span>
                  )}
                  <span className="ui-menu__text">{item.label}</span>
                  {item.shortcut && <span className="ui-menu__shortcut">{item.shortcut}</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

const css = /* css */ `
.ui-menu__panel { display: grid; gap: 2px; padding: 5px; }
.ui-menu__item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  height: 36px;
  margin: 0;
  padding: 0 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  font: 500 13px/20px var(--font-sans);
  text-align: left;
  color: var(--ds-text);
  cursor: pointer;
  transition: background-color 160ms ease, color 160ms ease;
}
.ui-menu__item:hover, .ui-menu__item:focus-visible { background: var(--ds-hover); color: var(--ds-ink); outline: none; }
.ui-menu__item:active { background: #efefef; }
.ui-menu__item[aria-disabled] { opacity: 0.55; color: var(--ds-ink); cursor: default; }
.ui-menu__item[aria-disabled]:hover { background: transparent; color: var(--ds-ink); }
.ui-menu__item[data-tone="danger"] { color: var(--ds-danger); }
.ui-menu__item[data-tone="danger"]:hover, .ui-menu__item[data-tone="danger"]:focus-visible { color: var(--ds-danger); background: rgba(229, 72, 77, 0.08); }
.ui-menu__icon { display: grid; place-items: center; flex: none; width: 20px; height: 20px; color: var(--ds-soft); transition: color 160ms ease; }
.ui-menu__icon svg { width: 18px; height: 18px; }
.ui-menu__item:hover .ui-menu__icon, .ui-menu__item:focus-visible .ui-menu__icon { color: var(--ds-ink); }
.ui-menu__item[data-tone="danger"] .ui-menu__icon { color: inherit; }
.ui-menu__text { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-menu__shortcut { flex: none; font: 500 12px/16px var(--font-sans); color: var(--ds-muted); font-variant-numeric: tabular-nums; }
.ui-menu__sep { height: 1px; margin: 4px 6px; background: var(--ds-hairline); }
.ui-menu__label { padding: 6px 10px 2px; font: 500 11px/16px var(--font-sans); letter-spacing: 0.06em; text-transform: uppercase; color: var(--ds-muted); }
@media (prefers-reduced-motion: reduce) { .ui-menu__item, .ui-menu__icon { transition: none; } }

:where(.dark, [data-theme="dark"]) .ui-menu__item:active { background: #313135; }
:where(.dark, [data-theme="dark"]) .ui-menu__item[data-tone="danger"]:hover, :where(.dark, [data-theme="dark"]) .ui-menu__item[data-tone="danger"]:focus-visible { background: rgba(255, 99, 105, 0.12); }
`;
