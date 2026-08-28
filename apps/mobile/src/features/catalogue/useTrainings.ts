import { useQuery } from "@tanstack/react-query";
import type { Tables } from "@titan-kinetic/core/database.types";
import { supabase } from "../../lib/supabase";

export type CatalogueTraining = Tables<"trainings"> & {
  imageUrl: string | null;
  nextSessionStartsOn: string | null;
  enrolledCount: number;
  isPopular: boolean;
};

const POPULAR_COUNT = 3;

// Équivalent RN de apps/web/src/app/formations/_lib/enrichTrainings.ts —
// mêmes requêtes (sessions ouvertes + RPC training_enrollment_counts,
// nécessaire car enrollments n'est pas lisible directement par un visiteur
// public via RLS), même logique de "populaire" (top 3 par inscriptions
// actives). Catalogue public, aucune auth requise.
async function fetchTrainings(): Promise<CatalogueTraining[]> {
  const { data: trainings } = await supabase
    .from("trainings")
    .select("*")
    .eq("status", "publiee")
    .order("published_at", { ascending: false });

  if (!trainings || trainings.length === 0) return [];

  const ids = trainings.map((t) => t.id);
  const [{ data: sessionsRaw }, { data: countsRaw }] = await Promise.all([
    supabase
      .from("sessions")
      .select("training_id, starts_on")
      .in("training_id", ids)
      .eq("status", "ouverte")
      .order("starts_on", { ascending: true }),
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
    imageUrl: t.image_path
      ? supabase.storage.from("training-images").getPublicUrl(t.image_path).data.publicUrl
      : null,
    nextSessionStartsOn: nextSessionByTraining.get(t.id) ?? null,
    enrolledCount: enrolledCountByTraining.get(t.id) ?? 0,
    isPopular: popularIds.has(t.id),
  }));
}

export function useTrainings() {
  return useQuery({ queryKey: ["trainings", "catalogue"], queryFn: fetchTrainings });
}
