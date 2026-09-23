import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { isModuleUnlockedForLesson } from "../../lib/moduleUnlock";

// Équivalent RN de apps/web/.../formations/[enrollmentId]/quiz/[lessonId]/page.tsx
// (métadonnées seulement — le déroulé du QCM lui-même passe par la même
// Edge Function "quiz-attempt" que le web, cf. useQuizAttempt.ts).
export function useQuizPage(enrollmentId: string, lessonId: string) {
  return useQuery({
    queryKey: ["quiz-page", enrollmentId, lessonId],
    queryFn: async () => {
      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("id, status, sessions(trainings(id, title))")
        .eq("id", enrollmentId)
        .maybeSingle();

      if (!enrollment || !["confirme", "termine"].includes(enrollment.status)) return null;

      const { data: lesson } = await supabase
        .from("lessons")
        .select("id, title, type, module_id")
        .eq("id", lessonId)
        .maybeSingle();

      if (!lesson || lesson.type !== "quiz") return null;

      const trainingId = enrollment.sessions?.trainings?.id;
      let isLocked = false;
      if (trainingId && lesson.module_id) {
        const unlock = await isModuleUnlockedForLesson(supabase, enrollmentId, trainingId, lesson.module_id);
        isLocked = !unlock.unlocked;
      }

      const { data: quiz } = await supabase
        .from("quizzes")
        .select("id, pass_threshold, max_attempts, time_limit_minutes")
        .eq("lesson_id", lessonId)
        .maybeSingle();

      const { data: attempts } = quiz
        ? await supabase
            .from("quiz_attempts")
            .select("attempt_number, score, max_score, passed, submitted_at")
            .eq("quiz_id", quiz.id)
            .eq("enrollment_id", enrollmentId)
            .order("attempt_number", { ascending: false })
        : { data: [] };

      const submittedAttempts = (attempts ?? []).filter((a) => a.submitted_at);
      const hasPassed = submittedAttempts.some((a) => a.passed);
      const attemptsExhausted = Boolean(
        quiz?.max_attempts && submittedAttempts.length >= quiz.max_attempts && !hasPassed,
      );

      return {
        trainingTitle: enrollment.sessions?.trainings?.title ?? "",
        lesson,
        isLocked,
        quiz,
        submittedAttempts,
        hasPassed,
        attemptsExhausted,
      };
    },
  });
}
