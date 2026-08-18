import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SpaceShell } from "@/components/SpaceShell";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@titan-kinetic/ui";
import { TrainingForm } from "../_components/TrainingForm";
import { NewSessionForm } from "../_components/NewSessionForm";
import { updateTrainingAction } from "../_actions/trainings";

const SESSION_STATUS_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  ouverte: "Ouverte",
  complete: "Complète",
  en_cours: "En cours",
  terminee: "Terminée",
  annulee: "Annulée",
};

export default async function EditFormationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: training } = await supabase.from("trainings").select("*").eq("id", id).maybeSingle();
  if (!training) notFound();

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, reference, status, starts_on, ends_on, max_seats")
    .eq("training_id", id)
    .order("starts_on", { ascending: true });

  return (
    <SpaceShell title="Espace administration">
      <div className="flex flex-col gap-6">
        <Link
          href="/admin/formations"
          className="inline-block font-body text-sm text-accent-text hover:underline"
        >
          ← Retour aux formations
        </Link>
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Modifier « {training.title} »</CardTitle>
          </CardHeader>
          <CardContent>
            <TrainingForm training={training} action={updateTrainingAction} submitLabel="Enregistrer" />
          </CardContent>
        </Card>

        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Sessions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {sessions && sessions.length > 0 && (
              <div className="flex flex-col gap-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between rounded-DEFAULT border border-border p-3"
                  >
                    <div>
                      <p className="font-body text-sm font-semibold text-foreground">{session.reference}</p>
                      <p className="font-body text-xs text-foreground-muted">
                        {new Date(session.starts_on).toLocaleDateString("fr-FR")} –{" "}
                        {new Date(session.ends_on).toLocaleDateString("fr-FR")} · {session.max_seats} places
                      </p>
                    </div>
                    <Badge variant="neutral">{SESSION_STATUS_LABELS[session.status] ?? session.status}</Badge>
                  </div>
                ))}
              </div>
            )}
            <NewSessionForm trainingId={training.id} />
          </CardContent>
        </Card>
      </div>
    </SpaceShell>
  );
}
