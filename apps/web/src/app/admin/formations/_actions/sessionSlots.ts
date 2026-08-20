"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SessionSlotFormState = { error?: string; warning?: string } | undefined;

const HALF_DAY_TIMES: Record<string, { starts: string; ends: string }> = {
  matin: { starts: "07:00:00Z", ends: "10:30:00Z" },
  apres_midi: { starts: "12:00:00Z", ends: "15:30:00Z" },
};

export async function createSessionSlotAction(
  _prev: SessionSlotFormState,
  formData: FormData,
): Promise<SessionSlotFormState> {
  const sessionId = formData.get("sessionId");
  const trainingId = formData.get("trainingId");
  const slotDate = formData.get("slot_date");
  const halfDay = formData.get("half_day");
  const modality = formData.get("modality");

  if (
    typeof sessionId !== "string" ||
    typeof trainingId !== "string" ||
    typeof slotDate !== "string" ||
    !slotDate ||
    typeof halfDay !== "string" ||
    !HALF_DAY_TIMES[halfDay] ||
    typeof modality !== "string"
  ) {
    return { error: "Formulaire invalide." };
  }

  const times = HALF_DAY_TIMES[halfDay];
  const supabase = await createClient();

  const { data: newSlot, error } = await supabase
    .from("session_slots")
    .insert({
      session_id: sessionId,
      slot_date: slotDate,
      half_day: halfDay,
      starts_at: `${slotDate}T${times.starts}`,
      ends_at: `${slotDate}T${times.ends}`,
      modality: modality as "presentiel" | "livekit" | "autoapprentissage" | "evaluation" | "certification",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Un créneau existe déjà pour cette date et cette demi-journée." };
    }
    return { error: "Impossible de créer le créneau : " + error.message };
  }

  // Le trigger trg_create_attendance_rows ne crée les lignes d'émargement qu'à
  // la confirmation d'une inscription, pas quand un créneau est ajouté après
  // coup à une session qui a déjà des inscrits confirmés — un cas qui devient
  // possible pour la première fois avec ce formulaire (avant, les créneaux
  // n'existaient qu'au seed). On comble le sens inverse ici, additif
  // seulement : jamais de modification des lignes déjà existantes.
  const { data: confirmedEnrollments } = await supabase
    .from("enrollments")
    .select("id")
    .eq("session_id", sessionId)
    .eq("status", "confirme");
  if (confirmedEnrollments && confirmedEnrollments.length > 0) {
    await supabase
      .from("attendances")
      .insert(confirmedEnrollments.map((e) => ({ slot_id: newSlot.id, enrollment_id: e.id })));
  }

  // Conflit au jour près, informatif seulement (même granularité que
  // /admin/planification) : un formateur déjà affecté à cette session a-t-il
  // un autre créneau le même jour sur une session différente ?
  let warning: string | undefined;
  const { data: trainerRows } = await supabase
    .from("session_trainers")
    .select("trainer_id")
    .eq("session_id", sessionId);
  const trainerIds = (trainerRows ?? []).map((t) => t.trainer_id);

  if (trainerIds.length > 0) {
    const { data: otherAssignments } = await supabase
      .from("session_trainers")
      .select("session_id")
      .in("trainer_id", trainerIds)
      .neq("session_id", sessionId);
    const otherSessionIds = Array.from(new Set((otherAssignments ?? []).map((a) => a.session_id)));

    if (otherSessionIds.length > 0) {
      const { data: conflicting } = await supabase
        .from("session_slots")
        .select("sessions(reference)")
        .in("session_id", otherSessionIds)
        .eq("slot_date", slotDate);
      if (conflicting && conflicting.length > 0) {
        const refs = Array.from(new Set(conflicting.map((c) => c.sessions?.reference).filter(Boolean)));
        warning = `Créneau créé. Conflit possible : un formateur de cette session est déjà affecté le ${new Date(
          slotDate + "T00:00:00",
        ).toLocaleDateString("fr-FR")} sur ${refs.join(", ")}.`;
      }
    }
  }

  revalidatePath(`/admin/formations/${trainingId}`);
  revalidatePath("/admin/formations/nouvelle");
  return warning ? { warning } : undefined;
}

export async function deleteSessionSlotAction(formData: FormData): Promise<void> {
  const slotId = formData.get("slotId");
  const trainingId = formData.get("trainingId");
  if (typeof slotId !== "string" || typeof trainingId !== "string") return;

  const supabase = await createClient();
  await supabase.from("session_slots").delete().eq("id", slotId);
  revalidatePath(`/admin/formations/${trainingId}`);
  revalidatePath("/admin/formations/nouvelle");
}
