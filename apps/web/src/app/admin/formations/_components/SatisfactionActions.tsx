"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@titan-kinetic/ui";
import {
  createSatisfactionFormAction,
  recalculateSatisfactionAction,
  type CreateFormState,
  type RecalcState,
} from "../_actions/evaluations";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" loading={pending}>
      {label}
    </Button>
  );
}

export function CreateSatisfactionFormButton({ trainingId }: { trainingId: string }) {
  const [state, formAction] = useActionState<CreateFormState, FormData>(createSatisfactionFormAction, undefined);
  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="trainingId" value={trainingId} />
      <SubmitButton label="Créer le questionnaire de satisfaction" />
      {state?.error && <p className="font-body text-xs text-error">{state.error}</p>}
    </form>
  );
}

export function RecalculateSatisfactionButton({ trainingId }: { trainingId: string }) {
  const [state, formAction] = useActionState<RecalcState, FormData>(recalculateSatisfactionAction, undefined);
  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="trainingId" value={trainingId} />
      <SubmitButton label="Recalculer le taux de satisfaction" />
      {state?.error && <p className="font-body text-xs text-error">{state.error}</p>}
    </form>
  );
}
