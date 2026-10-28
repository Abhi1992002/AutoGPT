import { useEffect, useId, useRef, type ReactNode } from "react";

/*
 * Checkbox – ported from the AffectUI filter-menu option box: a 20px tile with a hairline inset
 * that fills with ink while the tick draws itself in 260ms.
 */

export type CheckboxProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  name?: string;
  value?: string;
  className?: string;
};

export function Checkbox({ checked, defaultChecked = false, indeterminate = false, onChange, label, description, disabled, name, value, className }: CheckboxProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const controlled = checked !== undefined;
  useEffect(() => {
    if (input.current) input.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <>
      <style href="ui-checkbox" precedence="default">
        {css}
      </style>
      <label className={["ui-checkbox", className].filter(Boolean).join(" ")} data-disabled={disabled || undefined} htmlFor={id}>
        <input
          ref={input}
          id={id}
          className="ui-checkbox__input"
          type="checkbox"
          name={name}
          value={value}
          checked={controlled ? checked : undefined}
          defaultChecked={controlled ? undefined : defaultChecked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.currentTarget.checked)}
        />
        <span className="ui-checkbox__box" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="ui-checkbox__tick">
            <path d="m6 12.5 4 4 8-9" />
          </svg>
          <svg viewBox="0 0 24 24" className="ui-checkbox__dash">
            <path d="M7 12h10" />
          </svg>
        </span>
        {(label != null || description != null) && (
          <span className="ui-checkbox__text">
            {label != null && <span className="ui-checkbox__label">{label}</span>}
            {description != null && <span className="ui-checkbox__desc">{description}</span>}
          </span>
        )}
      </label>
    </>
  );
}

const css = /* css */ `
.ui-checkbox {
  --ui-cb-box: #f0f0f0;
  --ui-cb-box-line: #e3e3e3;
  --ui-cb-check: #ffffff;
  display: inline-flex;
  align-items: flex-start;
  gap: 10px;
  max-width: 100%;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
.ui-checkbox[data-disabled] { opacity: 0.5; cursor: default; pointer-events: none; }
.ui-checkbox__input { position: absolute; width: 1px; height: 1px; margin: 0; opacity: 0; pointer-events: none; }
.ui-checkbox__box {
  position: relative;
  display: grid;
  place-items: center;
  flex: none;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  background: var(--ui-cb-box);
  box-shadow: inset 0 0 0 1px var(--ui-cb-box-line);
  transition: background-color 180ms ease, box-shadow 180ms ease;
}
.ui-checkbox__box svg {
  grid-area: 1 / 1;
  width: 14px;
  height: 14px;
  fill: none;
  stroke: var(--ui-cb-check);
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 20;
  stroke-dashoffset: 20;
  transition: stroke-dashoffset 260ms var(--ds-ease);
}
.ui-checkbox__input:checked + .ui-checkbox__box,
.ui-checkbox__input:indeterminate + .ui-checkbox__box { background: var(--ds-ink); box-shadow: inset 0 0 0 1px var(--ds-ink); }
.ui-checkbox__input:checked:not(:indeterminate) + .ui-checkbox__box .ui-checkbox__tick { stroke-dashoffset: 0; }
.ui-checkbox__input:indeterminate + .ui-checkbox__box .ui-checkbox__dash { stroke-dashoffset: 0; }
.ui-checkbox__input:focus-visible + .ui-checkbox__box { outline: 2px solid var(--ds-focus); outline-offset: 2px; }
.ui-checkbox__text { display: grid; min-width: 0; }
.ui-checkbox__label { font: 500 13px/20px var(--font-sans); color: var(--ds-ink); }
.ui-checkbox__desc { font: 400 12px/16px var(--font-sans); color: var(--ds-muted); }
@media (prefers-reduced-motion: reduce) { .ui-checkbox__box, .ui-checkbox__box svg { transition: none; } }

:where(.dark, [data-theme="dark"]) .ui-checkbox { --ui-cb-box: #2a2a2d; --ui-cb-box-line: rgba(255, 255, 255, 0.1); --ui-cb-check: #121213; }
`;
