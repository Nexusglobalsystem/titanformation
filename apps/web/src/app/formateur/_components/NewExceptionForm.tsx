"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button, Input } from "@titan-kinetic/ui";
import { createExceptionAction, type ExceptionFormState } from "../_actions/availability";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" loading={pending}>
      Bloquer
    </Button>
  );
}

export function NewExceptionForm() {
  const [state, formAction] = useActionState<ExceptionFormState, FormData>(createExceptionAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-DEFAULT border border-dashed border-border p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
        <Input label="Date" name="exception_date" type="date" required />
        <Input label="Début (optionnel)" name="start_time" type="time" hint="Vide = journée entière" />
        <Input label="Fin (optionnel)" name="end_time" type="time" />
        <Input label="Motif" name="reason" placeholder="Congés, indisponibilité…" />
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
