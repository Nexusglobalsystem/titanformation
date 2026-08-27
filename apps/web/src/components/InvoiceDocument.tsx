function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function formatEuro(value: number) {
  return value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

export function InvoiceDocument({
  organization,
  invoice,
  order,
  items,
}: {
  organization: {
    legal_name: string | null;
    legal_form: string | null;
    siret: string | null;
    address_line1: string | null;
    address_line2: string | null;
    postal_code: string | null;
    city: string | null;
    contact_email: string | null;
  } | null;
  invoice: { number: string; issued_on: string; due_on: string | null; paid_at: string | null; billed_to: string };
  order: { reference: string; total_ht: number; total_vat: number; total_ttc: number };
  items: { label: string; quantity: number; unit_price_ht: number; vat_rate: number }[];
}) {
  const [billedName, ...billedRest] = invoice.billed_to.split("\n");

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 [print-color-adjust:exact] [-webkit-print-color-adjust:exact] print:px-0 print:py-0">
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm print:rounded-none print:border-0 print:shadow-none">
        <div className="flex items-start justify-between gap-6 bg-primary px-10 py-8 print:bg-primary">
          <div className="flex items-center gap-4">
            <span
              aria-hidden="true"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-DEFAULT bg-accent font-display text-base font-bold text-on-accent"
            >
              TK
            </span>
            <div>
              <p className="font-display text-lg font-bold text-on-primary">
                {organization?.legal_name ?? "Titan Kinetic"}
              </p>
              {organization?.legal_form && (
                <p className="font-body text-xs text-on-primary/70">{organization.legal_form}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono-label text-[10px] uppercase tracking-[0.15em] text-on-primary/70">Facture</p>
            <p className="mt-1 font-display text-2xl font-bold text-accent">{invoice.number}</p>
          </div>
        </div>

        <div className="px-10 pt-8">
          <div className="flex flex-wrap items-start justify-between gap-6 border-b border-border pb-8">
            <div className="flex flex-col gap-3 font-body text-xs text-foreground-muted">
              <p>{organization?.address_line1}</p>
              {organization?.address_line2 && <p>{organization.address_line2}</p>}
              <p>{[organization?.postal_code, organization?.city].filter(Boolean).join(" ")}</p>
              <p className="flex flex-col gap-0.5">
                {organization?.siret && <span>SIRET : {organization.siret}</span>}
                {organization?.contact_email && <span>{organization.contact_email}</span>}
              </p>
            </div>
            <div className="text-right font-body text-xs text-foreground-muted">
              <p className="font-mono-label text-[10px] uppercase tracking-wide">Référence devis</p>
              <p className="mt-0.5 text-foreground">{order.reference}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 py-8 sm:grid-cols-3">
            <div>
              <p className="font-mono-label text-[10px] uppercase tracking-wide text-foreground-muted">
                Facturé à
              </p>
              <p className="mt-1.5 font-body text-sm font-semibold text-foreground">{billedName}</p>
              {billedRest.map((line, i) => (
                <p key={i} className="font-body text-sm text-foreground-muted">
                  {line}
                </p>
              ))}
            </div>
            <div>
              <p className="font-mono-label text-[10px] uppercase tracking-wide text-foreground-muted">
                Date d&apos;émission
              </p>
              <p className="mt-1.5 font-body text-sm text-foreground">{formatDate(invoice.issued_on)}</p>
              {invoice.due_on && (
                <>
                  <p className="mt-3 font-mono-label text-[10px] uppercase tracking-wide text-foreground-muted">
                    Échéance
                  </p>
                  <p className="mt-1.5 font-body text-sm text-foreground">{formatDate(invoice.due_on)}</p>
                </>
              )}
            </div>
            <div>
              <p className="font-mono-label text-[10px] uppercase tracking-wide text-foreground-muted">Statut</p>
              <span
                className={
                  "mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-body text-xs font-medium " +
                  (invoice.paid_at ? "bg-success-bg text-success" : "bg-warning-bg text-warning")
                }
              >
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
                {invoice.paid_at ? `Payée le ${formatDate(invoice.paid_at)}` : "En attente de paiement"}
              </span>
            </div>
          </div>

          <table className="w-full border-collapse font-body text-sm">
            <thead>
              <tr className="border-y border-border bg-surface-elevated text-left">
                <th className="py-2.5 pl-3 font-mono-label text-[10px] uppercase tracking-wide text-foreground-muted">
                  Désignation
                </th>
                <th className="py-2.5 pl-6 text-right font-mono-label text-[10px] uppercase tracking-wide text-foreground-muted">
                  Qté
                </th>
                <th className="py-2.5 pl-6 text-right font-mono-label text-[10px] uppercase tracking-wide text-foreground-muted">
                  PU HT
                </th>
                <th className="py-2.5 pr-3 text-right font-mono-label text-[10px] uppercase tracking-wide text-foreground-muted">
                  Total HT
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="py-3 pl-3 text-foreground">{item.label}</td>
                  <td className="py-3 pl-6 text-right tabular-nums text-foreground">{item.quantity}</td>
                  <td className="py-3 pl-6 text-right tabular-nums text-foreground">{formatEuro(item.unit_price_ht)}</td>
                  <td className="py-3 pr-3 text-right tabular-nums font-medium text-foreground">
                    {formatEuro(item.unit_price_ht * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end py-8">
            <div className="w-64 font-body text-sm">
              <div className="flex justify-between py-1.5 text-foreground-muted">
                <span>Total HT</span>
                <span className="tabular-nums">{formatEuro(order.total_ht)}</span>
              </div>
              <div className="flex justify-between py-1.5 text-foreground-muted">
                <span>TVA</span>
                <span className="tabular-nums">{formatEuro(order.total_vat)}</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between rounded-DEFAULT bg-primary px-3 py-2.5">
                <span className="font-body text-sm font-medium text-on-primary/80">Total TTC</span>
                <span className="font-display text-lg font-bold tabular-nums text-accent">
                  {formatEuro(order.total_ttc)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border px-10 py-5">
          <p className="font-body text-[11px] text-foreground-muted">
            Titan Kinetic — organisme de formation certifié Qualiopi.
            {organization?.contact_email && ` Questions : ${organization.contact_email}.`}
          </p>
        </div>
      </div>
    </div>
  );
}
