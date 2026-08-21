"use client";

import { useState } from "react";
import { useLocalParticipant } from "@livekit/components-react";
import { LocalVideoTrack } from "livekit-client";
import { BackgroundBlur } from "@livekit/track-processors";

// Superposition non-invasive au-dessus de <VideoConference /> — on ne
// touche jamais à son balisage interne. Le flou est un TrackProcessor posé
// directement sur la piste caméra locale (segmentation WASM temps réel,
// coûteuse en CPU sur un poste ancien, mais géré nativement par LiveKit).
export function BackgroundBlurToggle() {
  const { cameraTrack, isCameraEnabled } = useLocalParticipant();
  const [blurred, setBlurred] = useState(false);
  const [pending, setPending] = useState(false);

  async function toggle() {
    const track = cameraTrack?.track;
    if (!(track instanceof LocalVideoTrack)) return;

    setPending(true);
    try {
      if (blurred) {
        await track.stopProcessor();
        setBlurred(false);
      } else {
        await track.setProcessor(BackgroundBlur(10));
        setBlurred(true);
      }
    } catch {
      // Navigateur non supporté ou échec du traitement : on n'affiche pas
      // le flou comme actif si l'application a échoué.
      setBlurred(false);
    } finally {
      setPending(false);
    }
  }

  if (!isCameraEnabled) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={`absolute right-3 top-3 z-10 rounded-full border px-3 py-1.5 font-body text-xs font-medium backdrop-blur transition-colors disabled:opacity-50 ${
        blurred
          ? "border-accent bg-accent text-on-accent"
          : "border-border bg-surface/80 text-foreground hover:bg-surface-elevated"
      }`}
    >
      {blurred ? "Flou activé" : "Flouter l'arrière-plan"}
    </button>
  );
}
