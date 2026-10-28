import { File, Upload, X } from "lucide-react";
import { useRef, useState, type DragEvent, type ReactNode } from "react";
import { Field } from "./field";
import { Icon } from "./icon";

/*
 * File input – a control box you click or drop files on. Picked files are listed below with their size
 * and a remove button. The box lights up while a file is dragged over it.
 */

export type FileInputProps = {
  label?: ReactNode;
  help?: ReactNode;
  error?: ReactNode;
  accept?: string;
  multiple?: boolean;
  /** The files to show – makes it controlled */
  files?: File[];
  onChange?: (files: File[]) => void;
  /** Text in the box; defaults to "Choose a file" / "Choose files" */
  prompt?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  width?: number | string;
  className?: string;
};

const size = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)} MB` : n >= 1e3 ? `${Math.round(n / 1e3)} KB` : `${n} B`);

export function FileInput({ label, help, error, accept, multiple = false, files, onChange, prompt, required, disabled, width, className }: FileInputProps) {
  const [inner, setInner] = useState<File[]>([]);
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const list = files ?? inner;

  const set = (next: File[]) => {
    const picked = multiple ? next : next.slice(0, 1);
    if (files === undefined) setInner(picked);
    onChange?.(picked);
  };
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setOver(false);
    if (disabled) return;
    set([...list, ...Array.from(e.dataTransfer.files)]);
  };

  return (
    <>
      <style href="ui-file" precedence="default">
        {css}
      </style>
      <Field label={label} help={help} error={error} required={required} width={width} className={className}>
        {({ id, describedBy, invalid }) => (
          <div className="ui-file">
            <div
              className="ui-control ui-file__box"
              data-invalid={invalid || undefined}
              data-disabled={disabled || undefined}
              data-over={over || undefined}
              onDragOver={(e) => {
                e.preventDefault();
                if (!disabled) setOver(true);
              }}
              onDragLeave={() => setOver(false)}
              onDrop={onDrop}
              onClick={() => input.current?.click()}
            >
              <input
                ref={input}
                id={id}
                className="ui-file__input"
                type="file"
                accept={accept}
                multiple={multiple}
                disabled={disabled}
                required={required}
                aria-invalid={invalid || undefined}
                aria-describedby={describedBy}
                onChange={(e) => {
                  set([...list, ...Array.from(e.currentTarget.files ?? [])]);
                  e.currentTarget.value = "";
                }}
              />
              <span className="ui-control__affix">
                <Icon icon={Upload} />
              </span>
              <span className="ui-file__prompt">{prompt ?? (multiple ? "Choose files" : "Choose a file")}</span>
              <span className="ui-file__hint">or drop {multiple ? "them" : "it"} here</span>
            </div>
            {list.length > 0 && (
              <ul className="ui-file__list">
                {list.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="ui-file__item">
                    <Icon icon={File} tone="subtle" />
                    <span className="ui-file__name" title={f.name}>
                      {f.name}
                    </span>
                    <span className="ui-file__size">{size(f.size)}</span>
                    <button type="button" className="ui-control__btn" aria-label={`Remove ${f.name}`} onClick={() => set(list.filter((_, j) => j !== i))}>
                      <Icon icon={X} size="xs" />
                    </button>
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

const css = /* css */ `
.ui-file { display: grid; gap: 6px; }
.ui-file__box { cursor: pointer; }
.ui-file__box[data-over] { border-color: var(--ds-ink); background: var(--ds-field); }
.ui-file__box:hover { background: var(--ds-surface-hover); }
.ui-file__input { position: absolute; width: 1px; height: 1px; margin: 0; opacity: 0; pointer-events: none; }
.ui-file__input:focus-visible ~ .ui-control__affix { color: var(--ds-ink); }
.ui-file__box:has(.ui-file__input:focus-visible) { border-color: var(--ds-ink); box-shadow: 0 0 0 4px var(--ui-ctl-halo); }
.ui-file__prompt { color: var(--ds-ink); }
.ui-file__hint { margin-left: auto; font-weight: 400; color: var(--ds-muted); white-space: nowrap; }
.ui-file__list { display: grid; gap: 2px; margin: 0; padding: 0; list-style: none; }
.ui-file__item { display: flex; align-items: center; gap: 8px; min-height: 30px; padding: 0 8px; border-radius: 8px; background: var(--ds-tray); font: 500 13px/20px var(--font-sans); color: var(--ds-text); animation: ui-file-in 220ms var(--ds-ease) both; }
.ui-file__name { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-file__size { font-weight: 400; color: var(--ds-muted); font-variant-numeric: tabular-nums; }
@keyframes ui-file-in { from { opacity: 0; transform: translateY(-3px); } }
@media (prefers-reduced-motion: reduce) { .ui-file__item { animation: none; } }
`;
