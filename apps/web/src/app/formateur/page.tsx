import { createClient } from "@/lib/supabase/server";
import { SpaceShell } from "@/components/SpaceShell";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@titan-kinetic/ui";
import { NewAvailabilityForm } from "./_components/NewAvailabilityForm";
import { NewExceptionForm } from "./_components/NewExceptionForm";
import {
  deleteAvailabilityAction,
  deleteExceptionAction,
  updateBookingStatusAction,
} from "./_actions/availability";

const WEEKDAY_LABELS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

const BOOKING_STATUS_LABELS: Record<string, string> = {
  demandee: "Demandée",
  confirmee: "Confirmée",
  annulee: "Annulée",
  terminee: "Terminée",
  absent: "Absent",
};

const BOOKING_STATUS_VARIANTS: Record<string, "neutral" | "success" | "warning" | "error"> = {
  demandee: "warning",
  confirmee: "success",
  annulee: "error",
  terminee: "success",
  absent: "error",
};

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

  const { data: availabilitiesRaw } = await supabase
    .from("trainer_availabilities")
    .select("id, weekday, start_time, end_time, slot_duration_minutes")
    .eq("trainer_id", user!.id);
  const availabilities = [...(availabilitiesRaw ?? [])].sort(
    (a, b) => a.weekday - b.weekday || a.start_time.localeCompare(b.start_time),
  );

  const { data: exceptions } = await supabase
    .from("availability_exceptions")
    .select("id, exception_date, start_time, end_time, reason")
    .eq("trainer_id", user!.id)
    .order("exception_date", { ascending: true });

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, booking_date, start_time, end_time, reason, status, profiles!bookings_learner_id_fkey(first_name, last_name, email)")
    .eq("trainer_id", user!.id)
    .order("booking_date", { ascending: true })
    .order("start_time", { ascending: true });

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

        <Card>
          <CardHeader>
            <CardTitle>Mes disponibilités</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <p className="font-mono-label text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                Créneaux hebdomadaires
              </p>
              {availabilities.length === 0 ? (
                <p className="font-body text-sm text-foreground-muted">Aucune disponibilité définie.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {availabilities.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between rounded-DEFAULT border border-border p-3"
                    >
                      <p className="font-body text-sm text-foreground">
                        {WEEKDAY_LABELS[a.weekday]} · {a.start_time.slice(0, 5)} – {a.end_time.slice(0, 5)} ·
                        créneaux de {a.slot_duration_minutes} min
                      </p>
                      <form action={deleteAvailabilityAction}>
                        <input type="hidden" name="id" value={a.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          Supprimer
                        </Button>
                      </form>
                    </div>
                  ))}
                </div>
              )}
              <NewAvailabilityForm />
            </div>

            <div className="flex flex-col gap-3">
              <p className="font-mono-label text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                Exceptions (congés, indisponibilités ponctuelles)
              </p>
              {!exceptions || exceptions.length === 0 ? (
                <p className="font-body text-sm text-foreground-muted">Aucune exception.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {exceptions.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between rounded-DEFAULT border border-border p-3"
                    >
                      <p className="font-body text-sm text-foreground">
                        {new Date(e.exception_date).toLocaleDateString("fr-FR")}
                        {e.start_time && e.end_time ? ` · ${e.start_time.slice(0, 5)} – ${e.end_time.slice(0, 5)}` : " · journée entière"}
                        {e.reason ? ` — ${e.reason}` : ""}
                      </p>
                      <form action={deleteExceptionAction}>
                        <input type="hidden" name="id" value={e.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          Supprimer
                        </Button>
                      </form>
                    </div>
                  ))}
                </div>
              )}
              <NewExceptionForm />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mes rendez-vous</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {!bookings || bookings.length === 0 ? (
              <p className="font-body text-sm text-foreground-muted">Aucun rendez-vous réservé pour le moment.</p>
            ) : (
              bookings.map((booking) => {
                const learner = booking.profiles;
                return (
                  <div
                    key={booking.id}
                    className="flex flex-col gap-2 rounded-DEFAULT border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-body text-sm font-semibold text-foreground">
                        {learner ? `${learner.first_name ?? ""} ${learner.last_name ?? ""}`.trim() : "—"}
                      </p>
                      <p className="font-body text-xs text-foreground-muted">
                        {new Date(booking.booking_date).toLocaleDateString("fr-FR")} ·{" "}
                        {booking.start_time.slice(0, 5)} – {booking.end_time.slice(0, 5)}
                        {booking.reason ? ` — ${booking.reason}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={BOOKING_STATUS_VARIANTS[booking.status] ?? "neutral"}>
                        {BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
                      </Badge>
                      {booking.status === "confirmee" && (
                        <>
                          <form action={updateBookingStatusAction}>
                            <input type="hidden" name="id" value={booking.id} />
                            <input type="hidden" name="status" value="terminee" />
                            <Button type="submit" variant="outline" size="sm">
                              Terminé
                            </Button>
                          </form>
                          <form action={updateBookingStatusAction}>
                            <input type="hidden" name="id" value={booking.id} />
                            <input type="hidden" name="status" value="absent" />
                            <Button type="submit" variant="outline" size="sm">
                              Absent
                            </Button>
                          </form>
                          <form action={updateBookingStatusAction}>
                            <input type="hidden" name="id" value={booking.id} />
                            <input type="hidden" name="status" value="annulee" />
                            <Button type="submit" variant="ghost" size="sm">
                              Annuler
                            </Button>
                          </form>
                        </>
                      )}
                    </div>
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
