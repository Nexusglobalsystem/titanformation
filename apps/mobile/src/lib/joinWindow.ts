// Porté tel quel depuis apps/web/src/lib/joinWindow.ts — fonction pure,
// jamais spécifique à Next. Sert uniquement à décider si le badge
// "Disponible sur le web" doit s'afficher (LiveKit reste hors périmètre
// mobile v1, cf. plan) ; l'autorisation réelle reste vérifiée côté
// serveur, comme sur le web.
const JOIN_WINDOW_MS = 15 * 60 * 1000;

export function canJoinSlot(startsAt: string, endsAt: string, now: number = Date.now()): boolean {
  return now >= new Date(startsAt).getTime() - JOIN_WINDOW_MS && now <= new Date(endsAt).getTime() + JOIN_WINDOW_MS;
}
