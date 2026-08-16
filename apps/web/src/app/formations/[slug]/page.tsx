import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { Button, Card, CardContent } from "@titan-kinetic/ui";
import { EnrollForm } from "./_components/EnrollForm";

export default async function TrainingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: training } = await supabase
    .from("trainings")
    .select("*")
    .eq("slug", slug)
    .eq("status", "publiee")
    .maybeSingle();

  if (!training) notFound();

  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("training_id", training.id)
    .eq("status", "ouverte")
    .order("starts_on", { ascending: true })
    .limit(1)
    .maybeSingle();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let existingEnrollment: { status: string } | null = null;
  if (user && session) {
    const { data } = await supabase
      .from("enrollments")
      .select("status")
      .eq("session_id", session.id)
      .eq("learner_id", user.id)
      .maybeSingle();
    existingEnrollment = data;
  }

  return (
    <div data-theme="dark" className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader />
      <main className="mx-auto w-full max-w-(--spacing-container-max) flex-1 px-4 py-8 md:px-(--spacing-margin-desktop)">
        <nav className="mb-8 flex items-center gap-2 font-mono-label text-xs uppercase tracking-wide text-foreground-muted">
          <Link href="/formations" className="hover:text-accent">
            Catalogue
          </Link>
          <span>/</span>
          <span className="text-accent">{training.title}</span>
        </nav>

        <div className="mb-8 flex flex-col gap-4">
          <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">{training.title}</h1>
          <p className="max-w-3xl font-body text-sm text-foreground-muted md:text-base">{training.summary}</p>
        </div>

        <div className="grid grid-cols-1 gap-(--spacing-gutter) lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-8">
            <Card>
              <CardContent className="p-6 pt-6">
                <h2 className="mb-4 font-display text-xl font-semibold text-accent">Objectifs de la formation</h2>
                <p className="font-body text-sm text-foreground">{training.objectives}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 pt-6">
                <h2 className="mb-4 font-display text-xl font-semibold text-accent">Modalités pédagogiques</h2>
                <p className="font-body text-sm text-foreground">{training.pedagogical_means}</p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-(--spacing-gutter) md:grid-cols-2">
              <Card>
                <CardContent className="p-6 pt-6">
                  <h2 className="mb-3 font-display text-lg font-semibold text-accent">Public visé</h2>
                  <p className="font-body text-sm text-foreground-muted">{training.target_audience}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 pt-6">
                  <h2 className="mb-3 font-display text-lg font-semibold text-accent">Prérequis</h2>
                  <p className="font-body text-sm text-foreground-muted">{training.prerequisites}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-6 pt-6">
                <h2 className="mb-3 font-display text-lg font-semibold text-accent">Modalités d'évaluation</h2>
                <p className="font-body text-sm text-foreground-muted">{training.assessment_methods}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 pt-6">
                <h2 className="mb-3 font-display text-lg font-semibold text-accent">Accessibilité</h2>
                <p className="font-body text-sm text-foreground-muted">{training.accessibility_info}</p>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4">
            <Card className="sticky top-24">
              <CardContent className="flex flex-col gap-6 p-6 pt-6">
                <div className="flex items-end justify-between border-b border-border pb-6">
                  <span className="font-display text-3xl font-bold text-accent">{training.price_ht} €</span>
                  <span className="pb-1 font-body text-sm text-foreground-muted">HT / participant</span>
                </div>

                <dl className="flex flex-col gap-3 font-body text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-foreground-muted">Durée</dt>
                    <dd className="text-right font-semibold text-foreground">{training.duration_hours} heures</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-foreground-muted">Format</dt>
                    <dd className="text-right font-semibold text-foreground">{training.modalities}</dd>
                  </div>
                  {session && (
                    <div className="flex items-center justify-between">
                      <dt className="text-foreground-muted">Prochaine session</dt>
                      <dd className="text-right font-semibold text-foreground">
                        {new Date(session.starts_on).toLocaleDateString("fr-FR")} · {session.reference}
                      </dd>
                    </div>
                  )}
                </dl>

                <div className="flex flex-col gap-3 pt-2">
                  {!session ? (
                    <p className="font-body text-sm text-foreground-muted">
                      Aucune session ouverte pour le moment.
                    </p>
                  ) : existingEnrollment ? (
                    <p role="status" className="rounded-DEFAULT bg-success-bg px-3 py-2 font-body text-sm text-success">
                      Inscription enregistrée — statut : {existingEnrollment.status}. Un gestionnaire te
                      contactera pour la suite.
                    </p>
                  ) : user ? (
                    <EnrollForm sessionId={session.id} slug={training.slug} />
                  ) : (
                    <Link href={`/connexion?next=/formations/${training.slug}`}>
                      <Button variant="accent" className="w-full">
                        Se connecter pour s'inscrire
                      </Button>
                    </Link>
                  )}
                  <a href="mailto:contact@titankinetic.fr?subject=Demande de devis">
                    <Button variant="outline" className="w-full">
                      Demander un devis
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
