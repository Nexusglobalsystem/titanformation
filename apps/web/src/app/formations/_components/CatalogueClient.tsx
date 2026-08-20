"use client";

import { useMemo, useState } from "react";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@titan-kinetic/ui";
import { TrainingCard, type CatalogueTraining } from "./TrainingCard";

const CATEGORY_LABELS: Record<string, string> = {
  management: "Management",
  conformite: "Conformité",
  technologies: "Technologies",
};

const LEVEL_LABELS: Record<string, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  avance: "Avancé",
};

function durationBucket(hours: number): "short" | "medium" | "long" {
  if (hours < 20) return "short";
  if (hours <= 50) return "medium";
  return "long";
}

export function CatalogueClient({
  trainings,
  initialSearch = "",
  initialCategory = "all",
}: {
  trainings: CatalogueTraining[];
  initialSearch?: string;
  initialCategory?: string;
}) {
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState<string>(initialCategory);
  const [duration, setDuration] = useState<string>("all");
  const [level, setLevel] = useState<string>("all");
  const [certifyingOnly, setCertifyingOnly] = useState(false);
  const [sort, setSort] = useState<string>("pertinence");

  const categories = useMemo(
    () => Array.from(new Set(trainings.map((t) => t.category).filter((c): c is string => Boolean(c)))),
    [trainings],
  );

  const filtered = trainings
    .filter((t) => {
      const matchesSearch =
        search.trim().length === 0 ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.summary.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "all" || t.category === category;
      const matchesDuration = duration === "all" || durationBucket(t.duration_hours) === duration;
      const matchesLevel = level === "all" || t.level === level;
      const matchesCertifying = !certifyingOnly || t.is_certifying;
      return matchesSearch && matchesCategory && matchesDuration && matchesLevel && matchesCertifying;
    })
    .sort((a, b) => {
      if (sort === "prix") return a.price_ht - b.price_ht;
      if (sort === "popularite") return b.enrolledCount - a.enrolledCount;
      if (sort === "session") {
        if (!a.nextSessionStartsOn) return 1;
        if (!b.nextSessionStartsOn) return -1;
        return a.nextSessionStartsOn.localeCompare(b.nextSessionStartsOn);
      }
      return 0;
    });

  return (
    <>
      <div className="mb-12 flex flex-col gap-4 rounded-lg border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="md:w-1/3">
            <Input
              placeholder="Rechercher une formation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 md:ml-auto">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Catégorie : Toutes</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {CATEGORY_LABELS[c] ?? c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Niveau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Niveau : Tous</SelectItem>
                {Object.entries(LEVEL_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Durée" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Durée : Toutes</SelectItem>
                <SelectItem value="short">Courte (&lt; 20h)</SelectItem>
                <SelectItem value="medium">Moyenne (20h – 50h)</SelectItem>
                <SelectItem value="long">Longue (&gt; 50h)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
          <label className="flex items-center gap-2 font-body text-sm text-foreground">
            <input
              type="checkbox"
              checked={certifyingOnly}
              onChange={(e) => setCertifyingOnly(e.target.checked)}
              className="h-4 w-4 accent-accent"
            />
            Certifiantes uniquement
          </label>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pertinence">Trier par : Pertinence</SelectItem>
              <SelectItem value="session">Trier par : Prochaine session</SelectItem>
              <SelectItem value="prix">Trier par : Prix croissant</SelectItem>
              <SelectItem value="popularite">Trier par : Popularité</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center font-body text-sm text-foreground-muted">
          Aucune formation ne correspond à ta recherche.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-(--spacing-gutter) md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((training) => (
            <TrainingCard key={training.id} training={training} />
          ))}
        </div>
      )}
    </>
  );
}
