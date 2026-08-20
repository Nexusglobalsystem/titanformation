"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type TrainingStepFormState = { error?: string } | undefined;

const STEP_TYPES = ["presentiel", "livekit", "autoapprentissage", "evaluation", "certification"] as const;

export async function createTrainingStepAction(
  _prev: TrainingStepFormState,
  formData: FormData,
): Promise<TrainingStepFormState> {
  const trainingId = formData.get("trainingId");
  const type = formData.get("type");
  const title = formData.get("title");
  const durationRaw = formData.get("duration_minutes");
  const moduleId = formData.get("module_id");

  if (typeof trainingId !== "string" || typeof title !== "string" || !title.trim()) {
    return { error: "Le titre de l'étape est requis." };
  }
  if (typeof type !== "string" || !STEP_TYPES.includes(type as (typeof STEP_TYPES)[number])) {
    return { error: "Type d'étape invalide." };
  }

  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc("has_permission", { p_key: "formations.edit" });
  if (!allowed) return { error: "Vous n'avez pas la permission de modifier cette formation." };

  const { count } = await supabase
    .from("training_steps")
    .select("*", { count: "exact", head: true })
    .eq("training_id", trainingId);

  const durationMinutes =
    typeof durationRaw === "string" && durationRaw.trim() !== "" ? Number(durationRaw) : null;

  const { error } = await supabase.from("training_steps").insert({
    training_id: trainingId,
    type: type as (typeof STEP_TYPES)[number],
    title: title.trim(),
    duration_minutes: durationMinutes,
    module_id: type === "autoapprentissage" && typeof moduleId === "string" && moduleId ? moduleId : null,
    position: count ?? 0,
  });

  if (error) return { error: "Impossible d'ajouter cette étape : " + error.message };

  revalidatePath(`/admin/formations/${trainingId}`);
}

export async function deleteTrainingStepAction(formData: FormData) {
  const trainingId = formData.get("trainingId");
  const stepId = formData.get("stepId");
  if (typeof trainingId !== "string" || typeof stepId !== "string") return;

  const supabase = await createClient();
  await supabase.from("training_steps").delete().eq("id", stepId);
  revalidatePath(`/admin/formations/${trainingId}`);
}

export async function reorderTrainingStepsAction(
  trainingId: string,
  orderedStepIds: string[],
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc("has_permission", { p_key: "formations.edit" });
  if (!allowed) return { error: "Vous n'avez pas la permission de modifier cette formation." };

  const results = await Promise.all(
    orderedStepIds.map((stepId, index) =>
      supabase.from("training_steps").update({ position: index }).eq("id", stepId).eq("training_id", trainingId),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: "Impossible d'enregistrer l'ordre : " + failed.error.message };

  revalidatePath(`/admin/formations/${trainingId}`);
  return {};
}
