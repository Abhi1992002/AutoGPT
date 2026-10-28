import { Check, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Icon } from "./icon";

/*
 * Toggle chip – a pressable chip. Off: the AffectUI filter-menu chip (30px, 10px corners, a light fill);
 * on: filled with ink like a checked box. Optional tick when on, or a remove button instead of toggling.
 */

export type ToggleChipProps = {
  children: ReactNode;
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  icon?: ReactNode;
  /** Shows a tick in front of the label while pressed */
  check?: boolean;
  /** Turns the chip into a removable one – the × calls this */
  onRemove?: () => void;
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
};

export function ToggleChip({ children, pressed, defaultPressed = false, onPressedChange, icon, check = false, onRemove, size = "md", disabled, className }: ToggleChipProps) {
  const [inner, setInner] = useState(defaultPressed);
  const on = pressed ?? inner;
  const toggle = () => {
    if (pressed === undefined) setInner(!on);
    onPressedChange?.(!on);
  };
  return (
    <>
      <style href="ui-chip" precedence="default">
        {css}
      </style>
      <span className={["ui-chip", className].filter(Boolean).join(" ")} data-size={size} data-on={on || undefined} data-disabled={disabled || undefined}>
        <button type="button" className="ui-chip__main" aria-pressed={onRemove ? undefined : on} disabled={disabled} onClick={onRemove ? undefined : toggle}>
          {check && on && (
            <span className="ui-chip__tick" aria-hidden="true">
              <Icon icon={Check} size="xs" />
            </span>
          )}
          {icon && (
            <span className="ui-chip__icon" aria-hidden="true">
              {icon}
            </span>
          )}
          <span className="ui-chip__label">{children}</span>
        </button>
        {onRemove && (
          <button type="button" className="ui-chip__remove" aria-label="Remove" disabled={disabled} onClick={onRemove}>
            <Icon icon={X} size="xs" />
          </button>
        )}
      </span>
    </>
  );
}

const css = /* css */ `
.ui-chip {
  --ui-chip-bg: #f3f3f3;
  --ui-chip-hover: #ebebeb;
  --ui-chip-h: 30px;
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  height: var(--ui-chip-h);
  padding: 0 4px;
  border-radius: 10px;
  background: var(--ui-chip-bg);
  font: 500 13px/20px var(--font-sans);
  color: var(--ds-text);
  white-space: nowrap;
  vertical-align: middle;
  transition: background-color 160ms ease, color 160ms ease, transform 160ms var(--ds-ease);
}
.ui-chip[data-size="sm"] { --ui-chip-h: 26px; border-radius: 8px; font-size: 12.5px; }
.ui-chip:hover { background: var(--ui-chip-hover); }
.ui-chip:active { transform: scale(0.97); }
.ui-chip[data-on] { background: var(--ds-ink); color: var(--ds-surface); }
.ui-chip[data-on]:hover { background: var(--ds-ink); }
.ui-chip[data-disabled] { opacity: 0.6; pointer-events: none; }
.ui-chip button { display: inline-flex; align-items: center; gap: 6px; height: 100%; margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ui-chip__main { padding: 0 7px !important; min-width: 0; }
.ui-chip__label { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.ui-chip__tick, .ui-chip__icon { display: grid; flex: none; }
.ui-chip__tick { animation: ui-chip-in 200ms var(--ds-ease) both; }
.ui-chip__remove { display: grid; place-items: center; flex: none; width: 22px; height: 22px; border-radius: 6px; color: var(--ds-muted); transition: background-color 160ms ease, color 160ms ease; }
.ui-chip__remove:hover { background: var(--ui-chip-hover); color: var(--ds-ink); }
.ui-chip[data-on] .ui-chip__remove { color: inherit; }
.ui-chip[data-on] .ui-chip__remove:hover { background: rgba(255, 255, 255, 0.16); }
.ui-chip button:focus-visible { outline: 2px solid var(--ds-focus); outline-offset: 2px; border-radius: 8px; }
@keyframes ui-chip-in { from { opacity: 0; transform: scale(0.6); } }
@media (prefers-reduced-motion: reduce) { .ui-chip, .ui-chip__remove, .ui-chip__tick { transition: none; animation: none; } }

:where(.dark, [data-theme="dark"]) .ui-chip { --ui-chip-bg: #2a2a2d; --ui-chip-hover: #313135; }
:where(.dark, [data-theme="dark"]) .ui-chip[data-on] { color: #121213; }
:where(.dark, [data-theme="dark"]) .ui-chip[data-on] .ui-chip__remove:hover { background: rgba(0, 0, 0, 0.12); }
`;
