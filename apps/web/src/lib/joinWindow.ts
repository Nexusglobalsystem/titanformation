const JOIN_WINDOW_MS = 15 * 60 * 1000;

// Fenêtre de connexion ±15 min autour d'un créneau — même règle que
// joinSlotRoomAction (apps/web/src/app/_actions/livekit.ts), dupliquée ici
// uniquement pour l'affichage conditionnel du bouton "Rejoindre" (jamais pour
// l'autorisation elle-même, qui reste vérifiée côté serveur dans l'action).
export function canJoinSlot(startsAt: string, endsAt: string, now: number = Date.now()): boolean {
  return now >= new Date(startsAt).getTime() - JOIN_WINDOW_MS && now <= new Date(endsAt).getTime() + JOIN_WINDOW_MS;
}
