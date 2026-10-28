import { useId, type ReactNode } from "react";

/*
 * Switch – on / off. The track turns ink when on (the filled check of the filter menu),
 * the thumb slides in 200ms on the AffectUI ease.
 */

export type SwitchProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
};

export function Switch({ checked, defaultChecked = false, onChange, label, description, size = "md", disabled, className }: SwitchProps) {
  const id = useId();
  const controlled = checked !== undefined;
  return (
    <>
      <style href="ui-switch" precedence="default">
        {css}
      </style>
      <label className={["ui-switch", className].filter(Boolean).join(" ")} data-size={size} data-disabled={disabled || undefined} htmlFor={id}>
        <input
          id={id}
          className="ui-switch__input"
          type="checkbox"
          role="switch"
          checked={controlled ? checked : undefined}
          defaultChecked={controlled ? undefined : defaultChecked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.currentTarget.checked)}
        />
        <span className="ui-switch__track" aria-hidden="true">
          <span className="ui-switch__thumb" />
        </span>
        {(label != null || description != null) && (
          <span className="ui-switch__text">
            {label != null && <span className="ui-switch__label">{label}</span>}
            {description != null && <span className="ui-switch__desc">{description}</span>}
          </span>
        )}
      </label>
    </>
  );
}

const css = /* css */ `
.ui-switch {
  --ui-sw-w: 36px;
  --ui-sw-h: 20px;
  --ui-sw-off: #e5e5e5;
  --ui-sw-on: var(--ds-ink);
  --ui-sw-thumb: #ffffff;
  display: inline-flex;
  align-items: flex-start;
  gap: 10px;
  max-width: 100%;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
.ui-switch[data-size="sm"] { --ui-sw-w: 28px; --ui-sw-h: 16px; }
.ui-switch[data-disabled] { opacity: 0.5; cursor: default; pointer-events: none; }
.ui-switch__input { position: absolute; width: 1px; height: 1px; margin: 0; opacity: 0; pointer-events: none; }
.ui-switch__track {
  position: relative;
  display: block;
  flex: none;
  width: var(--ui-sw-w);
  height: var(--ui-sw-h);
  margin-top: calc((20px - var(--ui-sw-h)) / 2);
  border-radius: 999px;
  background: var(--ui-sw-off);
  transition: background-color 200ms ease, box-shadow 160ms ease;
}
.ui-switch__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: calc(var(--ui-sw-h) - 4px);
  height: calc(var(--ui-sw-h) - 4px);
  border-radius: 50%;
  background: var(--ui-sw-thumb);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2), 0 0 0 0.5px rgba(0, 0, 0, 0.06);
  transition: transform 200ms var(--ds-ease), width 200ms var(--ds-ease);
}
.ui-switch__input:checked + .ui-switch__track { background: var(--ui-sw-on); }
.ui-switch__input:checked + .ui-switch__track .ui-switch__thumb { transform: translateX(calc(var(--ui-sw-w) - var(--ui-sw-h))); }
.ui-switch:active .ui-switch__thumb { width: calc(var(--ui-sw-h) - 1px); }
.ui-switch:active .ui-switch__input:checked + .ui-switch__track .ui-switch__thumb { transform: translateX(calc(var(--ui-sw-w) - var(--ui-sw-h) - 3px)); }
.ui-switch__input:focus-visible + .ui-switch__track { box-shadow: 0 0 0 2px var(--ds-surface), 0 0 0 4px var(--ds-focus); }
.ui-switch__text { display: grid; min-width: 0; }
.ui-switch__label { font: 500 13px/20px var(--font-sans); color: var(--ds-ink); }
.ui-switch__desc { font: 400 12px/16px var(--font-sans); color: var(--ds-muted); }
@media (prefers-reduced-motion: reduce) { .ui-switch__track, .ui-switch__thumb { transition: none; } }

:where(.dark, [data-theme="dark"]) .ui-switch { --ui-sw-off: rgba(255, 255, 255, 0.14); --ui-sw-thumb: #ffffff; }
:where(.dark, [data-theme="dark"]) .ui-switch__input:checked + .ui-switch__track .ui-switch__thumb { background: #121213; }
`;
