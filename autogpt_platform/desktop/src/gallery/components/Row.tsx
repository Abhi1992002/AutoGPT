import type { ReactNode } from "react";

interface Props {
  label: string;
  layout?: "inline" | "stack" | "wide" | "fields";
  children: ReactNode;
}

export function Row({ label, layout = "inline", children }: Props) {
  const className = ["row__items", layout !== "inline" && `row__items--${layout}`].filter(Boolean).join(" ");
  return (
    <div className="row">
      <span className="row__label small">{label}</span>
      <div className={className}>{children}</div>
    </div>
  );
}
