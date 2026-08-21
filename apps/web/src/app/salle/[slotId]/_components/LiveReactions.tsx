"use client";

import { useState } from "react";
import { useDataChannel, useLocalParticipant } from "@livekit/components-react";

const REACTION_EMOJIS = ["👍", "👏", "😂", "❤️"] as const;
const FLOAT_DURATION_MS = 2500;

type FloatingReaction = { id: string; emoji: string; name: string };
type ReactionPayload = { emoji: string; name: string };
type RaisedHandPayload = { identity: string; name: string; raised: boolean };

function encode(value: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(value));
}

function decode<T>(payload: Uint8Array): T | null {
  try {
    return JSON.parse(new TextDecoder().decode(payload)) as T;
  } catch {
    return null;
  }
}

// Réactions et main levée : événements éphémères diffusés en direct via le
// canal de données LiveKit — jamais stockés en base, aucun lien avec
// l'émargement (preuve de présence légale, qui reste inchangée). Deux
// topics séparés : "reactions" (ponctuel, disparaît après ~2,5s) et
// "raised-hands" (persiste jusqu'au geste inverse).
export function LiveReactions() {
  const { localParticipant } = useLocalParticipant();
  const [floating, setFloating] = useState<FloatingReaction[]>([]);
  const [raisedHands, setRaisedHands] = useState<Record<string, string>>({});
  const [handRaised, setHandRaised] = useState(false);

  const { send: sendReaction } = useDataChannel("reactions", (msg) => {
    const data = decode<ReactionPayload>(msg.payload);
    if (!data) return;
    const id = `${Date.now()}-${Math.random()}`;
    setFloating((prev) => [...prev, { id, emoji: data.emoji, name: data.name }]);
    setTimeout(() => setFloating((prev) => prev.filter((f) => f.id !== id)), FLOAT_DURATION_MS);
  });

  const { send: sendRaisedHand } = useDataChannel("raised-hands", (msg) => {
    const data = decode<RaisedHandPayload>(msg.payload);
    if (!data) return;
    setRaisedHands((prev) => {
      const next = { ...prev };
      if (data.raised) next[data.identity] = data.name;
      else delete next[data.identity];
      return next;
    });
  });

  function sendReactionEmoji(emoji: string) {
    const name = localParticipant.name || "Participant";
    void sendReaction(encode({ emoji, name } satisfies ReactionPayload), {});
    const id = `local-${Date.now()}`;
    setFloating((prev) => [...prev, { id, emoji, name }]);
    setTimeout(() => setFloating((prev) => prev.filter((f) => f.id !== id)), FLOAT_DURATION_MS);
  }

  function toggleHand() {
    const next = !handRaised;
    setHandRaised(next);
    void sendRaisedHand(
      encode({
        identity: localParticipant.identity,
        name: localParticipant.name || "Participant",
        raised: next,
      } satisfies RaisedHandPayload),
      {},
    );
  }

  const raisedNames = Object.values(raisedHands);

  return (
    <>
      {/* Animation flottante des réactions reçues — jamais un obstacle aux clics.
          Démarre au-dessus de la barre de réactions (bottom-36), qui elle-même
          reste au-dessus de la barre de contrôle native de VideoConference
          (bottom-20) : les trois ne doivent jamais se chevaucher. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-36 z-10 flex justify-center">
        <div className="relative h-0 w-full max-w-md">
          {floating.map((f, index) => (
            <span
              key={f.id}
              className="absolute bottom-0 left-1/2 animate-[float-up_2.5s_ease-out_forwards] text-3xl"
              style={{ marginLeft: (index % 5) * 12 - 24 }}
              title={f.name}
            >
              {f.emoji}
            </span>
          ))}
        </div>
      </div>

      {raisedNames.length > 0 && (
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-1 rounded-DEFAULT border border-border bg-surface/90 p-2 backdrop-blur">
          <span className="font-mono-label text-[10px] uppercase tracking-wide text-foreground-muted">
            Mains levées
          </span>
          {raisedNames.map((name) => (
            <span key={name} className="font-body text-xs text-foreground">
              ✋ {name}
            </span>
          ))}
        </div>
      )}

      <div className="absolute bottom-20 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-surface/90 p-1.5 backdrop-blur">
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => sendReactionEmoji(emoji)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg transition-colors hover:bg-surface-elevated"
            aria-label={`Réagir avec ${emoji}`}
          >
            {emoji}
          </button>
        ))}
        <button
          type="button"
          onClick={toggleHand}
          aria-pressed={handRaised}
          className={`flex h-8 w-8 items-center justify-center rounded-full text-lg transition-colors ${
            handRaised ? "bg-accent text-on-accent" : "hover:bg-surface-elevated"
          }`}
          aria-label="Lever la main"
        >
          ✋
        </button>
      </div>
    </>
  );
}
