"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProgressState = { error?: string } | undefined;

export async function markLessonCompleteAction(
  _prev: ProgressState,
  formData: FormData,
): Promise<ProgressState> {
  const enrollmentId = formData.get("enrollmentId");
  const lessonId = formData.get("lessonId");

  if (typeof enrollmentId !== "string" || typeof lessonId !== "string") {
    return { error: "Leçon invalide." };
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("learner_progress")
    .upsert(
      { enrollment_id: enrollmentId, lesson_id: lessonId, started_at: now, completed_at: now },
      { onConflict: "enrollment_id,lesson_id", ignoreDuplicates: false },
    );

  if (error) {
    return { error: "Impossible d'enregistrer la progression : " + error.message };
  }

  revalidatePath(`/apprenant/formations/${enrollmentId}`);
  revalidatePath(`/apprenant/formations/${enrollmentId}/lecons/${lessonId}`);
}
