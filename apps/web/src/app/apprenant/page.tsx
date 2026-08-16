import { createClient } from "@/lib/supabase/server";
import { SpaceShell } from "@/components/SpaceShell";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@titan-kinetic/ui";

const STATUS_LABELS: Record<string, string> = {
  preinscrit: "Préinscrit",
  en_attente_paiement: "En attente de paiement",
  confirme: "Confirmé",
  annule: "Annulé",
  termine: "Terminé",
  abandonne: "Abandonné",
};

const STATUS_VARIANTS: Record<string, "neutral" | "success" | "warning" | "error"> = {
  preinscrit: "warning",
  en_attente_paiement: "warning",
  confirme: "success",
  annule: "error",
  termine: "success",
  abandonne: "error",
};

export default async function ApprenantPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name")
    .eq("id", user!.id)
    .single();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id, status, created_at, sessions(reference, starts_on, ends_on, trainings(title, slug))")
    .eq("learner_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <SpaceShell title="Espace apprenant">
      <div className="flex flex-col gap-6">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Bienvenue{profile?.first_name ? `, ${profile.first_name}` : ""}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mes formations</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {!enrollments || enrollments.length === 0 ? (
              <p className="font-body text-sm text-foreground-muted">
                Aucune inscription pour le moment.{" "}
                <a href="/formations" className="text-accent-text hover:underline">
                  Parcourir le catalogue
                </a>
              </p>
            ) : (
              enrollments.map((enrollment) => {
                const session = enrollment.sessions;
                const training = session?.trainings;
                return (
                  <div
                    key={enrollment.id}
                    className="flex flex-col gap-2 rounded-DEFAULT border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-body text-sm font-semibold text-foreground">
                        {training?.title ?? "Formation"}
                      </p>
                      {session && (
                        <p className="font-body text-xs text-foreground-muted">
                          {session.reference} ·{" "}
                          {new Date(session.starts_on).toLocaleDateString("fr-FR")} –{" "}
                          {new Date(session.ends_on).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                    </div>
                    <Badge variant={STATUS_VARIANTS[enrollment.status] ?? "neutral"}>
                      {STATUS_LABELS[enrollment.status] ?? enrollment.status}
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </SpaceShell>
  );
}
