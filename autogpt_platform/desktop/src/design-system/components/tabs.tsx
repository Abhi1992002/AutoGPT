import { useId, useState, type ReactNode } from "react";
import { SegmentedControl, type SegmentOption } from "./segmented-control";

/*
 * Tabs – the AffectUI segmented control in its "tabs" role, with the panels wired up.
 * "underline" (default) for page sections, "tray" for a compact switch inside a card.
 */

export type Tab<T extends string = string> = SegmentOption<T> & { content: ReactNode };

export type TabsProps<T extends string = string> = {
  tabs: Tab<T>[];
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
  variant?: "underline" | "tray";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  "aria-label"?: string;
  className?: string;
};

export function Tabs<T extends string = string>({ tabs, value, defaultValue, onChange, variant = "underline", size = "md", fullWidth, "aria-label": ariaLabel, className }: TabsProps<T>) {
  const id = useId();
  const [inner, setInner] = useState<T | undefined>(defaultValue ?? tabs.find((t) => !t.disabled)?.value);
  const current = value !== undefined ? value : inner;
  const active = tabs.find((t) => t.value === current);
  return (
    <>
      <style href="ui-tabs" precedence="default">
        {css}
      </style>
      <div className={["ui-tabs", className].filter(Boolean).join(" ")}>
        <SegmentedControl
          kind="tabs"
          variant={variant}
          size={size}
          fullWidth={fullWidth}
          aria-label={ariaLabel}
          value={current}
          onChange={(v) => {
            if (value === undefined) setInner(v);
            onChange?.(v);
          }}
          options={tabs.map(({ content: _content, ...o }) => ({ ...o, controls: `${id}-${o.value}` }))}
        />
        {active && (
          <div key={String(active.value)} className="ui-tabs__panel" id={`${id}-${active.value}`} role="tabpanel" tabIndex={0}>
            {active.content}
          </div>
        )}
      </div>
    </>
  );
}

const css = /* css */ `
.ui-tabs { display: grid; gap: 14px; min-width: 0; font-family: var(--font-sans); color: var(--ds-text); }
.ui-tabs__panel { min-width: 0; font: 400 14px/20px var(--font-sans); animation: ui-tabs-in 260ms var(--ds-ease) both; }
.ui-tabs__panel:focus-visible { outline: 2px solid var(--ds-focus); outline-offset: 4px; border-radius: 6px; }
@keyframes ui-tabs-in { from { opacity: 0; transform: translateY(3px); } }
@media (prefers-reduced-motion: reduce) { .ui-tabs__panel { animation: none; } }
`;
