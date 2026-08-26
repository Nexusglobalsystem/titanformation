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
  Textarea,
} from "@titan-kinetic/ui";
import { requestQuoteAction, type QuoteFormState } from "../_actions/quotes";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" loading={pending}>
      Envoyer la demande
    </Button>
  );
}

export function RequestQuoteForm({ trainings }: { trainings: { id: string; title: string }[] }) {
  const [state, formAction] = useActionState<QuoteFormState, FormData>(requestQuoteAction, undefined);
  const [trainingId, setTrainingId] = useState(trainings[0]?.id ?? "");

  if (trainings.length === 0) {
    return <p className="font-body text-sm text-foreground-muted">Aucune formation publiée pour le moment.</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="font-body text-sm font-medium text-foreground">Formation</label>
        <Select value={trainingId} onValueChange={setTrainingId}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {trainings.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="trainingId" value={trainingId} />
      </div>
      <Input label="Nombre de participants" name="quantity" type="number" min={1} defaultValue={1} required />
      <Textarea label="Message (facultatif)" name="message" placeholder="Contexte, dates souhaitées..." />
      {state?.error && (
        <p role="alert" className="rounded-DEFAULT bg-error-bg px-3 py-2 font-body text-sm text-error">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p role="status" className="rounded-DEFAULT bg-success-bg px-3 py-2 font-body text-sm text-success">
          {state.success}
        </p>
      )}
      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
