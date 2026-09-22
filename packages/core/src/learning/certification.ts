import { averageBestQuizScores } from "./results";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";

// Porté depuis apps/web/src/lib/certification.ts — même algorithme, seul
// le typage change (SupabaseClient<Database> générique). Rien n'est
// jamais stocké : recalculé à chaque lecture, comme evaluateModuleUnlock.
export type CertificationEligibility = {
  eligible: boolean;
  reasons: string[];
  hasCustomRequirements: boolean;
};

export async function evaluateCertificationEligibility(
  supabase: SupabaseClient<Database>,
  enrollmentId: string,
  trainingId: string,
): Promise<CertificationEligibility> {
  const { data: requirement } = await supabase
    .from("certification_requirements")
    .select(
      "id, min_attendance_pct, min_grade, requires_final_exam, final_exam_lesson_id, requires_pedagogical_signoff",
    )
    .eq("training_id", trainingId)
    .maybeSingle()
    .throwOnError();

  let requiredModuleIds: string[] | null = null;
  if (requirement) {
    const { data: requiredModules } = await supabase
      .from("certification_required_modules")
      .select("module_id")
      .eq("requirement_id", requirement.id)
      .throwOnError();
    if (requiredModules && requiredModules.length > 0) {
      requiredModuleIds = requiredModules.map((m) => m.module_id);
    }
  }

  const modulesQuery = supabase
    .from("modules")
    .select("id, lessons(id, is_mandatory)")
    .eq("training_id", trainingId);
  const { data: modules } = requiredModuleIds
    ? await modulesQuery.in("id", requiredModuleIds).throwOnError()
    : await modulesQuery.throwOnError();

  const requiredLessonIds = (modules ?? []).flatMap((m) =>
    (m.lessons ?? []).filter((l) => l.is_mandatory).map((l) => l.id),
  );

  const { data: progressRows } = await supabase
    .from("learner_progress")
    .select("lesson_id, completed_at")
    .eq("enrollment_id", enrollmentId)
    .not("completed_at", "is", null)
    .throwOnError();
  const completedLessonIds = new Set(
    (progressRows ?? []).map((p) => p.lesson_id),
  );
  const missingLessons = requiredLessonIds.filter(
    (id) => !completedLessonIds.has(id),
  );

  const reasons: string[] = [];
  if (requiredLessonIds.length === 0) {
    reasons.push(
      "Aucune leçon obligatoire n'est encore configurée pour cette formation.",
    );
  } else if (missingLessons.length > 0) {
    reasons.push(
      `${requiredLessonIds.length - missingLessons.length}/${requiredLessonIds.length} leçons obligatoires terminées.`,
    );
  }

  if (!requirement) {
    return {
      eligible: requiredLessonIds.length > 0 && missingLessons.length === 0,
      reasons,
      hasCustomRequirements: false,
    };
  }

  if (requirement.min_attendance_pct !== null) {
    const { data: attendanceRows } = await supabase
      .from("attendances")
      .select("present")
      .eq("enrollment_id", enrollmentId)
      .throwOnError();
    const total = attendanceRows?.length ?? 0;
    const present = (attendanceRows ?? []).filter((a) => a.present).length;
    const pct = total > 0 ? (present / total) * 100 : 100;
    if (pct < requirement.min_attendance_pct) {
      reasons.push(
        `Assiduité insuffisante : ${pct.toFixed(0)}% (minimum requis ${requirement.min_attendance_pct}%).`,
      );
    }
  }

  if (requirement.min_grade !== null) {
    const { data: quizzes } = await supabase
      .from("quizzes")
      .select("id, lessons(modules(training_id))")
      .throwOnError();
    const trainingQuizIds = (quizzes ?? [])
      .filter((q) => q.lessons?.modules?.training_id === trainingId)
      .map((q) => q.id);

    if (trainingQuizIds.length > 0) {
      const { data: attempts } = await supabase
        .from("quiz_attempts")
        .select("quiz_id, score, max_score")
        .eq("enrollment_id", enrollmentId)
        .in("quiz_id", trainingQuizIds)
        .not("submitted_at", "is", null)
        .throwOnError();

      const avg = averageBestQuizScores(trainingQuizIds, attempts ?? []);
      if (avg < requirement.min_grade) {
        reasons.push(
          `Note moyenne insuffisante : ${avg.toFixed(0)}% (minimum requis ${requirement.min_grade}%).`,
        );
      }
    }
  }

  if (requirement.requires_final_exam) {
    if (!requirement.final_exam_lesson_id) {
      reasons.push("L’examen final n’est pas encore configuré.");
      return { eligible: false, reasons, hasCustomRequirements: true };
    }
    const { data: examQuiz } = await supabase
      .from("quizzes")
      .select("id")
      .eq("lesson_id", requirement.final_exam_lesson_id)
      .maybeSingle()
      .throwOnError();
    let passed = false;
    if (examQuiz) {
      const { data: examAttempt } = await supabase
        .from("quiz_attempts")
        .select("id")
        .eq("enrollment_id", enrollmentId)
        .eq("quiz_id", examQuiz.id)
        .eq("passed", true)
        .not("submitted_at", "is", null)
        .limit(1)
        .maybeSingle()
        .throwOnError();
      passed = Boolean(examAttempt);
    }
    if (!passed) reasons.push("L'examen final n'est pas encore validé.");
  }

  if (requirement.requires_pedagogical_signoff) {
    const { data: signoff } = await supabase
      .from("certification_signoffs")
      .select("id")
      .eq("enrollment_id", enrollmentId)
      .maybeSingle()
      .throwOnError();
    if (!signoff)
      reasons.push(
        "La validation pédagogique par l'équipe n'a pas encore été effectuée.",
      );
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    hasCustomRequirements: true,
  };
}
