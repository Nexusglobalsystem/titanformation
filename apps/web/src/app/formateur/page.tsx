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

const HALF_DAY_LABELS: Record<string, string> = {
  matin: "Matin",
  apres_midi: "Après-midi",
};

export default async function FormateurPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name")
    .eq("id", user!.id)
    .single();

  const { data: sessions } = await supabase
    .from("sessions")
    .select(
      "id, reference, status, starts_on, ends_on, trainings(title), enrollments(id, status, profiles(first_name, last_name, email))",
    )
    .order("starts_on", { ascending: true });

  const { data: slotsRaw } = await supabase
    .from("session_slots")
    .select(
      "id, slot_date, half_day, sessions(reference, trainings(title)), attendances(id, signed_at, present, enrollments(profiles(first_name, last_name)))",
    )
    .order("slot_date", { ascending: true });

  const HALF_DAY_ORDER: Record<string, number> = { matin: 0, apres_midi: 1 };
  const slots = [...(slotsRaw ?? [])].sort(
    (a, b) => (HALF_DAY_ORDER[a.half_day] ?? 0) - (HALF_DAY_ORDER[b.half_day] ?? 0),
  );

  return (
    <SpaceShell title="Espace formateur">
      <div className="flex flex-col gap-6">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Bienvenue{profile?.first_name ? `, ${profile.first_name}` : ""}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mes sessions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {!sessions || sessions.length === 0 ? (
              <p className="font-body text-sm text-foreground-muted">
                Aucune session ne t'est affectée pour le moment.
              </p>
            ) : (
              sessions.map((session) => {
                const enrolled = session.enrollments ?? [];
                const confirmed = enrolled.filter((e) => e.status === "confirme" || e.status === "termine");
                return (
                  <div key={session.id} className="flex flex-col gap-3 rounded-DEFAULT border border-border p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-body text-sm font-semibold text-foreground">
                          {session.trainings?.title ?? "Formation"}
                        </p>
                        <p className="font-body text-xs text-foreground-muted">
                          {session.reference} ·{" "}
                          {new Date(session.starts_on).toLocaleDateString("fr-FR")} –{" "}
                          {new Date(session.ends_on).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <span className="font-body text-xs text-foreground-muted">
                        {confirmed.length} inscrit{confirmed.length > 1 ? "s" : ""} confirmé
                        {confirmed.length > 1 ? "s" : ""}
                      </span>
                    </div>

                    {enrolled.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {enrolled.map((enrollment) => {
                          const learner = enrollment.profiles;
                          return (
                            <div
                              key={enrollment.id}
                              className="flex items-center justify-between border-t border-border pt-2 first:border-t-0 first:pt-0"
                            >
                              <span className="font-body text-sm text-foreground">
                                {learner ? `${learner.first_name ?? ""} ${learner.last_name ?? ""}`.trim() : "—"}
                              </span>
                              <Badge variant={STATUS_VARIANTS[enrollment.status] ?? "neutral"}>
                                {STATUS_LABELS[enrollment.status] ?? enrollment.status}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Émargement</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {!slots || slots.length === 0 ? (
              <p className="font-body text-sm text-foreground-muted">Aucun créneau pour le moment.</p>
            ) : (
              slots.map((slot) => {
                const attendances = slot.attendances ?? [];
                return (
                  <div key={slot.id} className="flex flex-col gap-2 rounded-DEFAULT border border-border p-4">
                    <p className="font-body text-sm font-semibold text-foreground">
                      {slot.sessions?.trainings?.title ?? "Formation"} —{" "}
                      {new Date(slot.slot_date).toLocaleDateString("fr-FR")} ·{" "}
                      {HALF_DAY_LABELS[slot.half_day] ?? slot.half_day}
                    </p>
                    {attendances.length === 0 ? (
                      <p className="font-body text-xs text-foreground-muted">Aucun inscrit sur ce créneau.</p>
                    ) : (
                      attendances.map((attendance) => {
                        const learner = attendance.enrollments?.profiles;
                        return (
                          <div
                            key={attendance.id}
                            className="flex items-center justify-between border-t border-border pt-2 first:border-t-0 first:pt-0"
                          >
                            <span className="font-body text-sm text-foreground">
                              {learner ? `${learner.first_name ?? ""} ${learner.last_name ?? ""}`.trim() : "—"}
                            </span>
                            {attendance.signed_at ? (
                              <Badge variant="success">
                                Signé le {new Date(attendance.signed_at).toLocaleString("fr-FR")}
                              </Badge>
                            ) : (
                              <Badge variant="warning">Non signé</Badge>
                            )}
                          </div>
                        );
                      })
                    )}
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
