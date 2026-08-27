import { createClient } from "@/lib/supabase/server";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { CatalogueShell } from "./_components/CatalogueShell";
import { TrainingCard } from "./_components/TrainingCard";
import { enrichTrainings } from "./_lib/enrichTrainings";
import { filterAndSortTrainings, type CatalogueFilters } from "./_lib/filterTrainings";

export const metadata = { title: "Catalogue de formations — Titan Kinetic" };

// Catalogue public, pas de contenu personnalisé (aucun appel à
// auth.getUser() ici) — safe à mettre en cache. Invalidé immédiatement à
// la publication d'une formation via revalidatePath("/formations") dans
// createTrainingAction/updateTrainingAction ; ce délai n'est qu'un filet
// de sécurité pour les autres cas (nouvelle session ouverte, etc.).
export const revalidate = 3600;

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const filters: CatalogueFilters = {
    q: sp.q ?? "",
    categorie: sp.categorie ?? "all",
    niveau: sp.niveau ?? "all",
    duree: sp.duree ?? "all",
    certifiante: sp.certifiante === "true",
    tri: sp.tri ?? "pertinence",
  };

  const supabase = await createClient();
  const { data: trainings } = await supabase
    .from("trainings")
    .select("*")
    .eq("status", "publiee")
    .order("published_at", { ascending: false });
  const enriched = await enrichTrainings(supabase, trainings ?? []);

  const categories = Array.from(new Set(enriched.map((t) => t.category).filter((c): c is string => Boolean(c))));
  const filtered = filterAndSortTrainings(enriched, filters);

  return (
    <div data-theme="dark" className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        <section className="border-b border-border bg-surface px-4 py-20 md:px-(--spacing-margin-desktop)">
          <div className="mx-auto flex max-w-(--spacing-container-max) flex-col gap-4">
            <span className="inline-block w-fit rounded border border-border bg-surface-elevated px-3 py-1 font-mono-label text-xs uppercase tracking-wide text-accent">
              Formation professionnelle
            </span>
            <h1 className="max-w-2xl font-display text-4xl font-bold text-foreground md:text-5xl">
              Des formations conçues pour la performance de vos équipes.
            </h1>
            <p className="max-w-xl font-body text-sm text-foreground-muted md:text-base">
              Programmes blended, animés en direct, certifiés Qualiopi — pour les particuliers
              comme pour les entreprises.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-(--spacing-container-max) px-4 py-12 md:px-(--spacing-margin-desktop)">
          <CatalogueShell categories={categories} filters={filters}>
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
          </CatalogueShell>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
