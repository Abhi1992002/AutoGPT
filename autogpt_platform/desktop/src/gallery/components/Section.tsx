import type { ReactNode } from "react";

interface Props {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}

export function Section({ id, title, description, children }: Props) {
  return (
    <section className="section" id={id}>
      <h2 className="section__title title">{title}</h2>
      <p className="section__description body text-muted">{description}</p>
      <div className="section__blocks">{children}</div>
    </section>
  );
}
