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
  const { data: enrollment, error } = await supabase
    .from("enrollments")
    .update({ status: "confirme" })
    .eq("id", enrollmentId)
    .select("learner_id")
    .single();

  if (error) {
    return { error: "Impossible de confirmer l'inscription : " + error.message };
  }

  await supabase.from("notifications").insert({
    user_id: enrollment.learner_id,
    title: "Inscription confirmée",
    body: "Votre inscription a été confirmée, vous avez maintenant accès au programme.",
    link: `/apprenant/formations/${enrollmentId}`,
  });

  revalidatePath("/admin");
}
