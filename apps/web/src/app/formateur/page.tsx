import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SpaceShell } from "@/components/SpaceShell";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState } from "@titan-kinetic/ui";
import {
  IconAlertTriangle,
  IconCalendar,
  IconCheckCircle,
  IconClipboardCheck,
  IconClock,
  IconTasks,
  IconUsers,
  IconVideo,
} from "@/components/icons";
import { NewAvailabilityForm } from "./_components/NewAvailabilityForm";
import { NewExceptionForm } from "./_components/NewExceptionForm";
import {
  deleteAvailabilityAction,
  deleteExceptionAction,
  updateBookingStatusAction,
} from "./_actions/availability";
import { canJoinSlot } from "@/lib/joinWindow";

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
      "id, slot_date, half_day, starts_at, ends_at, modality, sessions(reference, trainings(title)), attendances(id, signed_at, present, enrollments(profiles(first_name, last_name)))",
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

  const activeSessionsCount = (sessions ?? []).filter(
    (s) => s.status === "ouverte" || s.status === "en_cours",
  ).length;
  const unsignedAttendances = slots.flatMap((s) => (s.attendances ?? []).filter((a) => !a.signed_at));

  // Regroupés par session plutôt qu'en liste plate de créneaux — un
  // formateur avec plusieurs sessions actives voit un bloc par formation
  // au lieu de 15-20 cartes de créneau indifférenciées.
  const slotGroups = (() => {
    const map = new Map<string, { key: string; label: string; items: typeof slots }>();
    for (const slot of slots) {
      const session = slot.sessions;
      const key = session?.reference ?? "—";
      const label = session?.trainings?.title ?? "Formation";
      if (!map.has(key)) map.set(key, { key, label, items: [] });
      map.get(key)!.items.push(slot);
    }
    return Array.from(map.values());
  })();
  const today = new Date().toISOString().slice(0, 10);
  const upcomingBookings = (bookings ?? []).filter((b) => b.status === "confirmee" && b.booking_date >= today);
  const nextBooking = upcomingBookings[0];

  return (
    <SpaceShell title="Espace formateur">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">
            Bienvenue{profile?.first_name ? `, ${profile.first_name}` : ""}
          </h1>
          <p className="mt-1 font-body text-sm text-foreground-muted">
            Vue d'ensemble de vos sessions et interventions requises.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card>
            <CardContent className="flex flex-col gap-2 p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono-label text-xs uppercase tracking-wide text-foreground-muted">
                  Sessions actives
                </span>
                <IconUsers size={18} />
              </div>
              <span className="font-display text-3xl font-semibold tabular-nums text-foreground">
                {activeSessionsCount}
              </span>
              {upcomingBookings.length > 0 && (
                <span className="font-body text-xs text-foreground-muted">
                  {upcomingBookings.length} rendez-vous à venir
                </span>
              )}
            </CardContent>
          </Card>

          {unsignedAttendances.length > 0 ? (
            <a
              href="#emargement"
              className="flex flex-col justify-between gap-4 rounded-xl border border-accent/30 bg-primary p-6 text-on-primary lg:col-span-2 hover:border-accent/60"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-lg font-bold">Émargement à valider</h3>
                  <p className="mt-1 font-body text-sm text-on-primary/70">
                    {unsignedAttendances.length} signature{unsignedAttendances.length > 1 ? "s" : ""} en attente
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-error/40 bg-error/10 px-3 py-1 font-mono-label text-[11px] uppercase tracking-wide text-error">
                  <IconAlertTriangle size={14} />
                  À traiter
                </span>
              </div>
              <span className="inline-flex items-center gap-2 font-body text-sm font-semibold text-accent">
                Voir le détail
              </span>
            </a>
          ) : (
            <div className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-surface-elevated p-6 lg:col-span-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">Émargement à jour</h3>
                  <p className="mt-1 font-body text-sm text-foreground-muted">
                    Aucune signature en attente.
                  </p>
                </div>
                <IconCheckCircle size={22} />
              </div>
              {nextBooking && (
                <p className="font-body text-sm text-foreground-muted">
                  Prochain rendez-vous :{" "}
                  <span className="font-medium text-foreground">
                    {new Date(nextBooking.booking_date + "T00:00:00").toLocaleDateString("fr-FR")} ·{" "}
                    {nextBooking.start_time.slice(0, 5)}
                  </span>
                </p>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <a
            href="#disponibilites"
            className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-surface-elevated p-4 text-center hover:border-accent/50"
          >
            <IconCalendar />
            <span className="font-body text-sm font-medium text-foreground">Disponibilités</span>
          </a>
          <a
            href="#rendez-vous"
            className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-surface-elevated p-4 text-center hover:border-accent/50"
          >
            <IconClipboardCheck />
            <span className="font-body text-sm font-medium text-foreground">Rendez-vous</span>
          </a>
          <Link
            href="/formateur/taches"
            className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-surface-elevated p-4 text-center hover:border-accent/50"
          >
            <IconTasks />
            <span className="font-body text-sm font-medium text-foreground">Mes tâches</span>
          </Link>
          <Link
            href="/formateur/notifications"
            className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-surface-elevated p-4 text-center hover:border-accent/50"
          >
            <IconAlertTriangle />
            <span className="font-body text-sm font-medium text-foreground">Notifications</span>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Mes sessions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {!sessions || sessions.length === 0 ? (
              <EmptyState icon={<IconCalendar />} title="Aucune session ne t'est affectée pour le moment." />
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

        <Card id="emargement" className="scroll-mt-8">
          <CardHeader>
            <CardTitle>Émargement</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {!slots || slots.length === 0 ? (
              <EmptyState icon={<IconClock />} title="Aucun créneau pour le moment." />
            ) : (
              slotGroups.map((group) => (
                <div key={group.key} className="flex flex-col gap-2">
                  <p className="font-mono-label text-xs uppercase tracking-wide text-foreground-muted">
                    {group.label} · {group.key}
                  </p>
                  <div className="flex flex-col gap-2">
                    {group.items.map((slot) => {
                      const attendances = slot.attendances ?? [];
                      return (
                        <div key={slot.id} className="flex flex-col gap-2 rounded-DEFAULT border border-border p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-body text-sm font-semibold text-foreground">
                              {new Date(slot.slot_date).toLocaleDateString("fr-FR")} ·{" "}
                              {HALF_DAY_LABELS[slot.half_day] ?? slot.half_day}
                            </p>
                            {slot.modality === "livekit" && canJoinSlot(slot.starts_at, slot.ends_at) && (
                              <Link href={`/salle/${slot.id}`}>
                                <Button variant="accent" size="sm" className="gap-1.5">
                                  <IconVideo size={16} />
                                  Rejoindre la classe virtuelle
                                </Button>
                              </Link>
                            )}
                          </div>
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
                                    {learner
                                      ? `${learner.first_name ?? ""} ${learner.last_name ?? ""}`.trim()
                                      : "—"}
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
                    })}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card id="disponibilites" className="scroll-mt-8">
          <CardHeader>
            <CardTitle>Mes disponibilités</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <p className="font-mono-label text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                Créneaux hebdomadaires
              </p>
              {availabilities.length === 0 ? (
                <EmptyState icon={<IconClock />} title="Aucune disponibilité définie." />
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
                <EmptyState icon={<IconCalendar />} title="Aucune exception." />
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

        <Card id="rendez-vous" className="scroll-mt-8">
          <CardHeader>
            <CardTitle>Mes rendez-vous</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {!bookings || bookings.length === 0 ? (
              <EmptyState icon={<IconCalendar />} title="Aucun rendez-vous réservé pour le moment." />
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
