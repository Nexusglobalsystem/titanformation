"use server";

import { revalidatePath } from "next/cache";
import { organizationSettingsSchema } from "@titan-kinetic/core";
import { createClient } from "@/lib/supabase/server";

export type SettingsFormState = { error?: string } | undefined;

export async function updateSettingsAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const parsed = organizationSettingsSchema.safeParse({
    legalName: formData.get("legalName"),
    legalForm: formData.get("legalForm"),
    siret: formData.get("siret"),
    shareCapital: formData.get("shareCapital"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2"),
    postalCode: formData.get("postalCode"),
    city: formData.get("city"),
    publicationDirector: formData.get("publicationDirector"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
    withdrawalPeriodDays: formData.get("withdrawalPeriodDays"),
    paymentTerms: formData.get("paymentTerms"),
    cancellationPolicy: formData.get("cancellationPolicy"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc("has_permission", { p_key: "settings.edit" });
  if (!allowed) return { error: "Vous n'avez pas la permission de modifier ces paramètres." };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("organization_settings")
    .update({
      legal_name: parsed.data.legalName ?? null,
      legal_form: parsed.data.legalForm ?? null,
      siret: parsed.data.siret ?? null,
      share_capital: parsed.data.shareCapital ?? null,
      address_line1: parsed.data.addressLine1 ?? null,
      address_line2: parsed.data.addressLine2 ?? null,
      postal_code: parsed.data.postalCode ?? null,
      city: parsed.data.city ?? null,
      publication_director: parsed.data.publicationDirector ?? null,
      contact_email: parsed.data.contactEmail ?? null,
      contact_phone: parsed.data.contactPhone ?? null,
      withdrawal_period_days: parsed.data.withdrawalPeriodDays,
      payment_terms: parsed.data.paymentTerms ?? null,
      cancellation_policy: parsed.data.cancellationPolicy ?? null,
      updated_at: new Date().toISOString(),
      updated_by: user?.id ?? null,
    })
    .eq("id", 1);

  if (error) return { error: "Impossible d'enregistrer : " + error.message };

  revalidatePath("/admin/parametres");
  revalidatePath("/mentions-legales");
  revalidatePath("/confidentialite");
  revalidatePath("/cgv");
  return undefined;
}
