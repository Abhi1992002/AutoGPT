import { useId, useState, type ReactNode } from "react";

/*
 * Radio group – ported from the AffectUI progress-tracker check: a 20px ring that fills with ink
 * and pops a little (560ms) when picked. Arrow keys move between options, as native radios do.
 */

export type RadioOption<T extends string = string> = {
  value: T;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
};

export type RadioGroupProps<T extends string = string> = {
  options: RadioOption<T>[];
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
  name?: string;
  label?: ReactNode;
  orientation?: "vertical" | "horizontal";
  disabled?: boolean;
  className?: string;
};

export function RadioGroup<T extends string = string>({ options, value, defaultValue, onChange, name, label, orientation = "vertical", disabled, className }: RadioGroupProps<T>) {
  const id = useId();
  const [inner, setInner] = useState<T | undefined>(defaultValue);
  const current = value !== undefined ? value : inner;
  const group = name ?? id;
  return (
    <>
      <style href="ui-radio" precedence="default">
        {css}
      </style>
      <fieldset className={["ui-radio", className].filter(Boolean).join(" ")} data-orientation={orientation} disabled={disabled}>
        {label != null && <legend className="ui-radio__legend">{label}</legend>}
        <div className="ui-radio__options">
          {options.map((o) => {
            const oid = `${id}-${o.value}`;
            return (
              <label key={String(o.value)} className="ui-radio__option" htmlFor={oid} data-disabled={o.disabled || undefined}>
                <input
                  id={oid}
                  className="ui-radio__input"
                  type="radio"
                  name={group}
                  value={o.value}
                  checked={current === o.value}
                  disabled={o.disabled}
                  onChange={() => {
                    if (value === undefined) setInner(o.value);
                    onChange?.(o.value);
                  }}
                />
                <span className="ui-radio__ring" aria-hidden="true">
                  <span className="ui-radio__dot" />
                </span>
                <span className="ui-radio__text">
                  <span className="ui-radio__label">{o.label}</span>
                  {o.description != null && <span className="ui-radio__desc">{o.description}</span>}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </>
  );
}

const css = /* css */ `
.ui-radio { --ui-rd-ring: #8f8f8f; --ui-rd-dot: #ffffff; margin: 0; padding: 0; border: 0; min-width: 0; }
.ui-radio:disabled { opacity: 0.5; pointer-events: none; }
.ui-radio__legend { padding: 0; margin: 0 0 8px; font: 500 13px/20px var(--font-sans); color: var(--ds-ink); }
.ui-radio__options { display: flex; flex-direction: column; gap: 8px; }
.ui-radio[data-orientation="horizontal"] .ui-radio__options { flex-direction: row; flex-wrap: wrap; gap: 8px 20px; }
.ui-radio__option { display: inline-flex; align-items: flex-start; gap: 10px; max-width: 100%; cursor: pointer; -webkit-tap-highlight-color: transparent; user-select: none; }
.ui-radio__option[data-disabled] { opacity: 0.5; cursor: default; pointer-events: none; }
.ui-radio__input { position: absolute; width: 1px; height: 1px; margin: 0; opacity: 0; pointer-events: none; }
.ui-radio__ring {
  display: grid;
  place-items: center;
  flex: none;
  width: 20px;
  height: 20px;
  border: 1.5px solid var(--ui-rd-ring);
  border-radius: 50%;
  background: transparent;
  transition: background-color 220ms var(--ds-ease), border-color 220ms var(--ds-ease);
}
.ui-radio__dot { width: 8px; height: 8px; border-radius: 50%; background: var(--ui-rd-dot); transform: scale(0); transition: transform 220ms var(--ds-ease); }
.ui-radio__input:checked + .ui-radio__ring { background: var(--ds-ink); border-color: var(--ds-ink); animation: ui-radio-pop 560ms var(--ds-ease); }
.ui-radio__input:checked + .ui-radio__ring .ui-radio__dot { transform: scale(1); }
.ui-radio__input:focus-visible + .ui-radio__ring { outline: 2px solid var(--ds-focus); outline-offset: 2px; }
.ui-radio__text { display: grid; min-width: 0; }
.ui-radio__label { font: 500 13px/20px var(--font-sans); color: var(--ds-ink); }
.ui-radio__desc { font: 400 12px/16px var(--font-sans); color: var(--ds-muted); }
@keyframes ui-radio-pop { 0% { transform: scale(0.9); } 60% { transform: scale(1.06); } 100% { transform: scale(1); } }
@media (prefers-reduced-motion: reduce) { .ui-radio__ring, .ui-radio__dot { transition: none; animation: none !important; } }

:where(.dark, [data-theme="dark"]) .ui-radio { --ui-rd-ring: #6b6b70; --ui-rd-dot: #121213; }
`;
