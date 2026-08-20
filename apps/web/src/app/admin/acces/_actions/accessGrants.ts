"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AccessGrantFormState = { error?: string } | undefined;

const TARGET_TYPES = ["user", "company"] as const;
const SCOPE_TYPES = ["programme", "training", "module", "session"] as const;

export async function createAccessGrantAction(
  _prev: AccessGrantFormState,
  formData: FormData,
): Promise<AccessGrantFormState> {
  const targetType = formData.get("targetType");
  const targetId = formData.get("targetId");
  const scopeType = formData.get("scopeType");
  const scopeId = formData.get("scopeId");
  const expiresAt = formData.get("expires_at");
  const note = formData.get("note");

  if (
    typeof targetType !== "string" ||
    !TARGET_TYPES.includes(targetType as (typeof TARGET_TYPES)[number]) ||
    typeof targetId !== "string" ||
    !targetId
  ) {
    return { error: "Sélectionnez un utilisateur ou une entreprise." };
  }
  if (
    typeof scopeType !== "string" ||
    !SCOPE_TYPES.includes(scopeType as (typeof SCOPE_TYPES)[number]) ||
    typeof scopeId !== "string" ||
    !scopeId
  ) {
    return { error: "Sélectionnez un programme, une formation, un module ou une session." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Authentification requise." };

  const { data: allowed } = await supabase.rpc("has_permission", { p_key: "access.manage" });
  if (!allowed) return { error: "Vous n'avez pas la permission de gérer les accès." };

  const payload: Record<string, string | null> = {
    user_id: targetType === "user" ? targetId : null,
    company_id: targetType === "company" ? targetId : null,
    programme_id: scopeType === "programme" ? scopeId : null,
    training_id: scopeType === "training" ? scopeId : null,
    module_id: scopeType === "module" ? scopeId : null,
    session_id: scopeType === "session" ? scopeId : null,
    granted_by: user.id,
    expires_at: typeof expiresAt === "string" && expiresAt !== "" ? new Date(expiresAt).toISOString() : null,
    note: typeof note === "string" && note.trim() !== "" ? note.trim() : null,
  };

  const { error } = await supabase.from("access_grants").insert(payload);
  if (error) return { error: "Impossible d'accorder cet accès : " + error.message };

  revalidatePath("/admin/acces");
}

export async function revokeAccessGrantAction(formData: FormData) {
  const grantId = formData.get("grantId");
  if (typeof grantId !== "string") return;

  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc("has_permission", { p_key: "access.manage" });
  if (!allowed) return;

  await supabase.from("access_grants").delete().eq("id", grantId);
  revalidatePath("/admin/acces");
}
