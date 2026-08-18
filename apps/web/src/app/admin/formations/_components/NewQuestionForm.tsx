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
import { createQuestionAction, type QuestionFormState } from "../_actions/quiz";

const KIND_LABELS: Record<string, string> = {
  qcu: "Une seule bonne réponse",
  qcm: "Plusieurs bonnes réponses",
  vrai_faux: "Vrai ou faux",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" loading={pending}>
      Ajouter la question
    </Button>
  );
}

export function NewQuestionForm({
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
  const [state, formAction] = useActionState<QuestionFormState, FormData>(createQuestionAction, undefined);
  const [kind, setKind] = useState<string>("qcu");

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-DEFAULT border border-dashed border-border p-4">
      <input type="hidden" name="quizId" value={quizId} />
      <input type="hidden" name="lessonId" value={lessonId} />
      <input type="hidden" name="trainingId" value={trainingId} />
      <input type="hidden" name="position" value={nextPosition} />
      <input type="hidden" name="kind" value={kind} />

      <Textarea label="Énoncé de la question" name="statement" rows={2} required />

      <div className="flex flex-col gap-1.5">
        <label className="font-body text-sm font-medium text-foreground">Type de réponse</label>
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(KIND_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {kind === "vrai_faux" ? (
        <div className="flex flex-col gap-1.5">
          <span className="font-body text-sm font-medium text-foreground">Bonne réponse</span>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 font-body text-sm text-foreground">
              <input type="radio" name="correct_bool" value="vrai" required /> Vrai
            </label>
            <label className="flex items-center gap-2 font-body text-sm text-foreground">
              <input type="radio" name="correct_bool" value="faux" /> Faux
            </label>
          </div>
        </div>
      ) : (
        <div key={kind} className="flex flex-col gap-2">
          <span className="font-body text-sm font-medium text-foreground">
            Options (2 à 4 — cochez la ou les bonnes réponses)
          </span>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <input type={kind === "qcm" ? "checkbox" : "radio"} name="correct" value={i} />
              <Input name={`option_${i}`} placeholder={`Option ${i}${i <= 2 ? " (requise)" : ""}`} className="flex-1" />
            </div>
          ))}
        </div>
      )}

      <Textarea
        label="Explication (optionnelle)"
        name="explanation"
        rows={2}
        hint="Affichée à l'apprenant après validation de sa réponse."
      />

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
