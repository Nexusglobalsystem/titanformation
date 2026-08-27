import type { CatalogueTraining } from "../_components/TrainingCard";

export type CatalogueFilters = {
  q: string;
  categorie: string;
  niveau: string;
  duree: string;
  certifiante: boolean;
  tri: string;
};

export function durationBucket(hours: number): "short" | "medium" | "long" {
  if (hours < 20) return "short";
  if (hours <= 50) return "medium";
  return "long";
}

export function filterAndSortTrainings(
  trainings: CatalogueTraining[],
  filters: CatalogueFilters,
): CatalogueTraining[] {
  return trainings
    .filter((t) => {
      const matchesSearch =
        filters.q.trim().length === 0 ||
        t.title.toLowerCase().includes(filters.q.toLowerCase()) ||
        t.summary.toLowerCase().includes(filters.q.toLowerCase());
      const matchesCategory = filters.categorie === "all" || t.category === filters.categorie;
      const matchesDuration = filters.duree === "all" || durationBucket(t.duration_hours) === filters.duree;
      const matchesLevel = filters.niveau === "all" || t.level === filters.niveau;
      const matchesCertifying = !filters.certifiante || t.is_certifying;
      return matchesSearch && matchesCategory && matchesDuration && matchesLevel && matchesCertifying;
    })
    .sort((a, b) => {
      if (filters.tri === "prix") return a.price_ht - b.price_ht;
      if (filters.tri === "popularite") return b.enrolledCount - a.enrolledCount;
      if (filters.tri === "session") {
        if (!a.nextSessionStartsOn) return 1;
        if (!b.nextSessionStartsOn) return -1;
        return a.nextSessionStartsOn.localeCompare(b.nextSessionStartsOn);
      }
      return 0;
    });
}
