"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@titan-kinetic/ui";
import type { CatalogueFilters } from "../_lib/filterTrainings";

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

const DEFAULTS: CatalogueFilters = {
  q: "",
  categorie: "all",
  niveau: "all",
  duree: "all",
  certifiante: false,
  tri: "pertinence",
};

export function CatalogueShell({
  categories,
  filters,
  children,
}: {
  categories: string[];
  filters: CatalogueFilters;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(filters.q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Navigation (retour/avance navigateur, lien externe vers une URL filtrée)
  // change filters.q sans remonter ce composant client — resynchronise le
  // champ visible, sinon il reste bloqué sur la dernière saisie locale.
  useEffect(() => {
    setSearchInput(filters.q);
  }, [filters.q]);

  function pushFilters(next: Partial<CatalogueFilters>) {
    const merged: CatalogueFilters = { ...filters, ...next };
    const params = new URLSearchParams();
    (Object.keys(DEFAULTS) as (keyof CatalogueFilters)[]).forEach((key) => {
      const value = merged[key];
      if (value === DEFAULTS[key] || value === "") return;
      params.set(key, String(value));
    });
    const query = params.toString();
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushFilters({ q: value }), 400);
  }

  return (
    <>
      <div className="mb-12 flex flex-col gap-4 rounded-DEFAULT border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="md:w-1/3">
            <Input
              placeholder="Rechercher une formation..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 md:ml-auto">
            <Select value={filters.categorie} onValueChange={(v) => pushFilters({ categorie: v })}>
              <SelectTrigger className="w-44" aria-label="Filtrer par catégorie">
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
            <Select value={filters.niveau} onValueChange={(v) => pushFilters({ niveau: v })}>
              <SelectTrigger className="w-44" aria-label="Filtrer par niveau">
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
            <Select value={filters.duree} onValueChange={(v) => pushFilters({ duree: v })}>
              <SelectTrigger className="w-44" aria-label="Filtrer par durée">
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
              checked={filters.certifiante}
              onChange={(e) => pushFilters({ certifiante: e.target.checked })}
              className="h-4 w-4 accent-accent"
            />
            Certifiantes uniquement
          </label>
          <Select value={filters.tri} onValueChange={(v) => pushFilters({ tri: v })}>
            <SelectTrigger className="w-56" aria-label="Trier les résultats par">
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

      <div className={isPending ? "opacity-50 transition-opacity" : "transition-opacity"}>{children}</div>
    </>
  );
}
