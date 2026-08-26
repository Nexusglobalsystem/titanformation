export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10 flex flex-col gap-3">
      <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
      <div className="flex flex-col gap-2 font-body text-sm leading-relaxed text-foreground-muted">
        {children}
      </div>
    </section>
  );
}

export function LegalField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <p>
      <span className="font-medium text-foreground">{label} : </span>
      {value}
    </p>
  );
}

export function IncompleteNotice() {
  return (
    <p className="rounded-DEFAULT border border-dashed border-border px-4 py-3 text-foreground-muted">
      Ces informations n&apos;ont pas encore été complétées par l&apos;éditeur du site.
    </p>
  );
}
