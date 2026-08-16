"use client";

import { useMemo, useState } from "react";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@titan-kinetic/ui";
import type { Tables } from "@titan-kinetic/core/database.types";
import { TrainingCard } from "./TrainingCard";

const CATEGORY_LABELS: Record<string, string> = {
  management: "Management",
  conformite: "Conformité",
  technologies: "Technologies",
};

function durationBucket(hours: number): "short" | "medium" | "long" {
  if (hours < 20) return "short";
  if (hours <= 50) return "medium";
  return "long";
}

export function CatalogueClient({ trainings }: { trainings: Tables<"trainings">[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [duration, setDuration] = useState<string>("all");

  const categories = useMemo(
    () => Array.from(new Set(trainings.map((t) => t.category).filter((c): c is string => Boolean(c)))),
    [trainings],
  );

  const filtered = trainings.filter((t) => {
    const matchesSearch =
      search.trim().length === 0 ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.summary.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || t.category === category;
    const matchesDuration = duration === "all" || durationBucket(t.duration_hours) === duration;
    return matchesSearch && matchesCategory && matchesDuration;
  });

  return (
    <>
      <div className="mb-12 flex flex-col gap-4 rounded-lg border border-border bg-surface p-6 shadow-sm md:flex-row md:items-center">
        <div className="md:w-1/3">
          <Input
            placeholder="Rechercher une formation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-4 md:ml-auto">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-48">
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
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger className="w-48">
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
