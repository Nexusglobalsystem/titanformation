import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@titan-kinetic/ui";
import { AssignTrainerForm } from "./AssignTrainerForm";
import { NewSessionForm } from "./NewSessionForm";
import { SessionSlotsBoard } from "./SessionSlotsBoard";
import { removeTrainerAction } from "../_actions/trainers";

const SESSION_STATUS_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  ouverte: "Ouverte",
  complete: "Complète",
  en_cours: "En cours",
  terminee: "Terminée",
  annulee: "Annulée",
};

type SessionWithTrainers = {
  id: string;
  reference: string;
  status: string;
  starts_on: string;
  ends_on: string;
  max_seats: number;
  session_trainers: { trainer_id: string; profiles: { first_name: string | null; last_name: string | null } | null }[] | null;
  session_slots: { id: string; slot_date: string; half_day: string; modality: string }[] | null;
};

// Extrait de admin/formations/[id]/page.tsx pour être réutilisable dans
// l'assistant de création (étape Planifier) — mêmes sessions/créneaux/
// affectations, aucun comportement changé.
export function SessionsPanel({
  trainingId,
  sessions,
  trainers,
}: {
  trainingId: string;
  sessions: SessionWithTrainers[];
  trainers: { id: string; first_name: string | null; last_name: string | null }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {sessions.length > 0 && (
          <div className="flex flex-col gap-2">
            {sessions.map((session) => {
              const assigned = session.session_trainers ?? [];
              const assignedIds = new Set(assigned.map((a) => a.trainer_id));
              const availableTrainers = trainers.filter((t) => !assignedIds.has(t.id));
              return (
                <div key={session.id} className="flex flex-col gap-2 rounded-DEFAULT border border-border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-body text-sm font-semibold text-foreground">{session.reference}</p>
                      <p className="font-body text-xs text-foreground-muted">
                        {new Date(session.starts_on).toLocaleDateString("fr-FR")} –{" "}
                        {new Date(session.ends_on).toLocaleDateString("fr-FR")} · {session.max_seats} places
                      </p>
                    </div>
                    <Badge variant="neutral">{SESSION_STATUS_LABELS[session.status] ?? session.status}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {assigned.map((a) => (
                      <div
                        key={a.trainer_id}
                        className="flex items-center gap-1 rounded-full border border-border bg-surface-elevated py-1 pl-3 pr-1 font-body text-xs text-foreground"
                      >
                        {a.profiles?.first_name} {a.profiles?.last_name}
                        <form action={removeTrainerAction}>
                          <input type="hidden" name="sessionId" value={session.id} />
                          <input type="hidden" name="trainingId" value={trainingId} />
                          <input type="hidden" name="trainerId" value={a.trainer_id} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 rounded-full p-0 text-xs"
                            aria-label="Retirer ce formateur"
                          >
                            ×
                          </Button>
                        </form>
                      </div>
                    ))}
                    <AssignTrainerForm sessionId={session.id} trainingId={trainingId} trainers={availableTrainers} />
                  </div>
                  <SessionSlotsBoard sessionId={session.id} trainingId={trainingId} slots={session.session_slots ?? []} />
                </div>
              );
            })}
          </div>
        )}
        <NewSessionForm trainingId={trainingId} trainers={trainers} />
      </CardContent>
    </Card>
  );
}
