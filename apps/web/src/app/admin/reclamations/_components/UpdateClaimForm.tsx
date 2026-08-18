"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@titan-kinetic/ui";
import { updateClaimAction, type UpdateClaimState } from "../_actions/claims";

const STATUS_LABELS: Record<string, string> = {
  ouverte: "Ouverte",
  en_cours: "En cours",
  resolue: "Résolue",
  refusee: "Refusée",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" loading={pending}>
      Mettre à jour
    </Button>
  );
}

export function UpdateClaimForm({
  claimId,
  currentStatus,
  currentResolution,
  currentCorrectiveAction,
}: {
  claimId: string;
  currentStatus: string;
  currentResolution: string | null;
  currentCorrectiveAction: string | null;
}) {
  const [state, formAction] = useActionState<UpdateClaimState, FormData>(updateClaimAction, undefined);
  const [status, setStatus] = useState(currentStatus);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-DEFAULT border border-dashed border-border p-3">
      <input type="hidden" name="claimId" value={claimId} />
      <input type="hidden" name="status" value={status} />
      <div className="flex flex-col gap-1.5 sm:max-w-xs">
        <label className="font-body text-sm font-medium text-foreground">Statut</label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Textarea
        label="Réponse à l'apprenant"
        name="resolution"
        rows={2}
        defaultValue={currentResolution ?? ""}
      />
      <Textarea
        label="Action corrective (indicateur 32)"
        name="corrective_action"
        rows={2}
        defaultValue={currentCorrectiveAction ?? ""}
        hint="Mesure prise pour éviter que le problème se reproduise."
      />
      {state?.error && (
        <p role="alert" className="font-body text-xs text-error">
          {state.error}
        </p>
      )}
      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
