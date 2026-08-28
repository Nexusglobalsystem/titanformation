import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { evaluateModuleUnlock, type ModuleUnlockInfo } from "../../lib/moduleUnlock";

const HALF_DAY_TIME: Record<string, string> = { matin: "08:00", apres_midi: "13:00" };

export type SlotEntry = {
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

export type BookingEntry = {
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

export interface ModuleSection {
  enrollmentId: string;
  trainingTitle: string;
  modules: { id: string; title: string; position: number }[];
  unlockMap: Map<string, ModuleUnlockInfo>;
}

// Équivalent RN de apps/web/src/app/apprenant/agenda/page.tsx — deux
// systèmes indépendants (créneaux collectifs vs rendez-vous 1:1) fusionnés
// seulement à l'affichage, jamais en base. "Mes modules" : uniquement les
// formations à déverrouillage progressif (sequential_unlock), même filtre
// que le web.
export function useAgenda(userId: string | undefined) {
  return useQuery({
    queryKey: ["agenda", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const [{ data: slotsRaw }, { data: bookingsRaw }, { data: enrollmentsRaw }] = await Promise.all([
        supabase
          .from("session_slots")
          .select("id, slot_date, half_day, starts_at, ends_at, modality, sessions(reference, trainings(title))")
          .order("slot_date", { ascending: true }),
        supabase
          .from("bookings")
          .select(
            "id, booking_date, start_time, end_time, status, reason, profiles!bookings_trainer_id_fkey(first_name, last_name)",
          )
          .eq("learner_id", userId!)
          .in("status", ["demandee", "confirmee"])
          .order("booking_date", { ascending: true }),
        supabase
          .from("enrollments")
          .select("id, sessions(trainings(id, title, sequential_unlock))")
          .eq("learner_id", userId!)
          .in("status", ["confirme", "termine"]),
      ]);

      const entries: (SlotEntry | BookingEntry)[] = [
        ...(slotsRaw ?? []).map(
          (slot): SlotEntry => ({
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
          }),
        ),
        ...(bookingsRaw ?? []).map(
          (booking): BookingEntry => ({
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
          }),
        ),
      ].sort((a, b) => (a.dateKey === b.dateKey ? a.sortKey.localeCompare(b.sortKey) : a.dateKey.localeCompare(b.dateKey)));

      const entriesByDate = new Map<string, (SlotEntry | BookingEntry)[]>();
      for (const entry of entries) {
        if (!entriesByDate.has(entry.dateKey)) entriesByDate.set(entry.dateKey, []);
        entriesByDate.get(entry.dateKey)!.push(entry);
      }
      const orderedDates = Array.from(entriesByDate.keys()).sort();

      const sequentialEnrollments = (enrollmentsRaw ?? [])
        .map((e) => ({ enrollmentId: e.id, training: e.sessions?.trainings }))
        .filter(
          (e): e is { enrollmentId: string; training: NonNullable<typeof e.training> } =>
            Boolean(e.training?.sequential_unlock),
        );

      const moduleSections: ModuleSection[] = await Promise.all(
        sequentialEnrollments.map(async ({ enrollmentId, training }) => {
          const [unlockMap, { data: modules }] = await Promise.all([
            evaluateModuleUnlock(supabase, enrollmentId, training.id),
            supabase
              .from("modules")
              .select("id, title, position")
              .eq("training_id", training.id)
              .order("position", { ascending: true }),
          ]);
          return { enrollmentId, trainingTitle: training.title, modules: modules ?? [], unlockMap };
        }),
      );

      return { entriesByDate, orderedDates, moduleSections };
    },
  });
}

// Équivalent RN de cancelBookingAction.
export function useCancelBooking(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: string) => {
      await supabase.from("bookings").update({ status: "annulee" }).eq("id", bookingId);
      await supabase.rpc("notify_booking_event", { p_booking_id: bookingId, p_kind: "cancelled" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agenda", userId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", userId] });
    },
  });
}
