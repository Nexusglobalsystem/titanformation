"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@titan-kinetic/ui";
import { createSessionAction, type SessionFormState } from "../_actions/sessions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" loading={pending}>
      Ajouter la session
    </Button>
  );
}

export function NewSessionForm({
  trainingId,
  trainers,
}: {
  trainingId: string;
  trainers: { id: string; first_name: string | null; last_name: string | null }[];
}) {
  const [state, formAction] = useActionState<SessionFormState, FormData>(createSessionAction, undefined);
  const [trainerId, setTrainerId] = useState<string>("aucun");

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-DEFAULT border border-border p-4">
      <input type="hidden" name="trainingId" value={trainingId} />
      <input type="hidden" name="trainerId" value={trainerId === "aucun" ? "" : trainerId} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Input label="Référence" name="reference" placeholder="FORM-2026-XXX" required />
        <Input label="Début" name="starts_on" type="date" required />
        <Input label="Fin" name="ends_on" type="date" required />
        <Input label="Places max" name="max_seats" type="number" min="1" defaultValue={12} />
        <div className="flex flex-col gap-1.5">
          <label className="font-body text-sm font-medium text-foreground">Formateur</label>
          <Select value={trainerId} onValueChange={setTrainerId}>
            <SelectTrigger aria-label="Formateur">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aucun">À affecter plus tard</SelectItem>
              {trainers.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.first_name} {t.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
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
