"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EnrollEmployeeState = { error?: string; success?: string } | undefined;

export async function enrollEmployeeAction(
  _prev: EnrollEmployeeState,
  formData: FormData,
): Promise<EnrollEmployeeState> {
  const sessionId = formData.get("sessionId");
  const slug = formData.get("slug");
  const employeeId = formData.get("employeeId");

  if (typeof sessionId !== "string" || typeof slug !== "string" || typeof employeeId !== "string") {
    return { error: "Formulaire invalide." };
  }

  const supabase = await createClient();
  const { data: companyIds } = await supabase.rpc("managed_company_ids");
  const companyId = companyIds?.[0];
  if (!companyId) return { error: "Aucune entreprise associée à votre compte." };

  // Défense en profondeur : la policy RLS "responsable gere les
  // inscriptions de ses salaries" ne vérifie que company_id, pas que le
  // salarié sélectionné appartient réellement à cette entreprise.
  const { data: membership } = await supabase
    .from("company_members")
    .select("user_id")
    .eq("company_id", companyId)
    .eq("user_id", employeeId)
    .eq("role", "salarie")
    .maybeSingle();
  if (!membership) return { error: "Ce salarié n'appartient pas à votre entreprise." };

  const { error } = await supabase.from("enrollments").insert({
    session_id: sessionId,
    learner_id: employeeId,
    company_id: companyId,
    status: "preinscrit",
    funding: "entreprise_directe",
  });

  if (error) {
    if (error.code === "23505") {
      return { success: "Ce salarié est déjà préinscrit à cette session." };
    }
    return { error: "Impossible d'enregistrer l'inscription : " + error.message };
  }

  revalidatePath(`/formations/${slug}`);
  revalidatePath("/entreprise/salaries");
  return { success: "Préinscription enregistrée pour ce salarié." };
}
