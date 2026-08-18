"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const ASSIGNABLE_ROLES = [
  "admin",
  "gestionnaire",
  "formateur",
  "responsable_entreprise",
  "apprenant",
] as const;

export type GrantRoleState = { error?: string } | undefined;

export async function grantRoleAction(
  _prev: GrantRoleState,
  formData: FormData,
): Promise<GrantRoleState> {
  const userId = formData.get("userId");
  const role = formData.get("role");

  if (
    typeof userId !== "string" ||
    typeof role !== "string" ||
    !ASSIGNABLE_ROLES.includes(role as (typeof ASSIGNABLE_ROLES)[number])
  ) {
    return { error: "Formulaire invalide." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée." };

  const { error } = await supabase
    .from("user_roles")
    .insert({ user_id: userId, role: role as (typeof ASSIGNABLE_ROLES)[number], granted_by: user.id });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ce rôle est déjà attribué." };
    }
    if (error.code === "42501") {
      return { error: "Seul un administrateur peut modifier les rôles." };
    }
    return { error: "Impossible d'attribuer ce rôle : " + error.message };
  }

  revalidatePath("/admin/utilisateurs");
}

export async function revokeRoleAction(formData: FormData) {
  const userId = formData.get("userId");
  const role = formData.get("role");
  if (typeof userId !== "string" || typeof role !== "string") return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.id === userId && role === "admin") {
    // Un admin ne doit pas pouvoir se retirer lui-même son propre accès.
    return;
  }

  await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role", role as (typeof ASSIGNABLE_ROLES)[number]);
  revalidatePath("/admin/utilisateurs");
}
