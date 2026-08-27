"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type DevisActionState = { error?: string } | undefined;

function revalidateDevis() {
  revalidatePath("/admin/devis");
  revalidatePath("/entreprise/devis");
}

export async function acceptQuoteAction(
  _prev: DevisActionState,
  formData: FormData,
): Promise<DevisActionState> {
  const orderId = formData.get("orderId");
  if (typeof orderId !== "string") return { error: "Devis invalide." };

  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc("has_permission", { p_key: "devis.accept" });
  if (!allowed) return { error: "Vous n'avez pas la permission d'accepter un devis." };

  const { data, error } = await supabase
    .from("orders")
    .update({ status: "en_attente_paiement" })
    .eq("id", orderId)
    .eq("status", "devis")
    .select("id");

  if (error) return { error: "Impossible d'accepter ce devis : " + error.message };
  if (!data || data.length === 0) return { error: "Ce devis n'est plus au statut « demandé »." };

  revalidateDevis();
  return undefined;
}

export async function rejectQuoteAction(
  _prev: DevisActionState,
  formData: FormData,
): Promise<DevisActionState> {
  const orderId = formData.get("orderId");
  if (typeof orderId !== "string") return { error: "Devis invalide." };

  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc("has_permission", { p_key: "devis.reject" });
  if (!allowed) return { error: "Vous n'avez pas la permission de refuser un devis." };

  const { data, error } = await supabase
    .from("orders")
    .update({ status: "annulee" })
    .eq("id", orderId)
    .eq("status", "devis")
    .select("id");

  if (error) return { error: "Impossible de refuser ce devis : " + error.message };
  if (!data || data.length === 0) return { error: "Ce devis n'est plus au statut « demandé »." };

  revalidateDevis();
  return undefined;
}

export async function generateInvoiceAction(
  _prev: DevisActionState,
  formData: FormData,
): Promise<DevisActionState> {
  const orderId = formData.get("orderId");
  if (typeof orderId !== "string") return { error: "Devis invalide." };

  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc("has_permission", { p_key: "devis.invoice" });
  if (!allowed) return { error: "Vous n'avez pas la permission de générer une facture." };

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, company_id, companies(name, siret, address_line1, address_line2, postal_code, city)")
    .eq("id", orderId)
    .single();

  if (!order) return { error: "Devis introuvable." };
  if (order.status !== "en_attente_paiement") {
    return { error: "Ce devis doit d'abord être accepté avant de générer une facture." };
  }

  const company = order.companies;
  const billedTo = [
    company?.name ?? "—",
    company?.address_line1,
    company?.address_line2,
    [company?.postal_code, company?.city].filter(Boolean).join(" "),
    company?.siret ? `SIRET : ${company.siret}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const { data: numberData, error: numberError } = await supabase.rpc("next_invoice_number");
  if (numberError || !numberData) {
    return { error: "Impossible de générer un numéro de facture : " + (numberError?.message ?? "") };
  }

  const issuedOn = new Date();
  const dueOn = new Date(issuedOn);
  dueOn.setDate(dueOn.getDate() + 30);

  const { error: invoiceError } = await supabase.from("invoices").insert({
    order_id: orderId,
    number: numberData,
    issued_on: issuedOn.toISOString().slice(0, 10),
    due_on: dueOn.toISOString().slice(0, 10),
    billed_to: billedTo,
  });

  if (invoiceError) return { error: "Impossible d'enregistrer la facture : " + invoiceError.message };

  const { error: statusError } = await supabase
    .from("orders")
    .update({ status: "facturee" })
    .eq("id", orderId);

  if (statusError) return { error: "Facture créée mais échec de la mise à jour du statut : " + statusError.message };

  revalidateDevis();
  return undefined;
}

export async function markInvoicePaidAction(
  _prev: DevisActionState,
  formData: FormData,
): Promise<DevisActionState> {
  const orderId = formData.get("orderId");
  if (typeof orderId !== "string") return { error: "Devis invalide." };

  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc("has_permission", { p_key: "devis.mark_paid" });
  if (!allowed) return { error: "Vous n'avez pas la permission de marquer une facture payée." };

  const { data: invoiceRows, error: invoiceError } = await supabase
    .from("invoices")
    .update({ paid_at: new Date().toISOString() })
    .eq("order_id", orderId)
    .select("id");

  if (invoiceError) return { error: "Impossible de mettre à jour la facture : " + invoiceError.message };
  if (!invoiceRows || invoiceRows.length === 0) return { error: "Aucune facture associée à ce devis." };

  const { error: statusError } = await supabase
    .from("orders")
    .update({ status: "payee" })
    .eq("id", orderId);

  if (statusError) return { error: "Facture marquée payée mais échec de la mise à jour du statut : " + statusError.message };

  revalidateDevis();
  return undefined;
}
