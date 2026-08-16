"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ConfirmEnrollmentState = { error?: string } | undefined;

export async function confirmEnrollmentAction(
  _prev: ConfirmEnrollmentState,
  formData: FormData,
): Promise<ConfirmEnrollmentState> {
  const enrollmentId = formData.get("enrollmentId");
  if (typeof enrollmentId !== "string") {
    return { error: "Inscription invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("enrollments")
    .update({ status: "confirme" })
    .eq("id", enrollmentId);

  if (error) {
    return { error: "Impossible de confirmer l'inscription : " + error.message };
  }

  revalidatePath("/admin");
}
