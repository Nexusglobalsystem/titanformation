"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button, Input } from "@titan-kinetic/ui";
import { createQuizAction, type QuizFormState } from "../_actions/quiz";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" loading={pending}>
      Créer le QCM
    </Button>
  );
}

export function QuizSettingsForm({ lessonId, trainingId }: { lessonId: string; trainingId: string }) {
  const [state, formAction] = useActionState<QuizFormState, FormData>(createQuizAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="lessonId" value={lessonId} />
      <input type="hidden" name="trainingId" value={trainingId} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input
          label="Seuil de réussite (%)"
          name="pass_threshold"
          type="number"
          min="0"
          max="100"
          defaultValue={70}
        />
        <Input
          label="Tentatives max"
          name="max_attempts"
          type="number"
          min="1"
          placeholder="Illimité"
        />
        <Input
          label="Durée limite (min)"
          name="time_limit_minutes"
          type="number"
          min="1"
          placeholder="Aucune"
        />
      </div>
      <label className="flex items-center gap-2 font-body text-sm text-foreground">
        <input type="checkbox" name="shuffle_questions" defaultChecked className="h-4 w-4" />
        Mélanger l'ordre des questions à chaque tentative
      </label>
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
