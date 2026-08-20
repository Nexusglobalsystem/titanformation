import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type ModuleUnlockInfo = {
  unlocked: boolean;
  lockReason: string | null;
};

// Deverrouillage progressif des modules, opt-in (trainings.sequential_unlock).
// Si desactive, tout est ouvert — comportement historique inchange. Sinon, le
// module 1 est toujours ouvert et le module N n'ouvre que lorsque toutes les
// lecons du module N-1 sont terminees (learner_progress.completed_at) pour
// cette inscription. Rien n'est jamais stocke : recalcule a chaque lecture,
// comme evaluateCertificationEligibility.
export async function evaluateModuleUnlock(
  supabase: SupabaseServerClient,
  enrollmentId: string,
  trainingId: string,
): Promise<Map<string, ModuleUnlockInfo>> {
  const { data: training } = await supabase
    .from("trainings")
    .select("sequential_unlock")
    .eq("id", trainingId)
    .maybeSingle();

  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, position, lessons(id)")
    .eq("training_id", trainingId)
    .order("position", { ascending: true });

  const sortedModules = (modules ?? []).slice().sort((a, b) => a.position - b.position);
  const result = new Map<string, ModuleUnlockInfo>();

  if (!training?.sequential_unlock) {
    for (const m of sortedModules) result.set(m.id, { unlocked: true, lockReason: null });
    return result;
  }

  const { data: progressRows } = await supabase
    .from("learner_progress")
    .select("lesson_id, completed_at")
    .eq("enrollment_id", enrollmentId)
    .not("completed_at", "is", null);
  const completedLessonIds = new Set((progressRows ?? []).map((p) => p.lesson_id));

  let previousModuleComplete = true;
  let previousModuleTitle: string | null = null;
  for (const m of sortedModules) {
    const unlocked = previousModuleComplete;
    result.set(m.id, {
      unlocked,
      lockReason: unlocked ? null : `Débloqué après le module « ${previousModuleTitle} ».`,
    });
    const lessonIds = (m.lessons ?? []).map((l) => l.id);
    previousModuleComplete = lessonIds.every((id) => completedLessonIds.has(id));
    previousModuleTitle = m.title;
  }

  return result;
}

// Reponse rapide pour une seule lecon (page de lecon / quiz), sans recalculer
// l'etat de tous les modules dans l'appelant.
export async function isModuleUnlockedForLesson(
  supabase: SupabaseServerClient,
  enrollmentId: string,
  trainingId: string,
  moduleId: string,
): Promise<ModuleUnlockInfo> {
  const unlockMap = await evaluateModuleUnlock(supabase, enrollmentId, trainingId);
  return unlockMap.get(moduleId) ?? { unlocked: true, lockReason: null };
}
