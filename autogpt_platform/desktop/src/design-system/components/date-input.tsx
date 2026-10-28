import { Calendar, CalendarClock, Clock } from "lucide-react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { Field } from "./field";
import { Icon } from "./icon";

/*
 * Date, Time and DateTime inputs – the native pickers inside the shared control box, with an icon
 * in front. Values are the native strings: "2026-10-28", "09:30", "2026-10-28T09:30".
 */

type Shared = Omit<ComponentPropsWithRef<"input">, "type" | "size"> & {
  label?: ReactNode;
  help?: ReactNode;
  error?: ReactNode;
  width?: number | string;
};

export type DateInputProps = Shared;
export type TimeInputProps = Shared;
export type DateTimeInputProps = Shared;

function Temporal({ type, icon, label, help, error, width, className, disabled, required, ...rest }: Shared & { type: "date" | "time" | "datetime-local"; icon: ReactNode }) {
  return (
    <>
      <style href="ui-date" precedence="default">
        {css}
      </style>
      <Field label={label} help={help} error={error} required={required} width={width} className={className}>
        {({ id, describedBy, invalid }) => (
          <div className="ui-control ui-date" data-invalid={invalid || undefined} data-disabled={disabled || undefined}>
            <span className="ui-control__affix">{icon}</span>
            <input id={id} className="ui-control__input ui-date__input" type={type} aria-invalid={invalid || undefined} aria-describedby={describedBy} disabled={disabled} required={required} {...rest} />
          </div>
        )}
      </Field>
    </>
  );
}

export function DateInput(props: DateInputProps) {
  return <Temporal type="date" icon={<Icon icon={Calendar} />} {...props} />;
}

export function TimeInput(props: TimeInputProps) {
  return <Temporal type="time" icon={<Icon icon={Clock} />} {...props} />;
}

export function DateTimeInput(props: DateTimeInputProps) {
  return <Temporal type="datetime-local" icon={<Icon icon={CalendarClock} />} {...props} />;
}

const css = /* css */ `
.ui-date__input { font-variant-numeric: tabular-nums; }
.ui-date__input::-webkit-calendar-picker-indicator { width: 16px; height: 16px; margin: 0 -2px 0 4px; opacity: 0.55; cursor: pointer; border-radius: 4px; transition: opacity 160ms ease; }
.ui-date__input::-webkit-calendar-picker-indicator:hover { opacity: 1; }
.ui-date__input::-webkit-datetime-edit-fields-wrapper { padding: 0; }
.ui-date__input::-webkit-datetime-edit-day-field:focus, .ui-date__input::-webkit-datetime-edit-month-field:focus, .ui-date__input::-webkit-datetime-edit-year-field:focus,
.ui-date__input::-webkit-datetime-edit-hour-field:focus, .ui-date__input::-webkit-datetime-edit-minute-field:focus, .ui-date__input::-webkit-datetime-edit-ampm-field:focus { background: var(--ds-ink); color: var(--ds-surface); border-radius: 3px; outline: none; }
.ui-date__input:invalid { color: var(--ds-muted); }
:where(.dark, [data-theme="dark"]) .ui-date__input::-webkit-calendar-picker-indicator { filter: invert(1); }
`;
