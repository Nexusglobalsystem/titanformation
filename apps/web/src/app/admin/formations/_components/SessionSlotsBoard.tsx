"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Badge,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@titan-kinetic/ui";
import { createSessionSlotAction, deleteSessionSlotAction, type SessionSlotFormState } from "../_actions/sessionSlots";

const HALF_DAY_LABELS: Record<string, string> = { matin: "Matin", apres_midi: "Après-midi" };
const HALF_DAY_ORDER: Record<string, number> = { matin: 0, apres_midi: 1 };

const MODALITY_LABELS: Record<string, string> = {
  presentiel: "Présentiel",
  livekit: "Classe virtuelle",
  autoapprentissage: "Auto-apprentissage",
  evaluation: "Évaluation",
  certification: "Certification",
};

const MODALITY_VARIANTS: Record<string, "neutral" | "success" | "warning" | "featured"> = {
  presentiel: "neutral",
  livekit: "featured",
  autoapprentissage: "success",
  evaluation: "warning",
  certification: "warning",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" loading={pending}>
      Ajouter le créneau
    </Button>
  );
}

type Slot = { id: string; slot_date: string; half_day: string; modality: string };

export function SessionSlotsBoard({
  sessionId,
  trainingId,
  slots,
}: {
  sessionId: string;
  trainingId: string;
  slots: Slot[];
}) {
  const [state, formAction] = useActionState<SessionSlotFormState, FormData>(createSessionSlotAction, undefined);
  const [halfDay, setHalfDay] = useState("matin");
  const [modality, setModality] = useState("presentiel");

  const sorted = [...slots].sort((a, b) => {
    const dateDiff = a.slot_date.localeCompare(b.slot_date);
    if (dateDiff !== 0) return dateDiff;
    return (HALF_DAY_ORDER[a.half_day] ?? 0) - (HALF_DAY_ORDER[b.half_day] ?? 0);
  });

  return (
    <div className="flex flex-col gap-3 rounded-DEFAULT border border-border bg-surface p-3">
      <p className="font-mono-label text-xs font-semibold uppercase tracking-wide text-foreground-muted">
        Créneaux
      </p>
      {sorted.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {sorted.map((slot) => (
            <div
              key={slot.id}
              className="flex items-center justify-between gap-2 rounded-DEFAULT border border-border bg-surface-elevated px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="font-body text-sm text-foreground">
                  {new Date(slot.slot_date + "T00:00:00").toLocaleDateString("fr-FR")} ·{" "}
                  {HALF_DAY_LABELS[slot.half_day] ?? slot.half_day}
                </span>
                <Badge variant={MODALITY_VARIANTS[slot.modality] ?? "neutral"}>
                  {MODALITY_LABELS[slot.modality] ?? slot.modality}
                </Badge>
              </div>
              <form action={deleteSessionSlotAction}>
                <input type="hidden" name="slotId" value={slot.id} />
                <input type="hidden" name="trainingId" value={trainingId} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 rounded-full p-0 text-xs"
                  aria-label="Supprimer ce créneau"
                >
                  ×
                </Button>
              </form>
            </div>
          ))}
        </div>
      )}

      <form action={formAction} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="sessionId" value={sessionId} />
        <input type="hidden" name="trainingId" value={trainingId} />
        <input type="hidden" name="half_day" value={halfDay} />
        <input type="hidden" name="modality" value={modality} />
        <div className="w-40">
          <Input label="Date" name="slot_date" type="date" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-body text-sm font-medium text-foreground">Demi-journée</label>
          <Select value={halfDay} onValueChange={setHalfDay}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="matin">Matin</SelectItem>
              <SelectItem value="apres_midi">Après-midi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-body text-sm font-medium text-foreground">Modalité</label>
          <Select value={modality} onValueChange={setModality}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(MODALITY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <SubmitButton />
      </form>
      {state?.error && (
        <p role="alert" className="font-body text-xs text-error">
          {state.error}
        </p>
      )}
      {state?.warning && <p className="font-body text-xs text-warning">{state.warning}</p>}
    </div>
  );
}
