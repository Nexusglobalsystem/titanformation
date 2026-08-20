"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { trainingSchema } from "@titan-kinetic/core";
import { createClient } from "@/lib/supabase/server";

export type TrainingFormState = { error?: string } | undefined;

function parseTraining(formData: FormData) {
  return trainingSchema.safeParse({
    slug: formData.get("slug"),
    title: formData.get("title"),
    summary: formData.get("summary"),
    objectives: formData.get("objectives"),
    prerequisites: formData.get("prerequisites"),
    target_audience: formData.get("target_audience"),
    duration_hours: formData.get("duration_hours"),
    duration_days: formData.get("duration_days"),
    price_ht: formData.get("price_ht"),
    vat_rate: formData.get("vat_rate"),
    modalities: formData.get("modalities"),
    access_delay: formData.get("access_delay"),
    pedagogical_means: formData.get("pedagogical_means"),
    assessment_methods: formData.get("assessment_methods"),
    accessibility_info: formData.get("accessibility_info"),
    category: formData.get("category"),
    level: formData.get("level"),
    status: formData.get("status"),
    is_certifying: formData.get("is_certifying") === "on",
    certification_name: formData.get("certification_name"),
    rncp_code: formData.get("rncp_code"),
    sequential_unlock: formData.get("sequential_unlock") === "on",
  });
}

export async function createTrainingAction(
  _prev: TrainingFormState,
  formData: FormData,
): Promise<TrainingFormState> {
  const parsed = parseTraining(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createClient();
  const wasPublished = parsed.data.status === "publiee";
  const { data, error } = await supabase
    .from("trainings")
    .insert({ ...parsed.data, published_at: wasPublished ? new Date().toISOString() : null })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Ce slug est déjà utilisé par une autre formation." };
    }
    return { error: "Impossible de créer la formation : " + error.message };
  }

  revalidatePath("/admin/formations");
  // L'unique appelant est l'assistant de création (admin/formations/nouvelle) :
  // on revient sur la même page, désormais avec un id, pour poursuivre les
  // étapes Composer/Planifier/Publier sans quitter l'assistant.
  redirect(`/admin/formations/nouvelle?id=${data.id}`);
}

export async function updateTrainingAction(
  _prev: TrainingFormState,
  formData: FormData,
): Promise<TrainingFormState> {
  const id = formData.get("id");
  if (typeof id !== "string") {
    return { error: "Formation invalide." };
  }

  const parsed = parseTraining(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createClient();

  const { data: current } = await supabase.from("trainings").select("published_at").eq("id", id).single();
  const wasPublished = parsed.data.status === "publiee";

  const { error } = await supabase
    .from("trainings")
    .update({
      ...parsed.data,
      published_at: wasPublished ? (current?.published_at ?? new Date().toISOString()) : null,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { error: "Ce slug est déjà utilisé par une autre formation." };
    }
    return { error: "Impossible d'enregistrer la formation : " + error.message };
  }

  revalidatePath("/admin/formations");
  revalidatePath(`/admin/formations/${id}`);
  revalidatePath("/admin/formations/nouvelle");
  return undefined;
}

export type AttachTrainingImageState = { error?: string } | undefined;

export async function attachTrainingImageAction(
  _prev: AttachTrainingImageState,
  formData: FormData,
): Promise<AttachTrainingImageState> {
  const trainingId = formData.get("trainingId");
  const file = formData.get("file");

  if (typeof trainingId !== "string") return { error: "Formation invalide." };
  if (!(file instanceof File) || file.size === 0) return { error: "Sélectionnez une image." };

  const supabase = await createClient();
  const path = `trainings/${trainingId}/${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("training-images")
    .upload(path, file, { upsert: true });

  if (uploadError) return { error: "Échec de l'envoi : " + uploadError.message };

  const { error: updateError } = await supabase
    .from("trainings")
    .update({ image_path: path })
    .eq("id", trainingId);

  if (updateError) return { error: "Image envoyée mais échec de l'enregistrement : " + updateError.message };

  revalidatePath("/admin/formations");
  revalidatePath(`/admin/formations/${trainingId}`);
  revalidatePath("/admin/formations/nouvelle");
  revalidatePath("/formations");
  revalidatePath("/");
}
