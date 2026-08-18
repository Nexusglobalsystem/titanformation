"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SessionFormState = { error?: string } | undefined;

export async function createSessionAction(
  _prev: SessionFormState,
  formData: FormData,
): Promise<SessionFormState> {
  const trainingId = formData.get("trainingId");
  const reference = formData.get("reference");
  const startsOn = formData.get("starts_on");
  const endsOn = formData.get("ends_on");
  const minSeats = Number(formData.get("min_seats") ?? 1);
  const maxSeats = Number(formData.get("max_seats") ?? 12);

  if (
    typeof trainingId !== "string" ||
    typeof reference !== "string" ||
    !reference.trim() ||
    typeof startsOn !== "string" ||
    !startsOn ||
    typeof endsOn !== "string" ||
    !endsOn
  ) {
    return { error: "Formulaire invalide." };
  }

  if (endsOn < startsOn) {
    return { error: "La date de fin doit être postérieure ou égale à la date de début." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("sessions").insert({
    training_id: trainingId,
    reference,
    status: "ouverte",
    starts_on: startsOn,
    ends_on: endsOn,
    min_seats: minSeats,
    max_seats: maxSeats,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Cette référence de session est déjà utilisée." };
    }
    return { error: "Impossible de créer la session : " + error.message };
  }

  revalidatePath(`/admin/formations/${trainingId}`);
}
