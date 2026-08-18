"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AvailabilityFormState = { error?: string } | undefined;

export async function createAvailabilityAction(
  _prev: AvailabilityFormState,
  formData: FormData,
): Promise<AvailabilityFormState> {
  const weekday = Number(formData.get("weekday"));
  const startTime = formData.get("start_time");
  const endTime = formData.get("end_time");
  const slotDuration = Number(formData.get("slot_duration_minutes") ?? 30);

  if (
    !Number.isInteger(weekday) ||
    weekday < 0 ||
    weekday > 6 ||
    typeof startTime !== "string" ||
    !startTime ||
    typeof endTime !== "string" ||
    !endTime ||
    !Number.isFinite(slotDuration) ||
    slotDuration <= 0
  ) {
    return { error: "Formulaire invalide." };
  }
  if (endTime <= startTime) {
    return { error: "L'heure de fin doit être après l'heure de début." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("trainer_availabilities").insert({
    trainer_id: user!.id,
    weekday,
    start_time: startTime,
    end_time: endTime,
    slot_duration_minutes: slotDuration,
  });

  if (error) {
    return { error: "Impossible d'ajouter la disponibilité : " + error.message };
  }

  revalidatePath("/formateur");
}

export async function deleteAvailabilityAction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const supabase = await createClient();
  await supabase.from("trainer_availabilities").delete().eq("id", id);
  revalidatePath("/formateur");
}

export type ExceptionFormState = { error?: string } | undefined;

export async function createExceptionAction(
  _prev: ExceptionFormState,
  formData: FormData,
): Promise<ExceptionFormState> {
  const exceptionDate = formData.get("exception_date");
  const startTimeRaw = formData.get("start_time");
  const endTimeRaw = formData.get("end_time");
  const reasonRaw = formData.get("reason");

  if (typeof exceptionDate !== "string" || !exceptionDate) {
    return { error: "La date est requise." };
  }

  const startTime = typeof startTimeRaw === "string" && startTimeRaw ? startTimeRaw : null;
  const endTime = typeof endTimeRaw === "string" && endTimeRaw ? endTimeRaw : null;
  if ((startTime && !endTime) || (!startTime && endTime)) {
    return { error: "Renseignez les deux heures, ou aucune pour bloquer la journée entière." };
  }
  if (startTime && endTime && endTime <= startTime) {
    return { error: "L'heure de fin doit être après l'heure de début." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("availability_exceptions").insert({
    trainer_id: user!.id,
    exception_date: exceptionDate,
    start_time: startTime,
    end_time: endTime,
    reason: typeof reasonRaw === "string" && reasonRaw.trim() ? reasonRaw.trim() : null,
  });

  if (error) {
    return { error: "Impossible d'ajouter l'exception : " + error.message };
  }

  revalidatePath("/formateur");
}

export async function deleteExceptionAction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const supabase = await createClient();
  await supabase.from("availability_exceptions").delete().eq("id", id);
  revalidatePath("/formateur");
}

const BOOKING_STATUSES = ["terminee", "absent", "annulee"] as const;

export async function updateBookingStatusAction(formData: FormData) {
  const id = formData.get("id");
  const status = formData.get("status");
  if (
    typeof id !== "string" ||
    typeof status !== "string" ||
    !BOOKING_STATUSES.includes(status as (typeof BOOKING_STATUSES)[number])
  ) {
    return;
  }

  const supabase = await createClient();
  await supabase.from("bookings").update({ status }).eq("id", id);
  if (status === "annulee") {
    await supabase.rpc("notify_booking_event", { p_booking_id: id, p_kind: "cancelled" });
  }
  revalidatePath("/formateur");
}
