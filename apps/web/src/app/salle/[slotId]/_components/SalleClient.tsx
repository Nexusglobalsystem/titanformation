"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LiveKitRoom, PreJoin, VideoConference, type LocalUserChoices } from "@livekit/components-react";
import "@livekit/components-styles";
import { joinSlotRoomAction, type JoinRoomResult } from "@/app/_actions/livekit";
import { BackgroundBlurToggle } from "./BackgroundBlurToggle";
import { LiveReactions } from "./LiveReactions";

export function SalleClient({ slotId }: { slotId: string }) {
  const router = useRouter();
  const [result, setResult] = useState<JoinRoomResult | null>(null);
  const [choices, setChoices] = useState<LocalUserChoices | null>(null);

  useEffect(() => {
    let cancelled = false;
    joinSlotRoomAction(slotId).then((r) => {
      if (!cancelled) setResult(r);
    });
    return () => {
      cancelled = true;
    };
  }, [slotId]);

  if (!result) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="font-body text-sm text-foreground-muted">Connexion à la salle…</p>
      </div>
    );
  }

  if ("error" in result) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="font-body text-sm text-error">{result.error}</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="font-body text-sm text-accent-text hover:underline"
        >
          Retour
        </button>
      </div>
    );
  }

  if (!choices) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="border-b border-border px-4 py-3">
          <p className="font-body text-sm text-foreground-muted">{result.slotLabel}</p>
        </div>
        <div className="flex flex-1 items-center justify-center p-4" data-lk-theme="default">
          <PreJoin
            joinLabel="Rejoindre la classe"
            micLabel="Microphone"
            camLabel="Caméra"
            userLabel="Nom affiché"
            defaults={{ username: result.participantName }}
            onSubmit={setChoices}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-border px-4 py-3">
        <p className="font-body text-sm text-foreground-muted">{result.slotLabel}</p>
      </div>
      <div className="relative flex-1" data-lk-theme="default">
        <LiveKitRoom
          serverUrl={result.url}
          token={result.token}
          connect
          audio={choices.audioEnabled ? { deviceId: choices.audioDeviceId } : false}
          video={choices.videoEnabled ? { deviceId: choices.videoDeviceId } : false}
          onDisconnected={() => router.back()}
          className="h-full"
        >
          <VideoConference />
          <BackgroundBlurToggle />
          <LiveReactions />
        </LiveKitRoom>
      </div>
    </div>
  );
}
