import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Field } from "./field";
import { Icon } from "./icon";
import { PopoverStyle, usePopover } from "./popover";

/*
 * Select – a control box that opens a list of options. Arrow keys move, Enter or Space picks,
 * Escape closes, typing jumps to a matching label. The list is the AffectUI email-draft recipient menu:
 * 8px rows with an optional second line and a tick on the picked one.
 */

export type SelectOption<T extends string = string> = {
  value: T;
  label: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
};

export type SelectProps<T extends string = string> = {
  options: SelectOption<T>[];
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
  placeholder?: string;
  label?: ReactNode;
  help?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  width?: number | string;
  className?: string;
};

export function Select<T extends string = string>({ options, value, defaultValue, onChange, placeholder = "Select…", label, help, error, required, disabled, width, className }: SelectProps<T>) {
  const [inner, setInner] = useState<T | undefined>(defaultValue);
  const current = value !== undefined ? value : inner;
  const selected = options.find((o) => o.value === current);
  const { open, setOpen, root, trigger } = usePopover();
  const [active, setActive] = useState(-1);
  const list = useRef<HTMLUListElement>(null);
  const listId = useId();
  const typed = useRef({ text: "", at: 0 });

  const pick = (opt: SelectOption<T>) => {
    if (opt.disabled) return;
    if (value === undefined) setInner(opt.value);
    if (opt.value !== current) onChange?.(opt.value);
    setOpen(false);
    trigger.current?.focus();
  };

  const move = (from: number, step: number) => {
    let i = from;
    for (let n = 0; n < options.length; n++) {
      i = (i + step + options.length) % options.length;
      if (!options[i].disabled) return i;
    }
    return from;
  };

  useEffect(() => {
    if (!open) return;
    const at = options.findIndex((o) => o.value === current);
    setActive(at >= 0 ? at : move(-1, 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || active < 0) return;
    list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (!open && ["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") (e.preventDefault(), setActive((a) => move(a, 1)));
    else if (e.key === "ArrowUp") (e.preventDefault(), setActive((a) => move(a, -1)));
    else if (e.key === "Home") (e.preventDefault(), setActive(move(-1, 1)));
    else if (e.key === "End") (e.preventDefault(), setActive(move(0, -1)));
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (options[active]) pick(options[active]);
    } else if (e.key === "Tab") setOpen(false);
    else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
      const now = Date.now();
      typed.current = { text: now - typed.current.at > 600 ? e.key : typed.current.text + e.key, at: now };
      const q = typed.current.text.toLowerCase();
      const hit = options.findIndex((o) => !o.disabled && String(textOf(o.label)).toLowerCase().startsWith(q));
      if (hit >= 0) setActive(hit);
    }
  };

  return (
    <>
      <style href="ui-select" precedence="default">
        {css}
      </style>
      <PopoverStyle />
      <Field label={label} help={help} error={error} required={required} width={width} className={className}>
        {({ id, describedBy, invalid }) => (
          <div ref={root} className="ui-popover ui-select" data-open={open || undefined}>
            <button
              ref={trigger}
              id={id}
              type="button"
              className="ui-control ui-select__trigger"
              role="combobox"
              aria-expanded={open}
              aria-haspopup="listbox"
              aria-controls={listId}
              aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
              aria-invalid={invalid || undefined}
              aria-describedby={describedBy}
              data-invalid={invalid || undefined}
              data-disabled={disabled || undefined}
              data-placeholder={!selected || undefined}
              disabled={disabled}
              onClick={() => setOpen(!open)}
              onKeyDown={onKeyDown}
            >
              {selected?.icon && <span className="ui-control__affix ui-select__icon">{selected.icon}</span>}
              <span className="ui-select__value">{selected ? selected.label : placeholder}</span>
              <span className="ui-select__chevron" aria-hidden="true">
                <Icon icon={ChevronDown} />
              </span>
            </button>
            {open && (
              <ul ref={list} className="ui-popover__panel ui-select__list" id={listId} role="listbox" aria-labelledby={id}>
                {options.map((o, i) => (
                  <li
                    key={String(o.value)}
                    id={`${listId}-${i}`}
                    className="ui-select__option"
                    role="option"
                    aria-selected={o.value === current}
                    aria-disabled={o.disabled || undefined}
                    data-index={i}
                    data-active={i === active || undefined}
                    onPointerMove={() => !o.disabled && setActive(i)}
                    onClick={() => pick(o)}
                  >
                    {o.icon && <span className="ui-select__icon">{o.icon}</span>}
                    <span className="ui-select__text">
                      <span className="ui-select__label">{o.label}</span>
                      {o.description && <small className="ui-select__desc">{o.description}</small>}
                    </span>
                    {o.value === current && (
                      <span className="ui-select__tick" aria-hidden="true">
                        <Icon icon={Check} />
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Field>
    </>
  );
}

const textOf = (node: ReactNode): string => (typeof node === "string" || typeof node === "number" ? String(node) : Array.isArray(node) ? node.map(textOf).join("") : "");

const css = /* css */ `
.ui-select { display: flex; width: 100%; }
.ui-select__trigger { cursor: pointer; text-align: left; }
.ui-select__trigger:focus-visible { outline: none; }
.ui-select__value { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-select__trigger[data-placeholder] .ui-select__value { color: var(--ds-muted); }
.ui-select__chevron { display: grid; flex: none; margin-right: -2px; color: var(--ds-muted); transition: transform 220ms var(--ds-ease); }
.ui-select[data-open] .ui-select__chevron { transform: rotate(180deg); }
.ui-select__list { display: grid; gap: 2px; margin: 0; padding: 5px; list-style: none; }
.ui-select__option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 8px;
  border-radius: 8px;
  cursor: pointer;
  color: var(--ds-text);
  transition: background-color 160ms ease, color 160ms ease;
}
.ui-select__option[data-active] { background: var(--ds-hover); color: var(--ds-ink); }
.ui-select__option[aria-selected="true"] { color: var(--ds-ink); }
.ui-select__option[aria-disabled] { opacity: 0.55; color: var(--ds-ink); cursor: default; }
.ui-select__icon { display: grid; place-items: center; flex: none; color: var(--ds-soft); }
.ui-select__text { display: grid; flex: 1; min-width: 0; overflow-wrap: anywhere; }
.ui-select__label { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-select__desc { font: 400 12px/16px var(--font-sans); color: var(--ds-muted); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-select__tick { display: grid; flex: none; color: var(--ds-ink); }
@media (prefers-reduced-motion: reduce) { .ui-select__chevron, .ui-select__option { transition: none; } }
`;
