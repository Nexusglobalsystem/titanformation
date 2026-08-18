"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createBookingAction(formData: FormData) {
  const trainerId = formData.get("trainer_id");
  const bookingDate = formData.get("booking_date");
  const startTime = formData.get("start_time");
  const endTime = formData.get("end_time");
  const reasonRaw = formData.get("reason");

  if (
    typeof trainerId !== "string" ||
    typeof bookingDate !== "string" ||
    typeof startTime !== "string" ||
    typeof endTime !== "string"
  ) {
    redirect(`/apprenant/reservations?error=invalide`);
  }

  const reason = typeof reasonRaw === "string" ? reasonRaw.trim() : "";
  if (!reason) {
    redirect(
      `/apprenant/reservations?formateur=${trainerId}&date=${bookingDate}&heure=${startTime}&error=motif`,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("bookings").insert({
    trainer_id: trainerId,
    learner_id: user!.id,
    booking_date: bookingDate,
    start_time: startTime,
    end_time: endTime,
    reason,
    status: "confirmee",
  });

  if (error) {
    const errorCode = error.code === "23505" ? "pris" : "erreur";
    redirect(`/apprenant/reservations?formateur=${trainerId}&error=${errorCode}`);
  }

  revalidatePath("/apprenant");
  redirect(`/apprenant/reservations?formateur=${trainerId}&success=1`);
}

export async function cancelBookingAction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const supabase = await createClient();
  await supabase.from("bookings").update({ status: "annulee" }).eq("id", id);
  revalidatePath("/apprenant");
  revalidatePath("/apprenant/reservations");
}
