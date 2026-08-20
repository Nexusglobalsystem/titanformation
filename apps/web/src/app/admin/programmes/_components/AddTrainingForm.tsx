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
import { addTrainingToProgrammeAction, type AddTrainingState } from "../_actions/programmes";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="ghost" size="sm" loading={pending}>
      Ajouter
    </Button>
  );
}

export function AddTrainingForm({
  programmeId,
  availableTrainings,
}: {
  programmeId: string;
  availableTrainings: { id: string; title: string }[];
}) {
  const [state, formAction] = useActionState<AddTrainingState, FormData>(addTrainingToProgrammeAction, undefined);
  const [trainingId, setTrainingId] = useState<string>("");

  if (availableTrainings.length === 0) {
    return <p className="font-body text-xs text-foreground-muted">Toutes les formations sont déjà dans ce programme.</p>;
  }

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="programmeId" value={programmeId} />
      <input type="hidden" name="trainingId" value={trainingId} />
      <Select value={trainingId} onValueChange={setTrainingId}>
        <SelectTrigger className="h-8 w-64 text-xs">
          <SelectValue placeholder="+ Ajouter une formation" />
        </SelectTrigger>
        <SelectContent>
          {availableTrainings.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <SubmitButton />
      {state?.error && <p className="font-body text-xs text-error">{state.error}</p>}
    </form>
  );
}
