import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SpaceShell } from "@/components/SpaceShell";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Textarea } from "@titan-kinetic/ui";
import { IconCalendar } from "@/components/icons";
import { createBookingAction, cancelBookingAction } from "../_actions/booking";

const WEEKDAY_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const WEEKDAY_LABELS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const MONTH_SHORT = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
const DAYS_AHEAD = 21;

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

function toMondayIndex(date: Date) {
  return (date.getDay() + 6) % 7; // JS: 0 = dimanche → aligné sur 0 = lundi
}

function addMinutes(time: string, minutes: number) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    formateur?: string;
    date?: string;
    heure?: string;
    error?: string;
    success?: string;
  }>;
}) {
  const { formateur: selectedTrainerId, date: dateParam, heure: selectedHeure, error, success } =
    await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: formateurIds } = await supabase.rpc("formateur_ids");
  const { data: trainersRaw } =
    formateurIds && formateurIds.length > 0
      ? await supabase.from("profiles").select("id, first_name, last_name").in("id", formateurIds)
      : { data: [] as { id: string; first_name: string | null; last_name: string | null }[] };
  const trainers = trainersRaw ?? [];

  const selectedTrainer = trainers.find((t) => t.id === selectedTrainerId);
  const slotsByDate: Record<string, { start_time: string; end_time: string }[]> = {};
  const calendarDays: { key: string; date: Date; hasSlots: boolean }[] = [];

  if (selectedTrainer) {
    const today = new Date();
    const from = formatDateKey(today);
    const toDateObj = new Date(today);
    toDateObj.setDate(toDateObj.getDate() + DAYS_AHEAD - 1);
    const to = formatDateKey(toDateObj);

    const { data: availabilities } = await supabase
      .from("trainer_availabilities")
      .select("weekday, start_time, end_time, slot_duration_minutes")
      .eq("trainer_id", selectedTrainer.id);

    const { data: exceptions } = await supabase
      .from("availability_exceptions")
      .select("exception_date, start_time, end_time")
      .eq("trainer_id", selectedTrainer.id)
      .gte("exception_date", from)
      .lte("exception_date", to);

    const { data: taken } = await supabase.rpc("taken_slots", {
      p_trainer_id: selectedTrainer.id,
      p_from: from,
      p_to: to,
    });
    const takenSet = new Set((taken ?? []).map((t) => `${t.booking_date}T${t.start_time.slice(0, 5)}`));

    const now = new Date();
    const nowHm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    for (let i = 0; i < DAYS_AHEAD; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateKey = formatDateKey(date);
      const weekday = toMondayIndex(date);

      const dayExceptions = (exceptions ?? []).filter((e) => e.exception_date === dateKey);
      const fullyBlocked = dayExceptions.some((e) => !e.start_time);

      const daySlots: { start_time: string; end_time: string }[] = [];
      if (!fullyBlocked) {
        const rulesForDay = (availabilities ?? []).filter((a) => a.weekday === weekday);
        for (const rule of rulesForDay) {
          let cursor = rule.start_time.slice(0, 5);
          const end = rule.end_time.slice(0, 5);
          while (addMinutes(cursor, rule.slot_duration_minutes) <= end) {
            const slotStart = cursor;
            const slotEnd = addMinutes(cursor, rule.slot_duration_minutes);
            cursor = slotEnd;

            const blockedByException = dayExceptions.some(
              (e) =>
                e.start_time &&
                e.end_time &&
                slotStart < e.end_time.slice(0, 5) &&
                slotEnd > e.start_time.slice(0, 5),
            );
            const isTaken = takenSet.has(`${dateKey}T${slotStart}`);
            const isPast = i === 0 && slotStart <= nowHm;

            if (!blockedByException && !isTaken && !isPast) {
              daySlots.push({ start_time: slotStart, end_time: slotEnd });
            }
          }
        }
      }

      calendarDays.push({ key: dateKey, date, hasSlots: daySlots.length > 0 });
      if (daySlots.length > 0) slotsByDate[dateKey] = daySlots;
    }
  }

  const firstAvailableDate = calendarDays.find((d) => d.hasSlots)?.key;
  const selectedDate = dateParam && slotsByDate[dateParam] ? dateParam : firstAvailableDate;
  const daySlots = selectedDate ? (slotsByDate[selectedDate] ?? []) : [];
  const morningSlots = daySlots.filter((s) => s.start_time < "13:00");
  const afternoonSlots = daySlots.filter((s) => s.start_time >= "13:00");

  const { data: myBookings } = await supabase
    .from("bookings")
    .select(
      "id, booking_date, start_time, end_time, status, reason, profiles!bookings_trainer_id_fkey(first_name, last_name)",
    )
    .eq("learner_id", user!.id)
    .order("booking_date", { ascending: true });

  return (
    <SpaceShell title="Espace apprenant">
      <div className="flex flex-col gap-6">
        <Link href="/apprenant" className="inline-block font-body text-sm text-accent-text hover:underline">
          ← Retour à mon espace
        </Link>

        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Réserver un rendez-vous</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {success && <p className="font-body text-sm text-success">Rendez-vous confirmé.</p>}
            {error === "pris" && (
              <p className="font-body text-sm text-error">
                Ce créneau vient d&apos;être réservé par quelqu&apos;un d&apos;autre. Choisissez-en un autre.
              </p>
            )}
            {error === "erreur" && (
              <p className="font-body text-sm text-error">Impossible de réserver ce créneau.</p>
            )}
            {error === "motif" && (
              <p className="font-body text-sm text-error">
                Indiquez le motif du rendez-vous avant de confirmer.
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {trainers.length === 0 ? (
                <p className="font-body text-sm text-foreground-muted">Aucun formateur disponible.</p>
              ) : (
                trainers.map((t) => (
                  <Link
                    key={t.id}
                    href={`/apprenant/reservations?formateur=${t.id}`}
                    className={`inline-flex h-9 items-center gap-2 rounded-full border px-3 font-body text-sm ${
                      selectedTrainer?.id === t.id
                        ? "border-primary bg-primary text-on-primary"
                        : "border-border text-foreground hover:bg-surface-elevated"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full font-mono-label text-[10px] ${
                        selectedTrainer?.id === t.id ? "bg-on-primary/20" : "bg-accent/20 text-accent-text"
                      }`}
                    >
                      {t.first_name?.[0]}
                      {t.last_name?.[0]}
                    </span>
                    {t.first_name} {t.last_name}
                  </Link>
                ))
              )}
            </div>

            {selectedTrainer && (
              <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4">
                {/* Date strip — style agenda */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {calendarDays.map((d) => {
                    const isSelected = d.key === selectedDate;
                    return (
                      <Link
                        key={d.key}
                        href={
                          d.hasSlots
                            ? `/apprenant/reservations?formateur=${selectedTrainer.id}&date=${d.key}`
                            : "#"
                        }
                        aria-disabled={!d.hasSlots}
                        className={`flex w-14 shrink-0 flex-col items-center gap-0.5 rounded-lg border py-2 font-body transition-colors ${
                          !d.hasSlots
                            ? "cursor-default border-transparent text-foreground-muted/40"
                            : isSelected
                              ? "border-accent bg-accent text-on-accent"
                              : "border-border bg-surface-elevated text-foreground hover:border-accent/50"
                        }`}
                      >
                        <span className="font-mono-label text-[10px] uppercase tracking-wide">
                          {WEEKDAY_SHORT[toMondayIndex(d.date)]}
                        </span>
                        <span className="text-lg font-semibold leading-none">{d.date.getDate()}</span>
                        <span className="font-mono-label text-[9px] uppercase opacity-80">
                          {MONTH_SHORT[d.date.getMonth()]}
                        </span>
                      </Link>
                    );
                  })}
                </div>

                {/* Slots for the selected day */}
                {!selectedDate ? (
                  <p className="font-body text-sm text-foreground-muted">
                    Aucun créneau disponible dans les {DAYS_AHEAD} prochains jours.
                  </p>
                ) : (
                  <div className="flex flex-col gap-4 border-t border-border pt-4">
                    <p className="font-body text-sm font-semibold text-foreground">
                      {WEEKDAY_LABELS[toMondayIndex(new Date(selectedDate + "T00:00:00"))]}{" "}
                      {new Date(selectedDate + "T00:00:00").toLocaleDateString("fr-FR")}
                    </p>
                    {morningSlots.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <span className="font-mono-label text-[11px] uppercase tracking-wide text-foreground-muted">
                          Matin
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {morningSlots.map((slot) => (
                            <SlotLink
                              key={slot.start_time}
                              trainerId={selectedTrainer.id}
                              date={selectedDate}
                              slot={slot}
                              selected={selectedHeure === slot.start_time}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {afternoonSlots.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <span className="font-mono-label text-[11px] uppercase tracking-wide text-foreground-muted">
                          Après-midi
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {afternoonSlots.map((slot) => (
                            <SlotLink
                              key={slot.start_time}
                              trainerId={selectedTrainer.id}
                              date={selectedDate}
                              slot={slot}
                              selected={selectedHeure === slot.start_time}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedDate &&
                  selectedHeure &&
                  (() => {
                    const chosenSlot = daySlots.find((s) => s.start_time === selectedHeure);
                    if (!chosenSlot) {
                      return (
                        <p className="font-body text-sm text-error">
                          Ce créneau n&apos;est plus disponible, choisissez-en un autre ci-dessus.
                        </p>
                      );
                    }
                    const chosenDateFr = new Date(selectedDate + "T00:00:00").toLocaleDateString("fr-FR");
                    return (
                      <form
                        action={createBookingAction}
                        className="flex flex-col gap-3 rounded-DEFAULT border border-accent bg-surface-elevated p-4"
                      >
                        <p className="font-body text-sm text-foreground">
                          Rendez-vous avec {selectedTrainer.first_name} {selectedTrainer.last_name} le{" "}
                          {chosenDateFr} à {chosenSlot.start_time}
                        </p>
                        <input type="hidden" name="trainer_id" value={selectedTrainer.id} />
                        <input type="hidden" name="booking_date" value={selectedDate} />
                        <input type="hidden" name="start_time" value={chosenSlot.start_time} />
                        <input type="hidden" name="end_time" value={chosenSlot.end_time} />
                        <Textarea
                          label="Motif du rendez-vous"
                          name="reason"
                          rows={2}
                          required
                          placeholder="Ex. point sur mon projet, difficulté sur le module 2…"
                          hint="Le formateur verra ce motif avant votre rendez-vous."
                        />
                        <div>
                          <Button type="submit" variant="primary" size="sm">
                            Confirmer la réservation
                          </Button>
                        </div>
                      </form>
                    );
                  })()}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Mes réservations</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {!myBookings || myBookings.length === 0 ? (
              <EmptyState icon={<IconCalendar />} title="Aucune réservation pour le moment." />
            ) : (
              myBookings.map((booking) => {
                const trainer = booking.profiles;
                return (
                  <div
                    key={booking.id}
                    className="flex flex-col gap-2 rounded-DEFAULT border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-body text-sm font-semibold text-foreground">
                        {trainer ? `${trainer.first_name ?? ""} ${trainer.last_name ?? ""}`.trim() : "—"}
                      </p>
                      <p className="font-body text-xs text-foreground-muted">
                        {new Date(booking.booking_date).toLocaleDateString("fr-FR")} ·{" "}
                        {booking.start_time.slice(0, 5)} – {booking.end_time.slice(0, 5)}
                      </p>
                      {booking.reason && (
                        <p className="font-body text-xs text-foreground-muted">Motif : {booking.reason}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={BOOKING_STATUS_VARIANTS[booking.status] ?? "neutral"}>
                        {BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
                      </Badge>
                      {booking.status === "confirmee" && (
                        <form action={cancelBookingAction}>
                          <input type="hidden" name="id" value={booking.id} />
                          <Button type="submit" variant="ghost" size="sm">
                            Annuler
                          </Button>
                        </form>
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

function SlotLink({
  trainerId,
  date,
  slot,
  selected,
}: {
  trainerId: string;
  date: string;
  slot: { start_time: string; end_time: string };
  selected: boolean;
}) {
  return (
    <Link
      href={`/apprenant/reservations?formateur=${trainerId}&date=${date}&heure=${slot.start_time}`}
      className={`inline-flex h-9 items-center rounded-DEFAULT border px-3 font-body text-sm ${
        selected
          ? "border-accent bg-accent text-on-accent"
          : "border-border text-foreground hover:bg-surface-elevated"
      }`}
    >
      {slot.start_time}
    </Link>
  );
}
