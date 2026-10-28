import { useLayoutEffect, useRef, type ComponentPropsWithRef, type ReactNode } from "react";
import { Field } from "./field";

/*
 * Textarea – grows with its text, from `rows` lines up to `maxRows`, then scrolls.
 */

export type TextareaProps = ComponentPropsWithRef<"textarea"> & {
  label?: ReactNode;
  help?: ReactNode;
  error?: ReactNode;
  maxRows?: number;
  width?: number | string;
};

export function Textarea({ label, help, error, rows = 3, maxRows = 10, width, className, disabled, required, onChange, ref, value, defaultValue, ...rest }: TextareaProps) {
  const inner = useRef<HTMLTextAreaElement | null>(null);

  const grow = () => {
    const el = inner.current;
    if (!el) return;
    const line = parseFloat(getComputedStyle(el).lineHeight) || 20;
    el.style.height = "0px";
    const min = line * rows;
    const max = line * Math.max(maxRows, rows);
    const next = Math.min(Math.max(el.scrollHeight, min), max);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden";
  };
  useLayoutEffect(grow);

  return (
    <>
      <style href="ui-textarea" precedence="default">
        {css}
      </style>
      <Field label={label} help={help} error={error} required={required} width={width} className={className}>
        {({ id, describedBy, invalid }) => (
          <div className="ui-control ui-textarea" data-invalid={invalid || undefined} data-disabled={disabled || undefined}>
            <textarea
              id={id}
              ref={(el) => {
                inner.current = el;
                if (typeof ref === "function") ref(el);
                else if (ref) ref.current = el;
              }}
              className="ui-control__input ui-textarea__input"
              rows={rows}
              value={value}
              defaultValue={defaultValue}
              aria-invalid={invalid || undefined}
              aria-describedby={describedBy}
              disabled={disabled}
              required={required}
              onChange={(e) => {
                grow();
                onChange?.(e);
              }}
              {...rest}
            />
          </div>
        )}
      </Field>
    </>
  );
}

const css = /* css */ `
.ui-textarea { padding: 7px 10px; }
.ui-textarea__input { height: auto; min-height: 20px; resize: none; line-height: 20px; }
`;
