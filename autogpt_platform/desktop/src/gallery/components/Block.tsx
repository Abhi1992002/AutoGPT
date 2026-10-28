import type { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  /** Where the component comes from */
  source?: "affectui" | "designed";
  children: ReactNode;
}

export function Block({ title, description, source = "designed", children }: Props) {
  return (
    <section className="block">
      <div className="block__head">
        <h3 className="block__title heading">{title}</h3>
        <span className="block__source caption" data-source={source}>
          {source === "affectui" ? "Ported from AffectUI" : "Designed to match"}
        </span>
      </div>
      {description && <p className="block__description body text-muted">{description}</p>}
      <div className="block__rows">{children}</div>
    </section>
  );
}
