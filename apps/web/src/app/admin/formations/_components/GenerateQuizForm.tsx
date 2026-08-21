"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button, Input } from "@titan-kinetic/ui";
import { generateQuizQuestionsAction, type GenerateQuizState } from "../_actions/quizAI";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="accent" size="sm" loading={pending}>
      Générer avec l&apos;IA
    </Button>
  );
}

export function GenerateQuizForm({
  quizId,
  lessonId,
  trainingId,
  nextPosition,
}: {
  quizId: string;
  lessonId: string;
  trainingId: string;
  nextPosition: number;
}) {
  const [state, formAction] = useActionState<GenerateQuizState, FormData>(generateQuizQuestionsAction, undefined);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-DEFAULT border border-dashed border-accent/40 bg-accent/5 p-3"
    >
      <input type="hidden" name="quizId" value={quizId} />
      <input type="hidden" name="lessonId" value={lessonId} />
      <input type="hidden" name="trainingId" value={trainingId} />
      <input type="hidden" name="nextPosition" value={nextPosition} />
      <p className="font-body text-xs font-semibold uppercase tracking-wide text-accent-text">
        Génération IA
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input label="Nombre de questions" name="count" type="number" min={1} max={10} defaultValue={5} />
        <div className="sm:col-span-2">
          <Input
            label="Sujet (facultatif)"
            name="topic"
            placeholder="Par défaut : contenu de la formation"
          />
        </div>
      </div>
      {state?.error && (
        <p role="alert" className="font-body text-xs text-error">
          {state.error}
        </p>
      )}
      {state?.success && <p className="font-body text-xs text-success">{state.success}</p>}
      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
