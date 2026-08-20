import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { evaluateModuleUnlock } from "@/lib/moduleUnlock";
import { canJoinSlot } from "@/lib/joinWindow";
import { SpaceShell } from "@/components/SpaceShell";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@titan-kinetic/ui";
import { IconCalendar, IconLock, IconVideo } from "@/components/icons";
import { cancelBookingAction } from "../_actions/booking";

const HALF_DAY_LABELS: Record<string, string> = { matin: "Matin", apres_midi: "Après-midi" };
const HALF_DAY_TIME: Record<string, string> = { matin: "08:00", apres_midi: "13:00" };

const MODALITY_LABELS: Record<string, string> = {
  presentiel: "Présentiel",
  livekit: "Classe virtuelle",
  autoapprentissage: "Auto-apprentissage",
  evaluation: "Évaluation",
  certification: "Certification",
};

const MODALITY_VARIANTS: Record<string, "neutral" | "success" | "warning" | "featured"> = {
  presentiel: "neutral",
  livekit: "featured",
  autoapprentissage: "success",
  evaluation: "warning",
  certification: "warning",
};

const BOOKING_STATUS_LABELS: Record<string, string> = { demandee: "Demandée", confirmee: "Confirmée" };

type SlotEntry = {
  type: "slot";
  dateKey: string;
  sortKey: string;
  id: string;
  trainingTitle: string;
  sessionReference: string;
  halfDay: string;
  modality: string;
  startsAt: string;
  endsAt: string;
};

type BookingEntry = {
  type: "booking";
  dateKey: string;
  sortKey: string;
  id: string;
  trainerName: string;
  startTime: string;
  endTime: string;
  status: string;
  reason: string | null;
};

export default async function AgendaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: slotsRaw }, { data: bookingsRaw }, { data: enrollmentsRaw }] = await Promise.all([
    // RLS ("creneaux visibles aux participants") filtre déjà sur
    // enrolled_session_ids() — aucun filtre applicatif supplémentaire requis.
    supabase
      .from("session_slots")
      .select("id, slot_date, half_day, starts_at, ends_at, modality, sessions(reference, trainings(title))")
      .order("slot_date", { ascending: true }),
    supabase
      .from("bookings")
      .select("id, booking_date, start_time, end_time, status, reason, profiles!bookings_trainer_id_fkey(first_name, last_name)")
      .eq("learner_id", user!.id)
      .in("status", ["demandee", "confirmee"])
      .order("booking_date", { ascending: true }),
    supabase
      .from("enrollments")
      .select("id, sessions(trainings(id, title, sequential_unlock))")
      .eq("learner_id", user!.id)
      .in("status", ["confirme", "termine"]),
  ]);

  // Deux systèmes indépendants (créneaux collectifs vs rendez-vous 1:1),
  // fusionnés seulement à l'affichage, jamais en base.
  const entries: (SlotEntry | BookingEntry)[] = [
    ...(slotsRaw ?? []).map((slot): SlotEntry => ({
      type: "slot",
      dateKey: slot.slot_date,
      sortKey: HALF_DAY_TIME[slot.half_day] ?? "00:00",
      id: slot.id,
      trainingTitle: slot.sessions?.trainings?.title ?? "Formation",
      sessionReference: slot.sessions?.reference ?? "",
      halfDay: slot.half_day,
      modality: slot.modality,
      startsAt: slot.starts_at,
      endsAt: slot.ends_at,
    })),
    ...(bookingsRaw ?? []).map((booking): BookingEntry => ({
      type: "booking",
      dateKey: booking.booking_date,
      sortKey: booking.start_time,
      id: booking.id,
      trainerName: booking.profiles
        ? `${booking.profiles.first_name ?? ""} ${booking.profiles.last_name ?? ""}`.trim()
        : "Formateur",
      startTime: booking.start_time,
      endTime: booking.end_time,
      status: booking.status,
      reason: booking.reason,
    })),
  ].sort((a, b) => (a.dateKey === b.dateKey ? a.sortKey.localeCompare(b.sortKey) : a.dateKey.localeCompare(b.dateKey)));

  const entriesByDate = new Map<string, (SlotEntry | BookingEntry)[]>();
  for (const entry of entries) {
    if (!entriesByDate.has(entry.dateKey)) entriesByDate.set(entry.dateKey, []);
    entriesByDate.get(entry.dateKey)!.push(entry);
  }
  const orderedDates = Array.from(entriesByDate.keys()).sort();

  // Mes modules : uniquement les formations à déverrouillage progressif —
  // sans cette option, les modules sont déjà tous accessibles depuis la
  // fiche formation, pas besoin de les dupliquer ici.
  const sequentialEnrollments = (enrollmentsRaw ?? [])
    .map((e) => ({ enrollmentId: e.id, training: e.sessions?.trainings }))
    .filter((e): e is { enrollmentId: string; training: NonNullable<typeof e.training> } =>
      Boolean(e.training?.sequential_unlock),
    );

  const moduleSections = await Promise.all(
    sequentialEnrollments.map(async ({ enrollmentId, training }) => {
      const [unlockMap, { data: modules }] = await Promise.all([
        evaluateModuleUnlock(supabase, enrollmentId, training.id),
        supabase.from("modules").select("id, title, position").eq("training_id", training.id).order("position", { ascending: true }),
      ]);
      return { enrollmentId, trainingTitle: training.title, modules: modules ?? [], unlockMap };
    }),
  );

  return (
    <SpaceShell title="Espace apprenant">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">Mon agenda</h1>
          <p className="mt-1 font-body text-sm text-foreground-muted">
            Vos créneaux de formation et vos rendez-vous, dans l&apos;ordre chronologique.
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-6 p-6">
            {orderedDates.length === 0 ? (
              <p className="font-body text-sm text-foreground-muted">Rien de prévu pour le moment.</p>
            ) : (
              orderedDates.map((dateKey) => (
                <div key={dateKey} className="flex flex-col gap-2">
                  <h3 className="font-mono-label text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                    {new Date(dateKey + "T00:00:00").toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "2-digit",
                      month: "long",
                    })}
                  </h3>
                  <div className="flex flex-col gap-2">
                    {entriesByDate.get(dateKey)!.map((entry) =>
                      entry.type === "slot" ? (
                        <div
                          key={`slot-${entry.id}`}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-DEFAULT border border-border p-3"
                        >
                          <div>
                            <p className="font-body text-sm font-semibold text-foreground">{entry.trainingTitle}</p>
                            <p className="font-body text-xs text-foreground-muted">
                              {HALF_DAY_LABELS[entry.halfDay] ?? entry.halfDay} · {entry.sessionReference}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={MODALITY_VARIANTS[entry.modality] ?? "neutral"}>
                              {MODALITY_LABELS[entry.modality] ?? entry.modality}
                            </Badge>
                            {entry.modality === "livekit" && canJoinSlot(entry.startsAt, entry.endsAt) && (
                              <Link href={`/salle/${entry.id}`}>
                                <Button variant="accent" size="sm" className="gap-1.5">
                                  <IconVideo size={16} />
                                  Rejoindre
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div
                          key={`booking-${entry.id}`}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-DEFAULT border border-accent/30 bg-accent/5 p-3"
                        >
                          <div className="flex items-center gap-2">
                            <IconCalendar size={16} />
                            <div>
                              <p className="font-body text-sm font-semibold text-foreground">
                                Rendez-vous — {entry.trainerName}
                              </p>
                              <p className="font-body text-xs text-foreground-muted">
                                {entry.startTime.slice(0, 5)} – {entry.endTime.slice(0, 5)}
                                {entry.reason ? ` · ${entry.reason}` : ""}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={entry.status === "confirmee" ? "success" : "warning"}>
                              {BOOKING_STATUS_LABELS[entry.status] ?? entry.status}
                            </Badge>
                            {entry.status === "confirmee" && (
                              <form action={cancelBookingAction}>
                                <input type="hidden" name="id" value={entry.id} />
                                <Button type="submit" variant="ghost" size="sm">
                                  Annuler
                                </Button>
                              </form>
                            )}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {moduleSections.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Mes modules</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {moduleSections.map((section) => (
                <div key={section.enrollmentId} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-body text-sm font-semibold text-foreground">{section.trainingTitle}</h3>
                    <Link
                      href={`/apprenant/formations/${section.enrollmentId}`}
                      className="font-body text-xs text-accent-text hover:underline"
                    >
                      Voir le programme
                    </Link>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {[...section.modules]
                      .sort((a, b) => a.position - b.position)
                      .map((module) => {
                        const unlock = section.unlockMap.get(module.id) ?? { unlocked: true, lockReason: null };
                        return unlock.unlocked ? (
                          <Link
                            key={module.id}
                            href={`/apprenant/formations/${section.enrollmentId}`}
                            className="flex items-center justify-between rounded-DEFAULT border border-border p-3 transition-colors hover:border-accent-text"
                          >
                            <span className="font-body text-sm text-foreground">{module.title}</span>
                          </Link>
                        ) : (
                          <div
                            key={module.id}
                            className="flex cursor-not-allowed items-center justify-between rounded-DEFAULT border border-border bg-surface p-3 opacity-60"
                          >
                            <div>
                              <span className="font-body text-sm text-foreground">{module.title}</span>
                              {unlock.lockReason && (
                                <p className="font-body text-xs text-foreground-muted">{unlock.lockReason}</p>
                              )}
                            </div>
                            <IconLock size={16} />
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </SpaceShell>
  );
}
