import type { createClient } from "@/lib/supabase/server";
import type { Tables } from "@titan-kinetic/core/database.types";
import type { CatalogueTraining } from "../_components/TrainingCard";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const POPULAR_COUNT = 3;

// Prochaine session ouverte + nombre d'inscriptions actives par formation,
// calculés en lot (une requête pour tout le catalogue, pas une par carte) —
// jamais stocké, jamais un badge sans donnée réelle derrière.
export async function enrichTrainings(
  supabase: SupabaseServerClient,
  trainings: Tables<"trainings">[],
): Promise<CatalogueTraining[]> {
  if (trainings.length === 0) return [];
  const ids = trainings.map((t) => t.id);

  const [{ data: sessionsRaw }, { data: countsRaw }] = await Promise.all([
    supabase
      .from("sessions")
      .select("training_id, starts_on")
      .in("training_id", ids)
      .eq("status", "ouverte")
      .order("starts_on", { ascending: true }),
    // Comptage via une fonction security definer : la table enrollments elle-même
    // n'est lisible que par l'apprenant concerné, le staff ou le formateur — un
    // visiteur public ne peut pas la lire directement (RLS), donc le nombre
    // d'inscrits actives par formation passe par cette RPC en lecture agrégée.
    supabase.rpc("training_enrollment_counts"),
  ]);

  const nextSessionByTraining = new Map<string, string>();
  for (const s of sessionsRaw ?? []) {
    if (!nextSessionByTraining.has(s.training_id)) {
      nextSessionByTraining.set(s.training_id, s.starts_on);
    }
  }

  const enrolledCountByTraining = new Map<string, number>();
  for (const row of countsRaw ?? []) {
    enrolledCountByTraining.set(row.training_id, row.active_enrollments);
  }

  const popularIds = new Set(
    Array.from(enrolledCountByTraining.entries())
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, POPULAR_COUNT)
      .map(([id]) => id),
  );

  return trainings.map((t) => ({
    ...t,
    imageUrl: t.image_path ? supabase.storage.from("training-images").getPublicUrl(t.image_path).data.publicUrl : null,
    nextSessionStartsOn: nextSessionByTraining.get(t.id) ?? null,
    enrolledCount: enrolledCountByTraining.get(t.id) ?? 0,
    isPopular: popularIds.has(t.id),
  }));
}
