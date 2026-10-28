import { AtSign, Eye, EyeOff, Globe, Phone } from "lucide-react";
import { useState, type ComponentPropsWithRef, type ReactNode } from "react";
import { Field } from "./field";
import { Icon } from "./icon";

/*
 * Input – a single-line text field with label, help and error.
 * Types: text, email (@ in front), password (show / hide), number, amount (currency in front,
 * decimal keyboard), url (globe in front), tel (phone in front). Prefix and suffix take any content.
 */

export type InputType = "text" | "email" | "password" | "number" | "amount" | "url" | "tel";

export type InputProps = Omit<ComponentPropsWithRef<"input">, "type" | "prefix" | "size"> & {
  type?: InputType;
  label?: ReactNode;
  help?: ReactNode;
  error?: ReactNode;
  /** Content in front of the text, e.g. an icon or "https://" */
  prefix?: ReactNode;
  /** Content after the text, e.g. a unit */
  suffix?: ReactNode;
  /** The symbol in front of an amount; defaults to "$" */
  currency?: string;
  width?: number | string;
};

export function Input({ type = "text", label, help, error, prefix, suffix, currency = "$", width, className, disabled, required, ...rest }: InputProps) {
  const [shown, setShown] = useState(false);
  const native = type === "amount" ? "text" : type === "password" && shown ? "text" : type;
  const lead =
    prefix ??
    (type === "email" ? <Icon icon={AtSign} /> : type === "url" ? <Icon icon={Globe} /> : type === "tel" ? <Icon icon={Phone} /> : type === "amount" ? currency : null);
  const inputMode = rest.inputMode ?? (type === "amount" ? "decimal" : type === "number" ? "numeric" : undefined);

  return (
    <Field label={label} help={help} error={error} required={required} width={width} className={className}>
      {({ id, describedBy, invalid }) => (
        <div className="ui-control" data-invalid={invalid || undefined} data-disabled={disabled || undefined}>
          {lead != null && <span className="ui-control__affix">{lead}</span>}
          <input
            id={id}
            className="ui-control__input"
            type={native}
            inputMode={inputMode}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            disabled={disabled}
            required={required}
            {...rest}
          />
          {suffix != null && <span className="ui-control__affix">{suffix}</span>}
          {type === "password" && (
            <button type="button" className="ui-control__btn" aria-label={shown ? "Hide password" : "Show password"} aria-pressed={shown} onClick={() => setShown((s) => !s)}>
              <Icon icon={shown ? EyeOff : Eye} />
            </button>
          )}
        </div>
      )}
    </Field>
  );
}
