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
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="border border-border p-10">
        <div className="mb-10 flex items-start justify-between gap-6">
          <div>
            <p className="font-display text-xl font-bold text-foreground">
              {organization?.legal_name ?? "Titan Kinetic"}
            </p>
            {organization?.legal_form && (
              <p className="font-body text-xs text-foreground-muted">{organization.legal_form}</p>
            )}
            <p className="font-body text-xs text-foreground-muted">{organization?.address_line1}</p>
            {organization?.address_line2 && (
              <p className="font-body text-xs text-foreground-muted">{organization.address_line2}</p>
            )}
            <p className="font-body text-xs text-foreground-muted">
              {[organization?.postal_code, organization?.city].filter(Boolean).join(" ")}
            </p>
            {organization?.siret && (
              <p className="font-body text-xs text-foreground-muted">SIRET : {organization.siret}</p>
            )}
            {organization?.contact_email && (
              <p className="font-body text-xs text-foreground-muted">{organization.contact_email}</p>
            )}
          </div>
          <div className="text-right">
            <h1 className="font-display text-2xl font-bold text-foreground">Facture</h1>
            <p className="font-mono-label text-sm text-accent-text">{invoice.number}</p>
            <p className="mt-2 font-body text-xs text-foreground-muted">Référence devis : {order.reference}</p>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-6">
          <div>
            <p className="font-mono-label text-[10px] uppercase tracking-wide text-foreground-muted">
              Facturé à
            </p>
            <p className="mt-1 whitespace-pre-line font-body text-sm text-foreground">{invoice.billed_to}</p>
          </div>
          <div className="text-right">
            <p className="font-mono-label text-[10px] uppercase tracking-wide text-foreground-muted">
              Date d&apos;émission
            </p>
            <p className="mt-1 font-body text-sm text-foreground">{formatDate(invoice.issued_on)}</p>
            {invoice.due_on && (
              <>
                <p className="mt-3 font-mono-label text-[10px] uppercase tracking-wide text-foreground-muted">
                  Échéance
                </p>
                <p className="mt-1 font-body text-sm text-foreground">{formatDate(invoice.due_on)}</p>
              </>
            )}
            {invoice.paid_at && (
              <p className="mt-3 font-body text-sm font-semibold text-success">
                Payée le {formatDate(invoice.paid_at)}
              </p>
            )}
          </div>
        </div>

        <table className="w-full border-collapse font-body text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 font-mono-label text-[10px] uppercase tracking-wide text-foreground-muted">
                Désignation
              </th>
              <th className="py-2 text-right font-mono-label text-[10px] uppercase tracking-wide text-foreground-muted">
                Qté
              </th>
              <th className="py-2 text-right font-mono-label text-[10px] uppercase tracking-wide text-foreground-muted">
                PU HT
              </th>
              <th className="py-2 text-right font-mono-label text-[10px] uppercase tracking-wide text-foreground-muted">
                Total HT
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-border">
                <td className="py-2 text-foreground">{item.label}</td>
                <td className="py-2 text-right text-foreground">{item.quantity}</td>
                <td className="py-2 text-right text-foreground">{formatEuro(item.unit_price_ht)}</td>
                <td className="py-2 text-right text-foreground">
                  {formatEuro(item.unit_price_ht * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <div className="w-56 font-body text-sm">
            <div className="flex justify-between py-1 text-foreground-muted">
              <span>Total HT</span>
              <span>{formatEuro(order.total_ht)}</span>
            </div>
            <div className="flex justify-between py-1 text-foreground-muted">
              <span>TVA</span>
              <span>{formatEuro(order.total_vat)}</span>
            </div>
            <div className="flex justify-between border-t border-border py-2 font-semibold text-foreground">
              <span>Total TTC</span>
              <span>{formatEuro(order.total_ttc)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
