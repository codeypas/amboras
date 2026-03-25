import type { PropsWithChildren, ReactNode } from "react";

type SectionCardProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}>;

export function SectionCard({ title, subtitle, actions, children }: SectionCardProps) {
  return (
    <section className="panel-card">
      <header className="panel-header">
        <div>
          <p className="section-kicker">{title}</p>
          {subtitle ? <h3>{subtitle}</h3> : null}
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}
