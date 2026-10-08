import type { ReactNode } from "react";

export function Section({
  id,
  title,
  note,
  children,
}: {
  id: string;
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="flex flex-col gap-5 border-t border-border pt-8"
    >
      <header className="flex flex-col gap-1">
        <h2 id={`${id}-title`} className="text-h2">
          {title}
        </h2>
        {note && <p className="text-small text-text-muted">{note}</p>}
      </header>
      {children}
    </section>
  );
}

export function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-4">{children}</div>
      <figcaption className="text-caption text-text-muted">{label}</figcaption>
    </figure>
  );
}
