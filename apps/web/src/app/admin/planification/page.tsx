import { createClient } from "@/lib/supabase/server";
import { SpaceShell } from "@/components/SpaceShell";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@titan-kinetic/ui";
import { AssignTrainerForm } from "../formations/_components/AssignTrainerForm";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function formatDateRange(startsOn: string, endsOn: string) {
  const start = new Date(startsOn + "T00:00:00").toLocaleDateString("fr-FR");
  const end = new Date(endsOn + "T00:00:00").toLocaleDateString("fr-FR");
  return startsOn === endsOn ? start : `${start} → ${end}`;
}

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart <= bEnd && bStart <= aEnd;
}

export default async function PlanificationPage() {
  const supabase = await createClient();

  const [{ data: pendingSessions }, { data: trainerRoles }, { data: allAssignments }, { data: allBookings }, { data: availabilities }] =
    await Promise.all([
      supabase
        .from("sessions")
        .select("id, reference, starts_on, ends_on, status, max_seats, training_id, trainings(title)")
        .in("status", ["brouillon", "ouverte"])
        .order("starts_on", { ascending: true }),
      supabase
        .from("user_roles")
        .select("profiles!user_roles_user_id_fkey(id, first_name, last_name)")
        .eq("role", "formateur"),
      supabase
        .from("session_trainers")
        .select("trainer_id, sessions(id, reference, starts_on, ends_on, status)"),
      supabase.from("bookings").select("trainer_id, booking_date, status"),
      supabase.from("trainer_availabilities").select("trainer_id, weekday, start_time, end_time").order("weekday"),
    ]);

  const assignedSessionIds = new Set(
    (await supabase.from("session_trainers").select("session_id")).data?.map((r) => r.session_id) ?? [],
  );
  const sessionsToPlan = (pendingSessions ?? []).filter((s) => !assignedSessionIds.has(s.id));

  const { data: enrollmentRows } = await supabase
    .from("enrollments")
    .select("session_id, status")
    .in("session_id", sessionsToPlan.map((s) => s.id));
  const enrolledCountBySession = new Map<string, number>();
  for (const row of enrollmentRows ?? []) {
    if (row.status === "annule" || row.status === "abandonne") continue;
    enrolledCountBySession.set(row.session_id, (enrolledCountBySession.get(row.session_id) ?? 0) + 1);
  }

  const trainers = Array.from(
    new Map(
      (trainerRoles ?? [])
        .filter((r) => r.profiles)
        .map((r) => [r.profiles!.id, { id: r.profiles!.id, name: `${r.profiles!.first_name ?? ""} ${r.profiles!.last_name ?? ""}`.trim() }]),
    ).values(),
  );

  const today = new Date().toISOString().slice(0, 10);

  function trainerStats(trainerId: string, candidateSession: { starts_on: string; ends_on: string }) {
    const assignments = (allAssignments ?? []).filter((a) => a.trainer_id === trainerId && a.sessions);
    const activeAssignments = assignments.filter(
      (a) => a.sessions!.status !== "terminee" && a.sessions!.status !== "annulee",
    );
    const upcomingBookings = (allBookings ?? []).filter(
      (b) => b.trainer_id === trainerId && b.status === "confirmee" && b.booking_date >= today,
    );
    const conflicts = activeAssignments.filter((a) =>
      rangesOverlap(a.sessions!.starts_on, a.sessions!.ends_on, candidateSession.starts_on, candidateSession.ends_on),
    );
    const declared = (availabilities ?? [])
      .filter((av) => av.trainer_id === trainerId)
      .map((av) => `${WEEKDAY_LABELS[av.weekday]} ${av.start_time.slice(0, 5)}-${av.end_time.slice(0, 5)}`);

    return {
      charge: activeAssignments.length + upcomingBookings.length,
      conflicts,
      declared,
    };
  }

  return (
    <SpaceShell title="Espace administration">
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Planification pédagogique</CardTitle>
          <p className="font-body text-sm text-foreground-muted">
            Sessions sans formateur affecté. Pour chacune, la charge et les conflits de chaque
            formateur sont calculés à partir de ses affectations et rendez-vous déjà confirmés ;
            les disponibilités déclarées sont indicatives.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {sessionsToPlan.length === 0 ? (
            <p className="font-body text-sm text-foreground-muted">
              Aucune session en attente d&apos;affectation — tout est planifié.
            </p>
          ) : (
            sessionsToPlan.map((session) => {
              const training = session.trainings;
              const enrolledCount = enrolledCountBySession.get(session.id) ?? 0;
              return (
                <div key={session.id} className="flex flex-col gap-3 rounded-DEFAULT border border-border p-4">
                  <div>
                    <p className="font-body text-sm font-semibold text-foreground">
                      {training?.title ?? "Formation inconnue"} · {session.reference}
                    </p>
                    <p className="font-body text-xs text-foreground-muted">
                      {formatDateRange(session.starts_on, session.ends_on)} · {enrolledCount}/{session.max_seats}{" "}
                      apprenant{enrolledCount > 1 ? "s" : ""} inscrit{enrolledCount > 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    {trainers.length === 0 ? (
                      <p className="font-body text-xs text-foreground-muted">Aucun formateur enregistré.</p>
                    ) : (
                      trainers.map((t) => {
                        const { charge, conflicts, declared } = trainerStats(t.id, session);
                        return (
                          <div
                            key={t.id}
                            className="flex flex-col gap-1 rounded-DEFAULT bg-surface-elevated p-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="font-body text-sm font-medium text-foreground">{t.name}</p>
                              <p className="font-body text-xs text-foreground-muted">
                                Charge : {charge} engagement{charge > 1 ? "s" : ""} en cours
                                {declared.length > 0 ? ` · Disponible : ${declared.join(", ")}` : " · Aucune disponibilité déclarée"}
                              </p>
                              {conflicts.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {conflicts.map((c) => (
                                    <Badge key={c.sessions!.id} variant="error">
                                      Conflit : {c.sessions!.reference}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <AssignTrainerForm
                              sessionId={session.id}
                              trainingId={session.training_id}
                              trainers={[{ id: t.id, first_name: t.name.split(" ")[0] ?? "", last_name: t.name.split(" ").slice(1).join(" ") || null }]}
                            />
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </SpaceShell>
  );
}
