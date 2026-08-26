"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EmployeeFormState = { error?: string } | undefined;

export async function addEmployeeAction(
  _prev: EmployeeFormState,
  formData: FormData,
): Promise<EmployeeFormState> {
  const email = formData.get("email");
  if (typeof email !== "string" || !email.trim()) return { error: "Email requis." };

  const supabase = await createClient();
  const { data: companyIds } = await supabase.rpc("managed_company_ids");
  const companyId = companyIds?.[0];
  if (!companyId) return { error: "Aucune entreprise associée à votre compte." };

  const { data: matches } = await supabase.rpc("find_profile_by_email", { p_email: email.trim() });
  const existingProfile = matches?.[0] ?? null;

  if (!existingProfile) {
    return {
      error:
        "Aucun compte Titan Kinetic n'existe avec cet email. Demandez à votre salarié de créer un compte sur /inscription, puis réessayez.",
    };
  }

  const { error } = await supabase
    .from("company_members")
    .insert({ company_id: companyId, user_id: existingProfile.id, role: "salarie" });

  if (error) {
    if (error.code === "23505") return { error: "Ce salarié est déjà rattaché à votre entreprise." };
    return { error: "Impossible d'ajouter ce salarié : " + error.message };
  }

  revalidatePath("/entreprise/salaries");
  return undefined;
}

export async function removeEmployeeAction(formData: FormData) {
  const userId = formData.get("userId");
  const companyId = formData.get("companyId");
  if (typeof userId !== "string" || typeof companyId !== "string") return;

  const supabase = await createClient();
  await supabase
    .from("company_members")
    .delete()
    .eq("company_id", companyId)
    .eq("user_id", userId)
    .eq("role", "salarie");

  revalidatePath("/entreprise/salaries");
}
