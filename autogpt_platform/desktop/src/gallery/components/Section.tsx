import type { ReactNode } from "react";

interface Props {
  title: string;
  description: string;
  children: ReactNode;
}

export function Section({ title, description, children }: Props) {
  return (
    <section className="section">
      <h2 className="section__title">{title}</h2>
      <p className="section__description">{description}</p>
      <div className="section__rows">{children}</div>
    </section>
  );
}
