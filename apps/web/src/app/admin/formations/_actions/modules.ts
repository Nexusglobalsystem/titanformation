"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ModuleFormState = { error?: string } | undefined;

export async function createModuleAction(
  _prev: ModuleFormState,
  formData: FormData,
): Promise<ModuleFormState> {
  const trainingId = formData.get("trainingId");
  const title = formData.get("title");
  const position = Number(formData.get("position") ?? 0);

  if (typeof trainingId !== "string" || typeof title !== "string" || !title.trim()) {
    return { error: "Titre du module requis." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("modules").insert({ training_id: trainingId, title, position });

  if (error) {
    return { error: "Impossible de créer le module : " + error.message };
  }

  revalidatePath(`/admin/formations/${trainingId}`);
}

const LESSON_TYPES = ["texte", "video", "audio", "document", "quiz", "live_slot"] as const;

export type LessonFormState = { error?: string } | undefined;

export async function createLessonAction(
  _prev: LessonFormState,
  formData: FormData,
): Promise<LessonFormState> {
  const moduleId = formData.get("moduleId");
  const trainingId = formData.get("trainingId");
  const title = formData.get("title");
  const type = formData.get("type");
  const durationMinutes = Number(formData.get("duration_minutes") ?? 0);
  const body = formData.get("body");
  const videoProvider = formData.get("video_provider");
  const videoAssetId = formData.get("video_asset_id");
  const documentPath = formData.get("document_path");

  if (
    typeof moduleId !== "string" ||
    typeof trainingId !== "string" ||
    typeof title !== "string" ||
    !title.trim() ||
    typeof type !== "string" ||
    !LESSON_TYPES.includes(type as (typeof LESSON_TYPES)[number])
  ) {
    return { error: "Formulaire invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("lessons").insert({
    module_id: moduleId,
    title,
    type: type as (typeof LESSON_TYPES)[number],
    duration_minutes: Number.isFinite(durationMinutes) ? durationMinutes : 0,
    body: typeof body === "string" && body ? body : null,
    video_provider: typeof videoProvider === "string" && videoProvider ? videoProvider : null,
    video_asset_id: typeof videoAssetId === "string" && videoAssetId ? videoAssetId : null,
    // Réutilisé pour l'audio : pas de transcodage/HLS nécessaire, donc pas
    // besoin d'un provider dédié comme pour la vidéo (cf. migration).
    document_path: typeof documentPath === "string" && documentPath ? documentPath : null,
  });

  if (error) {
    return { error: "Impossible de créer la leçon : " + error.message };
  }

  revalidatePath(`/admin/formations/${trainingId}`);
}

export type AttachFileState = { error?: string } | undefined;

export async function attachLessonFileAction(
  _prev: AttachFileState,
  formData: FormData,
): Promise<AttachFileState> {
  const lessonId = formData.get("lessonId");
  const trainingId = formData.get("trainingId");
  const file = formData.get("file");

  if (typeof lessonId !== "string" || typeof trainingId !== "string") {
    return { error: "Formulaire invalide." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Sélectionnez un fichier." };
  }

  const supabase = await createClient();
  const path = `lessons/${lessonId}/${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("lesson-files")
    .upload(path, file, { upsert: true });

  if (uploadError) {
    return { error: "Échec de l'envoi : " + uploadError.message };
  }

  const { error: updateError } = await supabase
    .from("lessons")
    .update({ document_path: path })
    .eq("id", lessonId);

  if (updateError) {
    return { error: "Fichier envoyé mais échec de l'enregistrement : " + updateError.message };
  }

  revalidatePath(`/admin/formations/${trainingId}`);
}
