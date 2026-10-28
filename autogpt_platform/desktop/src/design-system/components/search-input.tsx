import { Search, X } from "lucide-react";
import { useState, type ComponentPropsWithRef } from "react";
import { Icon } from "./icon";

/*
 * Search input – a magnifier in front, a clear button once there is text, Escape clears.
 */

export type SearchInputProps = Omit<ComponentPropsWithRef<"input">, "type" | "value" | "defaultValue" | "onChange" | "size"> & {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  width?: number | string;
};

export function SearchInput({ value, defaultValue = "", onChange, width, className, disabled, onKeyDown, placeholder = "Search…", ...rest }: SearchInputProps) {
  const [inner, setInner] = useState(defaultValue);
  const text = value ?? inner;
  const set = (next: string) => {
    if (value === undefined) setInner(next);
    onChange?.(next);
  };

  return (
    <>
      <style href="ui-search" precedence="default">
        {css}
      </style>
      <div
        className={["ui-control ui-search", className].filter(Boolean).join(" ")}
        data-disabled={disabled || undefined}
        style={{ width: typeof width === "number" ? `${width}px` : width }}
        role="search"
      >
        <span className="ui-control__affix">
          <Icon icon={Search} />
        </span>
        <input
          className="ui-control__input"
          type="search"
          value={text}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => set(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && text) {
              e.preventDefault();
              set("");
            }
            onKeyDown?.(e);
          }}
          {...rest}
        />
        {text && (
          <button type="button" className="ui-control__btn" aria-label="Clear search" onClick={() => set("")}>
            <Icon icon={X} size="xs" />
          </button>
        )}
      </div>
    </>
  );
}

const css = /* css */ `
.ui-search { width: 100%; }
`;
