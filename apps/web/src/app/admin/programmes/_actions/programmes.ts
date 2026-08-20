"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { programmeSchema } from "@titan-kinetic/core";
import { createClient } from "@/lib/supabase/server";

export type ProgrammeFormState = { error?: string } | undefined;

function parseProgramme(formData: FormData) {
  return programmeSchema.safeParse({
    slug: formData.get("slug"),
    title: formData.get("title"),
    summary: formData.get("summary"),
    status: formData.get("status"),
  });
}

export async function createProgrammeAction(
  _prev: ProgrammeFormState,
  formData: FormData,
): Promise<ProgrammeFormState> {
  const parsed = parseProgramme(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc("has_permission", { p_key: "programmes.create" });
  if (!allowed) return { error: "Vous n'avez pas la permission de créer un programme." };

  const { data, error } = await supabase.from("programmes").insert(parsed.data).select("id").single();

  if (error) {
    if (error.code === "23505") return { error: "Ce slug est déjà utilisé par un autre programme." };
    return { error: "Impossible de créer le programme : " + error.message };
  }

  revalidatePath("/admin/programmes");
  redirect(`/admin/programmes/${data.id}`);
}

export async function updateProgrammeAction(
  _prev: ProgrammeFormState,
  formData: FormData,
): Promise<ProgrammeFormState> {
  const id = formData.get("id");
  if (typeof id !== "string") return { error: "Programme invalide." };

  const parsed = parseProgramme(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc("has_permission", { p_key: "programmes.edit" });
  if (!allowed) return { error: "Vous n'avez pas la permission de modifier un programme." };

  const { error } = await supabase.from("programmes").update(parsed.data).eq("id", id);

  if (error) {
    if (error.code === "23505") return { error: "Ce slug est déjà utilisé par un autre programme." };
    return { error: "Impossible d'enregistrer le programme : " + error.message };
  }

  revalidatePath("/admin/programmes");
  revalidatePath(`/admin/programmes/${id}`);
}

export type AddTrainingState = { error?: string } | undefined;

export async function addTrainingToProgrammeAction(
  _prev: AddTrainingState,
  formData: FormData,
): Promise<AddTrainingState> {
  const programmeId = formData.get("programmeId");
  const trainingId = formData.get("trainingId");
  if (typeof programmeId !== "string" || typeof trainingId !== "string" || !trainingId) {
    return { error: "Sélectionnez une formation." };
  }

  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc("has_permission", { p_key: "programmes.edit" });
  if (!allowed) return { error: "Vous n'avez pas la permission de modifier un programme." };

  const { count } = await supabase
    .from("programme_trainings")
    .select("*", { count: "exact", head: true })
    .eq("programme_id", programmeId);

  const { error } = await supabase
    .from("programme_trainings")
    .insert({ programme_id: programmeId, training_id: trainingId, position: count ?? 0 });

  if (error) {
    if (error.code === "23505") return { error: "Cette formation appartient déjà à ce programme." };
    return { error: "Impossible d'ajouter cette formation : " + error.message };
  }

  revalidatePath(`/admin/programmes/${programmeId}`);
}

export async function removeTrainingFromProgrammeAction(formData: FormData) {
  const programmeId = formData.get("programmeId");
  const trainingId = formData.get("trainingId");
  if (typeof programmeId !== "string" || typeof trainingId !== "string") return;

  const supabase = await createClient();
  await supabase
    .from("programme_trainings")
    .delete()
    .eq("programme_id", programmeId)
    .eq("training_id", trainingId);

  revalidatePath(`/admin/programmes/${programmeId}`);
}

export async function moveTrainingInProgrammeAction(formData: FormData) {
  const programmeId = formData.get("programmeId");
  const trainingId = formData.get("trainingId");
  const direction = formData.get("direction");
  if (
    typeof programmeId !== "string" ||
    typeof trainingId !== "string" ||
    (direction !== "up" && direction !== "down")
  ) {
    return;
  }

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("programme_trainings")
    .select("training_id, position")
    .eq("programme_id", programmeId)
    .order("position", { ascending: true });

  if (!rows) return;
  const index = rows.findIndex((r) => r.training_id === trainingId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= rows.length) return;

  const current = rows[index];
  const neighbor = rows[swapWith];

  await Promise.all([
    supabase
      .from("programme_trainings")
      .update({ position: neighbor.position })
      .eq("programme_id", programmeId)
      .eq("training_id", current.training_id),
    supabase
      .from("programme_trainings")
      .update({ position: current.position })
      .eq("programme_id", programmeId)
      .eq("training_id", neighbor.training_id),
  ]);

  revalidatePath(`/admin/programmes/${programmeId}`);
}
