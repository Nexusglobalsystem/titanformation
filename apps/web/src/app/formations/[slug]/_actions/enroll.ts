"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EnrollState = { error?: string; success?: string } | undefined;

export async function enrollAction(
  _prev: EnrollState,
  formData: FormData,
): Promise<EnrollState> {
  const sessionId = formData.get("sessionId");
  const slug = formData.get("slug");

  if (typeof sessionId !== "string" || typeof slug !== "string") {
    return { error: "Session invalide." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Connecte-toi pour t'inscrire." };
  }

  const { error } = await supabase.from("enrollments").insert({
    session_id: sessionId,
    learner_id: user.id,
    status: "preinscrit",
    funding: "particulier_cb",
  });

  if (error) {
    if (error.code === "23505") {
      return { success: "Tu es déjà préinscrit à cette session." };
    }
    return { error: "Impossible d'enregistrer la préinscription : " + error.message };
  }

  revalidatePath(`/formations/${slug}`);
  return {
    success:
      "Préinscription enregistrée. Un gestionnaire te contactera pour finaliser le paiement et confirmer ta place.",
  };
}
