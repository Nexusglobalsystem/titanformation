import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { evaluateModuleUnlock } from "../../lib/moduleUnlock";
import { evaluateCertificationEligibility } from "../../lib/certification";

// Équivalent RN de apps/web/src/app/apprenant/formations/[enrollmentId]/page.tsx.
export function useProgramme(enrollmentId: string) {
  return useQuery({
    queryKey: ["programme", enrollmentId],
    queryFn: async () => {
      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("id, status, sessions(reference, trainings(id, title))")
        .eq("id", enrollmentId)
        .maybeSingle();

      if (!enrollment || !["confirme", "termine"].includes(enrollment.status)) return null;
      const training = enrollment.sessions?.trainings;
      if (!training) return null;

      const [{ data: modules }, { data: trainingSteps }, { data: progressRows }] = await Promise.all([
        supabase
          .from("modules")
          .select("id, title, position, lessons(id, title, type, position, duration_minutes)")
          .eq("training_id", training.id)
          .order("position", { ascending: true }),
        supabase
          .from("training_steps")
          .select("id, type, title, duration_minutes")
          .eq("training_id", training.id)
          .order("position", { ascending: true }),
        supabase.from("learner_progress").select("lesson_id, completed_at").eq("enrollment_id", enrollmentId),
      ]);

      const completedLessonIds = new Set(
        (progressRows ?? []).filter((p) => p.completed_at).map((p) => p.lesson_id),
      );

      const totalLessons = (modules ?? []).reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0);
      const completedLessons = (modules ?? []).reduce(
        (sum, m) => sum + (m.lessons?.filter((l) => completedLessonIds.has(l.id)).length ?? 0),
        0,
      );
      const isComplete = totalLessons > 0 && completedLessons === totalLessons;

      const [certificationEligibility, moduleUnlock] = await Promise.all([
        evaluateCertificationEligibility(supabase, enrollmentId, training.id),
        evaluateModuleUnlock(supabase, enrollmentId, training.id),
      ]);

      let satisfactionFormId: string | null = null;
      let satisfactionAnswered = false;
      if (isComplete) {
        const { data: form } = await supabase
          .from("evaluation_forms")
          .select("id")
          .eq("training_id", training.id)
          .eq("kind", "satisfaction_chaud")
          .eq("is_active", true)
          .maybeSingle();
        if (form) {
          satisfactionFormId = form.id;
          const { data: response } = await supabase
            .from("evaluation_responses")
            .select("id")
            .eq("form_id", form.id)
            .eq("enrollment_id", enrollmentId)
            .maybeSingle();
          satisfactionAnswered = Boolean(response);
        }
      }

      return {
        training,
        modules: (modules ?? []).map((m) => ({
          ...m,
          lessons: [...(m.lessons ?? [])].sort((a, b) => a.position - b.position),
        })),
        trainingSteps: trainingSteps ?? [],
        completedLessonIds,
        totalLessons,
        completedLessons,
        certificationEligibility,
        moduleUnlock,
        satisfactionFormId,
        satisfactionAnswered,
      };
    },
  });
}
