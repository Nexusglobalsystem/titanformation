"use server";

import { AccessToken } from "livekit-server-sdk";
import { createClient } from "@/lib/supabase/server";

const JOIN_WINDOW_MS = 15 * 60 * 1000;

export type JoinRoomResult =
  | { url: string; token: string; roomName: string; slotLabel: string; participantName: string }
  | { error: string };

// Nom de salle déterministe : dérivé du slotId, jamais persisté. Le webhook
// LiveKit retrouve le slot correspondant en retirant le préfixe "slot-".
function roomNameForSlot(slotId: string) {
  return `slot-${slotId}`;
}

export async function joinSlotRoomAction(slotId: string): Promise<JoinRoomResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Authentification requise." };

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.LIVEKIT_URL;
  if (!apiKey || !apiSecret || !wsUrl) {
    return { error: "Visioconférence non configurée (variables LiveKit manquantes)." };
  }

  // RLS ("creneaux visibles aux participants") ne renvoie ce créneau que si
  // l'utilisateur est le formateur affecté à la session ou un apprenant
  // inscrit et confirmé — aucune vérification manuelle supplémentaire requise.
  const { data: slot } = await supabase
    .from("session_slots")
    .select("id, starts_at, ends_at, slot_date, half_day, sessions(reference, trainings(title))")
    .eq("id", slotId)
    .maybeSingle();

  if (!slot) return { error: "Créneau introuvable ou accès non autorisé." };

  const now = Date.now();
  const startMs = new Date(slot.starts_at).getTime();
  const endMs = new Date(slot.ends_at).getTime();
  if (now < startMs - JOIN_WINDOW_MS) {
    return { error: "La salle ouvre 15 minutes avant le début du créneau." };
  }
  if (now > endMs + JOIN_WINDOW_MS) {
    return { error: "Ce créneau est terminé." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single();
  const name = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || "Participant";

  const roomName = roomNameForSlot(slot.id);

  const at = new AccessToken(apiKey, apiSecret, { identity: user.id, name });
  at.addGrant({ room: roomName, roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: true });
  const token = await at.toJwt();

  const trainingTitle = slot.sessions?.trainings?.title ?? "Formation";
  const halfDayLabel = slot.half_day === "matin" ? "matin" : "après-midi";
  const slotLabel = `${trainingTitle} — ${slot.slot_date} (${halfDayLabel})`;

  return { url: wsUrl, token, roomName, slotLabel, participantName: name };
}
