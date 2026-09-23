import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { DAYS_AHEAD, computeAvailableSlots, formatDateKey } from "./computeAvailableSlots";

export function useTrainers() {
  return useQuery({
    queryKey: ["trainers"],
    queryFn: async () => {
      const { data: formateurIds } = await supabase.rpc("formateur_ids");
      if (!formateurIds || formateurIds.length === 0) return [];
      const { data } = await supabase.from("profiles").select("id, first_name, last_name").in("id", formateurIds);
      return data ?? [];
    },
  });
}

// Équivalent RN du calcul serveur de apps/web/.../reservations/page.tsx —
// mêmes 3 requêtes (disponibilités récurrentes, exceptions, rpc taken_slots
// pour les créneaux déjà pris tous apprenants confondus) puis
// computeAvailableSlots (fonction pure, portée telle quelle).
export function useTrainerAvailability(trainerId: string | undefined) {
  return useQuery({
    queryKey: ["trainer-availability", trainerId],
    enabled: Boolean(trainerId),
    queryFn: async () => {
      const today = new Date();
      const from = formatDateKey(today);
      const toDateObj = new Date(today);
      toDateObj.setDate(toDateObj.getDate() + DAYS_AHEAD - 1);
      const to = formatDateKey(toDateObj);

      const [{ data: availabilities }, { data: exceptions }, { data: taken }] = await Promise.all([
        supabase
          .from("trainer_availabilities")
          .select("weekday, start_time, end_time, slot_duration_minutes")
          .eq("trainer_id", trainerId!),
        supabase
          .from("availability_exceptions")
          .select("exception_date, start_time, end_time")
          .eq("trainer_id", trainerId!)
          .gte("exception_date", from)
          .lte("exception_date", to),
        supabase.rpc("taken_slots", { p_trainer_id: trainerId!, p_from: from, p_to: to }),
      ]);

      const takenSet = new Set((taken ?? []).map((t) => `${t.booking_date}T${t.start_time.slice(0, 5)}`));

      return computeAvailableSlots({
        availabilities: availabilities ?? [],
        exceptions: exceptions ?? [],
        takenSet,
      });
    },
  });
}

export function useMyBookings(userId: string | undefined) {
  return useQuery({
    queryKey: ["my-bookings", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data } = await supabase
        .from("bookings")
        .select(
          "id, booking_date, start_time, end_time, status, reason, profiles!bookings_trainer_id_fkey(first_name, last_name)",
        )
        .eq("learner_id", userId!)
        .order("booking_date", { ascending: true });
      return data ?? [];
    },
  });
}

// Équivalent RN de createBookingAction — même statut "confirmee" à la
// création (pas de validation formateur intermédiaire côté web non plus),
// même code de conflit 23505 (créneau pris entre-temps par un autre
// apprenant) distingué d'une erreur générique.
export function useCreateBooking(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      trainerId: string;
      bookingDate: string;
      startTime: string;
      endTime: string;
      reason: string;
    }) => {
      const { data: booking, error } = await supabase
        .from("bookings")
        .insert({
          trainer_id: input.trainerId,
          learner_id: userId!,
          booking_date: input.bookingDate,
          start_time: input.startTime,
          end_time: input.endTime,
          reason: input.reason,
          status: "confirmee",
        })
        .select("id")
        .single();

      if (error) {
        throw new Error(
          error.code === "23505"
            ? "Ce créneau vient d'être réservé par quelqu'un d'autre. Choisis-en un autre."
            : "Impossible de réserver ce créneau.",
        );
      }

      await supabase.rpc("notify_booking_event", { p_booking_id: booking.id, p_kind: "created" });
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: ["my-bookings", userId] });
      queryClient.invalidateQueries({ queryKey: ["trainer-availability", input.trainerId] });
      queryClient.invalidateQueries({ queryKey: ["agenda", userId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", userId] });
    },
  });
}
