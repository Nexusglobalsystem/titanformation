"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import { quoteAcknowledgementEmail, quoteStaffAlertEmail } from "@/lib/email/templates";

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

  try {
    const [{ data: company }, { data: profile }, { data: staffEmails, error: staffEmailsError }] = await Promise.all([
      supabase.from("companies").select("name").eq("id", companyId).single(),
      supabase.from("profiles").select("first_name").eq("id", user.id).single(),
      supabase.rpc("staff_emails_for_devis_order", { p_order_id: order.id }),
    ]);
    if (staffEmailsError) console.error("[email] staff_emails_for_devis_order :", staffEmailsError);
    if (user.email) {
      const { subject, html } = quoteAcknowledgementEmail({
        recipientName: profile?.first_name || user.email,
        reference,
        trainingTitle: training.title,
        quantity,
        totalHt,
      });
      await sendEmail({ to: user.email, subject, html });
    }
    const recipients = (staffEmails ?? []).map((r) => r.email).filter((e): e is string => Boolean(e));
    if (recipients.length > 0) {
      const { subject, html } = quoteStaffAlertEmail({
        companyName: company?.name ?? "Une entreprise",
        reference,
        trainingTitle: training.title,
        totalHt,
      });
      await sendEmail({ to: recipients, subject, html, replyTo: user.email ?? undefined });
    }
  } catch (err) {
    console.error("[email] devis :", err);
  }

  revalidatePath("/entreprise/devis");
  revalidatePath("/admin/devis");
  return { success: `Demande de devis envoyée (référence ${reference}). Notre équipe vous recontactera.` };
}
