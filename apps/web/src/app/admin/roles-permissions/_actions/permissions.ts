"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const EDITABLE_ROLES = ["gestionnaire", "formateur", "responsable_entreprise"] as const;

export async function togglePermissionAction(formData: FormData) {
  const role = formData.get("role");
  const key = formData.get("key");
  const enabled = formData.get("enabled") === "true";

  if (
    typeof role !== "string" ||
    typeof key !== "string" ||
    !EDITABLE_ROLES.includes(role as (typeof EDITABLE_ROLES)[number])
  ) {
    return;
  }

  const supabase = await createClient();

  if (enabled) {
    await supabase
      .from("role_permissions")
      .upsert({ role: role as (typeof EDITABLE_ROLES)[number], permission_key: key }, { onConflict: "role,permission_key" });
  } else {
    await supabase
      .from("role_permissions")
      .delete()
      .eq("role", role as (typeof EDITABLE_ROLES)[number])
      .eq("permission_key", key);
  }

  revalidatePath("/admin/roles-permissions");
}
