import type { ReactNode } from "react";

interface Props {
  label: string;
  layout?: "inline" | "stack" | "wide";
  children: ReactNode;
}

export function Row({ label, layout = "inline", children }: Props) {
  const className = ["row__items", layout === "stack" && "row__items--stack", layout === "wide" && "row__items--wide"]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="row">
      <span className="row__label">{label}</span>
      <div className={className}>{children}</div>
    </div>
  );
}
