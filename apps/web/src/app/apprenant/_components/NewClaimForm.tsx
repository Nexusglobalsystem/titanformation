"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button, Input, Textarea } from "@titan-kinetic/ui";
import { submitClaimAction, type SubmitClaimState } from "../_actions/claims";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" loading={pending}>
      Envoyer la réclamation
    </Button>
  );
}

export function NewClaimForm() {
  const [state, formAction] = useActionState<SubmitClaimState, FormData>(submitClaimAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Input label="Sujet" name="subject" required />
      <Textarea label="Description" name="body" rows={4} required />
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
