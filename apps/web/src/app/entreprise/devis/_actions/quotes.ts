"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type QuoteFormState = { error?: string; success?: string } | undefined;

export async function requestQuoteAction(
  _prev: QuoteFormState,
  formData: FormData,
): Promise<QuoteFormState> {
  const trainingId = formData.get("trainingId");
  const quantityRaw = formData.get("quantity");
  const message = formData.get("message");

  if (typeof trainingId !== "string" || !trainingId) return { error: "Choisissez une formation." };
  const quantity = Number(quantityRaw);
  if (!Number.isFinite(quantity) || quantity < 1) return { error: "Nombre de participants invalide." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Connecte-toi pour demander un devis." };

  const { data: companyIds } = await supabase.rpc("managed_company_ids");
  const companyId = companyIds?.[0];
  if (!companyId) return { error: "Aucune entreprise associée à votre compte." };

  const { data: training } = await supabase
    .from("trainings")
    .select("title, price_ht")
    .eq("id", trainingId)
    .maybeSingle();
  if (!training) return { error: "Formation introuvable." };

  const reference = `DEVIS-${Date.now()}`;
  const totalHt = training.price_ht * quantity;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      reference,
      company_id: companyId,
      buyer_id: user.id,
      funding: "entreprise_directe",
      status: "devis",
      total_ht: totalHt,
      total_vat: 0,
      total_ttc: totalHt,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return { error: "Impossible d'enregistrer la demande : " + (orderError?.message ?? "") };
  }

  const label = typeof message === "string" && message.trim() ? `${training.title} — ${message.trim()}` : training.title;

  const { error: itemError } = await supabase.from("order_items").insert({
    order_id: order.id,
    label,
    quantity,
    unit_price_ht: training.price_ht,
    vat_rate: 0,
  });

  if (itemError) {
    return { error: "Demande créée mais échec de l'enregistrement du détail : " + itemError.message };
  }

  await supabase.rpc("notify_devis_request", { p_order_id: order.id });

  revalidatePath("/entreprise/devis");
  revalidatePath("/admin/devis");
  return { success: `Demande de devis envoyée (référence ${reference}). Notre équipe vous recontactera.` };
}
