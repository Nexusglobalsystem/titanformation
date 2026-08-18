"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const STANDARD_SATISFACTION_SCHEMA = {
  questions: [
    { id: "q1", type: "note", label: "Satisfaction globale de la formation" },
    { id: "q2", type: "note", label: "Qualité des contenus pédagogiques" },
    { id: "q3", type: "note", label: "Qualité de l'animation par le formateur" },
    { id: "q4", type: "note", label: "Conditions matérielles et organisation" },
    { id: "q5", type: "texte", label: "Vos remarques ou suggestions (optionnel)" },
  ],
};

export type CreateFormState = { error?: string } | undefined;

export async function createSatisfactionFormAction(
  _prev: CreateFormState,
  formData: FormData,
): Promise<CreateFormState> {
  const trainingId = formData.get("trainingId");
  if (typeof trainingId !== "string") return { error: "Formation invalide." };

  const supabase = await createClient();
  const { error } = await supabase.from("evaluation_forms").insert({
    kind: "satisfaction_chaud",
    training_id: trainingId,
    title: "Questionnaire de satisfaction",
    schema: STANDARD_SATISFACTION_SCHEMA,
    is_active: true,
  });

  if (error) {
    return { error: "Impossible de créer le questionnaire : " + error.message };
  }

  revalidatePath(`/admin/formations/${trainingId}`);
}

export type RecalcState = { error?: string } | undefined;

export async function recalculateSatisfactionAction(
  _prev: RecalcState,
  formData: FormData,
): Promise<RecalcState> {
  const trainingId = formData.get("trainingId");
  if (typeof trainingId !== "string") return { error: "Formation invalide." };

  const supabase = await createClient();

  const { data: forms } = await supabase
    .from("evaluation_forms")
    .select("id")
    .eq("training_id", trainingId)
    .eq("kind", "satisfaction_chaud");
  const formIds = (forms ?? []).map((f) => f.id);

  if (formIds.length === 0) {
    return { error: "Aucun questionnaire pour cette formation." };
  }

  const { data: responses } = await supabase
    .from("evaluation_responses")
    .select("score")
    .in("form_id", formIds)
    .not("score", "is", null);

  if (!responses || responses.length === 0) {
    return { error: "Aucune réponse pour le moment." };
  }

  const avgOn5 = responses.reduce((sum, r) => sum + (r.score ?? 0), 0) / responses.length;
  const satisfactionRate = Math.round((avgOn5 / 5) * 100 * 100) / 100;

  const { error } = await supabase
    .from("trainings")
    .update({ satisfaction_rate: satisfactionRate, stats_updated_at: new Date().toISOString().slice(0, 10) })
    .eq("id", trainingId);

  if (error) {
    return { error: "Impossible de mettre à jour le taux : " + error.message };
  }

  revalidatePath(`/admin/formations/${trainingId}`);
}
