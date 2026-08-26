"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CertificationFormState = { error?: string } | undefined;

export async function upsertCertificationRequirementsAction(
  _prev: CertificationFormState,
  formData: FormData,
): Promise<CertificationFormState> {
  const trainingId = formData.get("trainingId");
  if (typeof trainingId !== "string") return { error: "Formation invalide." };

  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc("has_permission", { p_key: "formations.edit" });
  if (!allowed) return { error: "Vous n'avez pas la permission de modifier cette formation." };

  const minAttendanceRaw = formData.get("min_attendance_pct");
  const minGradeRaw = formData.get("min_grade");
  const finalExamLessonId = formData.get("final_exam_lesson_id");
  const moduleIds = formData.getAll("required_module_ids").filter((v): v is string => typeof v === "string" && v !== "");

  const payload = {
    training_id: trainingId,
    min_attendance_pct:
      typeof minAttendanceRaw === "string" && minAttendanceRaw.trim() !== "" ? Number(minAttendanceRaw) : null,
    min_grade: typeof minGradeRaw === "string" && minGradeRaw.trim() !== "" ? Number(minGradeRaw) : null,
    requires_final_exam: formData.get("requires_final_exam") === "on",
    final_exam_lesson_id:
      typeof finalExamLessonId === "string" && finalExamLessonId !== "" ? finalExamLessonId : null,
    requires_pedagogical_signoff: formData.get("requires_pedagogical_signoff") === "on",
  };

  const { data: requirement, error } = await supabase
    .from("certification_requirements")
    .upsert(payload, { onConflict: "training_id" })
    .select("id")
    .single();

  if (error || !requirement) {
    return { error: "Impossible d'enregistrer les conditions : " + (error?.message ?? "erreur inconnue") };
  }

  await supabase.from("certification_required_modules").delete().eq("requirement_id", requirement.id);
  if (moduleIds.length > 0) {
    await supabase
      .from("certification_required_modules")
      .insert(moduleIds.map((moduleId) => ({ requirement_id: requirement.id, module_id: moduleId })));
  }

  revalidatePath(`/admin/formations/${trainingId}`);
  revalidatePath("/admin/formations/nouvelle");
}

export async function addCertificationSignoffAction(formData: FormData) {
  const trainingId = formData.get("trainingId");
  const enrollmentId = formData.get("enrollmentId");
  const comment = formData.get("comment");
  if (typeof trainingId !== "string" || typeof enrollmentId !== "string") return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: allowed } = await supabase.rpc("has_permission", { p_key: "formations.edit" });
  if (!allowed) return;

  await supabase.from("certification_signoffs").insert({
    enrollment_id: enrollmentId,
    signed_by: user.id,
    comment: typeof comment === "string" && comment.trim() !== "" ? comment.trim() : null,
  });

  revalidatePath(`/admin/formations/${trainingId}`);
  revalidatePath("/admin/formations/nouvelle");
}

export async function removeCertificationSignoffAction(formData: FormData) {
  const trainingId = formData.get("trainingId");
  const enrollmentId = formData.get("enrollmentId");
  if (typeof trainingId !== "string" || typeof enrollmentId !== "string") return;

  const supabase = await createClient();
  await supabase.from("certification_signoffs").delete().eq("enrollment_id", enrollmentId);
  revalidatePath(`/admin/formations/${trainingId}`);
  revalidatePath("/admin/formations/nouvelle");
}
