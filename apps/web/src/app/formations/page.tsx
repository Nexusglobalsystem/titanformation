import { createClient } from "@/lib/supabase/server";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { CatalogueClient } from "./_components/CatalogueClient";

export const metadata = { title: "Catalogue de formations — Titan Kinetic" };

export default async function CataloguePage() {
  const supabase = await createClient();
  const { data: trainings } = await supabase
    .from("trainings")
    .select("*")
    .eq("status", "publiee")
    .order("published_at", { ascending: false });

  return (
    <div data-theme="dark" className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader />
      <main className="flex-1">
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
          <CatalogueClient trainings={trainings ?? []} />
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
