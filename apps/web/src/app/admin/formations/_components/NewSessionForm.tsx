"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button, Input } from "@titan-kinetic/ui";
import { createSessionAction, type SessionFormState } from "../_actions/sessions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" loading={pending}>
      Ajouter la session
    </Button>
  );
}

export function NewSessionForm({ trainingId }: { trainingId: string }) {
  const [state, formAction] = useActionState<SessionFormState, FormData>(createSessionAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-DEFAULT border border-border p-4">
      <input type="hidden" name="trainingId" value={trainingId} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input label="Référence" name="reference" placeholder="FORM-2026-XXX" required />
        <Input label="Début" name="starts_on" type="date" required />
        <Input label="Fin" name="ends_on" type="date" required />
        <Input label="Places max" name="max_seats" type="number" min="1" defaultValue={12} />
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
