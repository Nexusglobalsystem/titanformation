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
} from "@titan-kinetic/ui";
import { assignTrainerAction, type AssignTrainerState } from "../_actions/trainers";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="ghost" size="sm" loading={pending}>
      Affecter
    </Button>
  );
}

export function AssignTrainerForm({
  sessionId,
  trainingId,
  trainers,
}: {
  sessionId: string;
  trainingId: string;
  trainers: { id: string; first_name: string | null; last_name: string | null }[];
}) {
  const [state, formAction] = useActionState<AssignTrainerState, FormData>(assignTrainerAction, undefined);
  const [trainerId, setTrainerId] = useState<string>("");

  if (trainers.length === 0) return null;

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="trainingId" value={trainingId} />
      <input type="hidden" name="trainerId" value={trainerId} />
      <Select value={trainerId} onValueChange={setTrainerId}>
        <SelectTrigger className="h-8 w-48 text-xs" aria-label="Ajouter un formateur">
          <SelectValue placeholder="+ Ajouter un formateur" />
        </SelectTrigger>
        <SelectContent>
          {trainers.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.first_name} {t.last_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <SubmitButton />
      {state?.error && <p className="font-body text-xs text-error">{state.error}</p>}
    </form>
  );
}
