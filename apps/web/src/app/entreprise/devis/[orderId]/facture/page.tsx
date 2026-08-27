import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InvoiceDocument } from "@/components/InvoiceDocument";
import { PrintButton } from "@titan-kinetic/ui";

export default async function EntrepriseFacturePage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const supabase = await createClient();

  const [{ data: order }, { data: invoice }, { data: organization }] = await Promise.all([
    supabase
      .from("orders")
      .select("reference, total_ht, total_vat, total_ttc, order_items(label, quantity, unit_price_ht, vat_rate)")
      .eq("id", orderId)
      .maybeSingle(),
    supabase
      .from("invoices")
      .select("number, issued_on, due_on, paid_at, billed_to")
      .eq("order_id", orderId)
      .maybeSingle(),
    supabase
      .from("organization_settings")
      .select("legal_name, legal_form, siret, address_line1, address_line2, postal_code, city, contact_email")
      .single(),
  ]);

  if (!order || !invoice) notFound();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-between border-b border-border px-6 py-4 print:hidden">
        <Link href="/entreprise/devis" className="font-body text-sm text-accent-text hover:underline">
          ← Retour aux devis
        </Link>
        <PrintButton />
      </div>
      <InvoiceDocument
        organization={organization}
        invoice={invoice}
        order={order}
        items={order.order_items ?? []}
      />
    </div>
  );
}
