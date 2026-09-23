import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";

// Porté depuis apps/web/src/lib/moduleUnlock.ts — même algorithme, seul le
// typage change (SupabaseClient<Database> générique au lieu de l'alias
// serveur Next ; l'algorithme lui-même n'a jamais été spécifique à Next).
export type ModuleUnlockInfo = {
  unlocked: boolean;
  lockReason: string | null;
};

export async function evaluateModuleUnlock(
  supabase: SupabaseClient<Database>,
  enrollmentId: string,
  trainingId: string,
): Promise<Map<string, ModuleUnlockInfo>> {
  const { data: training } = await supabase
    .from("trainings")
    .select("sequential_unlock")
    .eq("id", trainingId)
    .maybeSingle()
    .throwOnError();

  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, position, lessons(id)")
    .eq("training_id", trainingId)
    .order("position", { ascending: true })
    .throwOnError();

  const sortedModules = (modules ?? [])
    .slice()
    .sort((a, b) => a.position - b.position);
  const result = new Map<string, ModuleUnlockInfo>();
  if (!training) return result;

  if (!training?.sequential_unlock) {
    for (const m of sortedModules)
      result.set(m.id, { unlocked: true, lockReason: null });
    return result;
  }

  const { data: progressRows } = await supabase
    .from("learner_progress")
    .select("lesson_id, completed_at")
    .eq("enrollment_id", enrollmentId)
    .not("completed_at", "is", null)
    .throwOnError();
  const completedLessonIds = new Set(
    (progressRows ?? []).map((p) => p.lesson_id),
  );

  let previousModuleComplete = true;
  let previousModuleTitle: string | null = null;
  for (const m of sortedModules) {
    const unlocked = previousModuleComplete;
    result.set(m.id, {
      unlocked,
      lockReason: unlocked
        ? null
        : `Débloqué après le module « ${previousModuleTitle} ».`,
    });
    const lessonIds = (m.lessons ?? []).map((l) => l.id);
    previousModuleComplete =
      previousModuleComplete &&
      lessonIds.every((id) => completedLessonIds.has(id));
    previousModuleTitle = m.title;
  }

  return result;
}

export async function isModuleUnlockedForLesson(
  supabase: SupabaseClient<Database>,
  enrollmentId: string,
  trainingId: string,
  moduleId: string,
): Promise<ModuleUnlockInfo> {
  const unlockMap = await evaluateModuleUnlock(
    supabase,
    enrollmentId,
    trainingId,
  );
  return (
    unlockMap.get(moduleId) ?? {
      unlocked: false,
      lockReason: "Cette leçon ne fait pas partie de votre formation.",
    }
  );
}
