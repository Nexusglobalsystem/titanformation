"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AssignTrainerState = { error?: string } | undefined;

export async function assignTrainerAction(
  _prev: AssignTrainerState,
  formData: FormData,
): Promise<AssignTrainerState> {
  const sessionId = formData.get("sessionId");
  const trainingId = formData.get("trainingId");
  const trainerId = formData.get("trainerId");

  if (typeof sessionId !== "string" || typeof trainingId !== "string" || typeof trainerId !== "string" || !trainerId) {
    return { error: "Sélectionnez un formateur." };
  }

  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc("has_permission", { p_key: "trainers.assign" });
  if (!allowed) {
    return { error: "Vous n'avez pas la permission d'affecter un formateur." };
  }

  const { error } = await supabase
    .from("session_trainers")
    .insert({ session_id: sessionId, trainer_id: trainerId, is_lead: true });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ce formateur est déjà affecté à cette session." };
    }
    return { error: "Impossible d'affecter ce formateur : " + error.message };
  }

  revalidatePath(`/admin/formations/${trainingId}`);
  revalidatePath("/admin/planification");
}

export async function removeTrainerAction(formData: FormData) {
  const sessionId = formData.get("sessionId");
  const trainingId = formData.get("trainingId");
  const trainerId = formData.get("trainerId");
  if (typeof sessionId !== "string" || typeof trainingId !== "string" || typeof trainerId !== "string") return;

  const supabase = await createClient();
  await supabase.from("session_trainers").delete().eq("session_id", sessionId).eq("trainer_id", trainerId);
  revalidatePath(`/admin/formations/${trainingId}`);
}
