import type { ReactNode } from "react";

/*
 * Separator – a hairline between things, with an optional label in the middle.
 * The line is the AffectUI card hairline (#ececec, dark rgba(255,255,255,0.08)).
 */

export type SeparatorProps = {
  orientation?: "horizontal" | "vertical";
  children?: ReactNode;
  className?: string;
};

export function Separator({ orientation = "horizontal", children, className }: SeparatorProps) {
  return (
    <>
      <style href="ui-separator" precedence="default">
        {css}
      </style>
      <div
        className={["ui-sep", className].filter(Boolean).join(" ")}
        data-orientation={orientation}
        role={children ? undefined : "separator"}
        aria-orientation={children ? undefined : orientation}
      >
        {children != null && <span className="ui-sep__label">{children}</span>}
      </div>
    </>
  );
}

const css = /* css */ `
.ui-sep { display: flex; align-items: center; gap: 10px; width: 100%; color: var(--ds-muted); }
.ui-sep::before, .ui-sep::after { content: ""; flex: 1; height: 1px; background: var(--ds-hairline); }
.ui-sep__label { flex: none; font: 500 12px/16px var(--font-sans); }
.ui-sep[data-orientation="vertical"] { flex-direction: column; width: auto; height: 100%; min-height: 16px; align-self: stretch; }
.ui-sep[data-orientation="vertical"]::before, .ui-sep[data-orientation="vertical"]::after { width: 1px; height: auto; }
`;
