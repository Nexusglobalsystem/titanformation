import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { evaluateModuleUnlock } from "../../lib/moduleUnlock";

// Équivalent RN de apps/web/.../formations/[enrollmentId]/lecons/[lessonId]/page.tsx
// — mêmes requêtes, même garde de déverrouillage (redirige côté appelant
// si le module est verrouillé, cf. écran), même calcul précédent/suivant
// (aplatit modules→leçons dans l'ordre, saute la leçon suivante si son
// module est verrouillé).
export function useLesson(enrollmentId: string, lessonId: string) {
  return useQuery({
    queryKey: ["lesson", enrollmentId, lessonId],
    queryFn: async () => {
      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("id, status, sessions(trainings(id, title))")
        .eq("id", enrollmentId)
        .maybeSingle();

      if (!enrollment || !["confirme", "termine"].includes(enrollment.status)) return null;

      const { data: lesson } = await supabase
        .from("lessons")
        .select("id, title, type, body, video_provider, video_asset_id, document_path, duration_minutes, module_id")
        .eq("id", lessonId)
        .maybeSingle();

      if (!lesson) return null;

      const trainingId = enrollment.sessions?.trainings?.id;
      const moduleUnlock = trainingId
        ? await evaluateModuleUnlock(supabase, enrollmentId, trainingId)
        : new Map<string, { unlocked: boolean; lockReason: string | null }>();

      const isLocked = Boolean(lesson.module_id) && moduleUnlock.get(lesson.module_id!)?.unlocked === false;

      const { data: modules } = trainingId
        ? await supabase
            .from("modules")
            .select("id, title, position, lessons(id, title, type, position, duration_minutes)")
            .eq("training_id", trainingId)
            .order("position", { ascending: true })
        : { data: [] };

      const { data: progressRows } = await supabase
        .from("learner_progress")
        .select("lesson_id, completed_at")
        .eq("enrollment_id", enrollmentId)
        .not("completed_at", "is", null);
      const completedLessonIds = new Set((progressRows ?? []).map((p) => p.lesson_id));

      const flatLessons = (modules ?? [])
        .slice()
        .sort((a, b) => a.position - b.position)
        .flatMap((m) =>
          [...(m.lessons ?? [])].sort((a, b) => a.position - b.position).map((l) => ({ ...l, moduleId: m.id })),
        );
      const currentIndex = flatLessons.findIndex((l) => l.id === lessonId);
      const previousLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
      const nextLessonCandidate =
        currentIndex >= 0 && currentIndex < flatLessons.length - 1 ? flatLessons[currentIndex + 1] : null;
      const nextLesson =
        nextLessonCandidate && moduleUnlock.get(nextLessonCandidate.moduleId)?.unlocked !== false
          ? nextLessonCandidate
          : null;
      const totalLessons = flatLessons.length;
      const completedCount = flatLessons.filter((l) => completedLessonIds.has(l.id)).length;

      const { data: progress } = await supabase
        .from("learner_progress")
        .select("completed_at")
        .eq("enrollment_id", enrollmentId)
        .eq("lesson_id", lessonId)
        .maybeSingle();

      let fileUrl: string | null = null;
      if ((lesson.type === "audio" || lesson.type === "document") && lesson.document_path) {
        const { data: signed } = await supabase.storage.from("lesson-files").createSignedUrl(lesson.document_path, 3600);
        fileUrl = signed?.signedUrl ?? null;
      }

      return {
        trainingTitle: enrollment.sessions?.trainings?.title ?? "",
        lesson,
        isLocked,
        modules: (modules ?? []).slice().sort((a, b) => a.position - b.position),
        moduleUnlock,
        completedLessonIds,
        previousLesson,
        nextLesson,
        totalLessons,
        completedCount,
        alreadyDone: Boolean(progress?.completed_at),
        fileUrl,
      };
    },
  });
}

// Équivalent RN de markLessonCompleteAction.
export function useMarkLessonComplete(enrollmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (lessonId: string) => {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("learner_progress")
        .upsert(
          { enrollment_id: enrollmentId, lesson_id: lessonId, started_at: now, completed_at: now },
          { onConflict: "enrollment_id,lesson_id", ignoreDuplicates: false },
        );
      if (error) {
        throw new Error("Impossible d'enregistrer la progression : " + error.message);
      }
    },
    onSuccess: (_data, lessonId) => {
      queryClient.invalidateQueries({ queryKey: ["lesson", enrollmentId, lessonId] });
      queryClient.invalidateQueries({ queryKey: ["programme", enrollmentId] });
    },
  });
}
