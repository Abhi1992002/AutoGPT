import { useId, type ReactNode } from "react";

/*
 * Field – label, help and error around a control, plus the shared control box every input uses.
 * Box: 36px, 8px corners, 1px #e5e5e5 border, a tiny shadow; focus draws the ink border with the
 * OTP input's soft halo, errors use its red. Dark values follow the same components.
 */

export type FieldProps = {
  label?: ReactNode;
  help?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  /** Width of the whole field */
  width?: number | string;
  className?: string;
  children: (ids: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
};

export function Field({ label, help, error, required, width, className, children }: FieldProps) {
  const id = useId();
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const invalid = error != null && error !== false && error !== "";
  const describedBy = [help ? helpId : null, invalid ? errorId : null].filter(Boolean).join(" ") || undefined;
  return (
    <>
      <style href="ui-field" precedence="default">
        {css}
      </style>
      <div className={["ui-field", className].filter(Boolean).join(" ")} style={{ width: typeof width === "number" ? `${width}px` : width }}>
        {label != null && (
          <label className="ui-field__label" htmlFor={id}>
            {label}
            {required && (
              <span className="ui-field__req" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        {children({ id, describedBy, invalid })}
        {help != null && !invalid && (
          <p className="ui-field__help" id={helpId}>
            {help}
          </p>
        )}
        {invalid && (
          <p className="ui-field__error" id={errorId} role="alert">
            {error}
          </p>
        )}
      </div>
    </>
  );
}

const css = /* css */ `
.ui-field { display: grid; gap: 6px; width: 100%; min-width: 0; font-family: var(--font-sans); }
.ui-field__label { display: inline-flex; gap: 2px; font: 500 13px/20px var(--font-sans); color: var(--ds-ink); }
.ui-field__req { color: var(--ds-danger); }
.ui-field__help { margin: 0; font: 400 12px/16px var(--font-sans); color: var(--ds-muted); }
.ui-field__error { margin: 0; font: 500 12px/16px var(--font-sans); color: var(--ds-danger); animation: ui-field-in 200ms var(--ds-ease) both; }
@keyframes ui-field-in { from { opacity: 0; transform: translateY(-3px); } }

/* The control box shared by Input, Textarea, Search, Select, File and Date inputs */
.ui-control {
  --ui-ctl-line-strong: #cfcfd4;
  --ui-ctl-halo: rgba(23, 23, 23, 0.07);
  --ui-ctl-danger-line: rgba(229, 72, 77, 0.6);
  --ui-ctl-danger-halo: rgba(229, 72, 77, 0.12);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 36px;
  padding: 0 10px;
  border: 1px solid var(--ds-line);
  border-radius: 8px;
  background: var(--ds-surface);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  font: 500 13px/20px var(--font-sans);
  color: var(--ds-ink);
  cursor: text;
  transition: border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease;
}
.ui-control:hover { border-color: var(--ui-ctl-line-strong); }
.ui-control:focus-within { border-color: var(--ds-ink); box-shadow: 0 0 0 4px var(--ui-ctl-halo); }
.ui-control[data-invalid] { border-color: var(--ui-ctl-danger-line); }
.ui-control[data-invalid]:focus-within { border-color: var(--ds-danger); box-shadow: 0 0 0 4px var(--ui-ctl-danger-halo); }
.ui-control[data-disabled] { background: var(--ds-field); opacity: 0.55; cursor: default; pointer-events: none; }
.ui-control__input {
  flex: 1;
  min-width: 0;
  height: 34px;
  margin: 0;
  padding: 0;
  border: 0;
  outline: none;
  background: transparent;
  font: inherit;
  color: inherit;
  appearance: none;
}
.ui-control__input::placeholder { color: var(--ds-muted); }
.ui-control__input:focus-visible { outline: none; }
.ui-control__input::-webkit-outer-spin-button, .ui-control__input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.ui-control__input[type="number"] { -moz-appearance: textfield; }
.ui-control__input::-webkit-search-cancel-button { display: none; }
.ui-control__affix { flex: none; display: inline-flex; align-items: center; color: var(--ds-muted); white-space: nowrap; }
.ui-control__btn {
  display: grid;
  place-items: center;
  flex: none;
  width: 24px;
  height: 24px;
  margin: 0 -4px 0 0;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: none;
  color: var(--ds-muted);
  cursor: pointer;
  transition: background-color 160ms ease, color 160ms ease;
}
.ui-control__btn:hover { background: var(--ds-hover); color: var(--ds-ink); }
.ui-control__btn:focus-visible { outline: 2px solid var(--ds-focus); outline-offset: 1px; }
@media (prefers-reduced-motion: reduce) { .ui-control, .ui-control__btn, .ui-field__error { transition: none; animation: none; } }

:where(.dark, [data-theme="dark"]) .ui-control {
  --ui-ctl-line-strong: #3a3a40;
  --ui-ctl-halo: rgba(255, 255, 255, 0.08);
  --ui-ctl-danger-line: rgba(255, 99, 105, 0.55);
  --ui-ctl-danger-halo: rgba(255, 99, 105, 0.14);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}
`;
