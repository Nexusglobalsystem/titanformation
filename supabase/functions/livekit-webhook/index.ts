import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { WebhookReceiver } from "npm:livekit-server-sdk@^2";

// Reçoit les événements LiveKit (participant_joined / participant_left) pour
// les salles "slot-<sessionSlotId>" et alimente attendances.livekit_joined_at /
// livekit_left_at / livekit_duration_s — la preuve technique de présence
// prévue au schéma d'origine (annexe A, section 8), jusqu'ici jamais câblée.
//
// Signature vérifiée via le secret API LiveKit (WebhookReceiver), pas un JWT
// Supabase : cette fonction doit être déployée avec verify_jwt=false, sinon
// la passerelle Supabase rejette la requête avant même d'atteindre ce code.
//
// Hors périmètre volontairement : egress_started/egress_ended (enregistrement)
// — nécessite un flux de consentement RGPD dédié, pas encore construit.

const ROOM_PREFIX = "slot-";

Deno.serve(async (req) => {
  const apiKey = Deno.env.get("LIVEKIT_API_KEY");
  const apiSecret = Deno.env.get("LIVEKIT_API_SECRET");
  if (!apiKey || !apiSecret) {
    return new Response("Configuration LiveKit manquante.", { status: 500 });
  }

  const body = await req.text();
  const authHeader = req.headers.get("Authorization") ?? undefined;

  const receiver = new WebhookReceiver(apiKey, apiSecret);
  let event;
  try {
    event = await receiver.receive(body, authHeader);
  } catch {
    return new Response("Signature invalide.", { status: 401 });
  }

  const roomName = event.room?.name ?? "";
  const identity = event.participant?.identity ?? "";
  if (!roomName.startsWith(ROOM_PREFIX) || !identity) {
    return new Response("ok");
  }
  const slotId = roomName.slice(ROOM_PREFIX.length);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Pas de ligne attendances pour le formateur (elle ne trace que la
  // présence apprenant) : aucune correspondance trouvée = no-op silencieux.
  const { data: attendances } = await admin
    .from("attendances")
    .select("id, livekit_joined_at, enrollments(learner_id)")
    .eq("slot_id", slotId);

  const row = (attendances ?? []).find(
    (a) => (a.enrollments as { learner_id: string } | null)?.learner_id === identity,
  );
  if (!row) return new Response("ok");

  if (event.event === "participant_joined" && !row.livekit_joined_at) {
    await admin
      .from("attendances")
      .update({ livekit_joined_at: new Date().toISOString() })
      .eq("id", row.id);
  }

  if (event.event === "participant_left") {
    const leftAt = new Date();
    const durationS = row.livekit_joined_at
      ? Math.max(0, Math.round((leftAt.getTime() - new Date(row.livekit_joined_at).getTime()) / 1000))
      : 0;
    await admin
      .from("attendances")
      .update({ livekit_left_at: leftAt.toISOString(), livekit_duration_s: durationS })
      .eq("id", row.id);
  }

  return new Response("ok");
});
