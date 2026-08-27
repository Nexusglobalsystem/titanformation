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
import { createTrainingStepAction, type TrainingStepFormState } from "../_actions/trainingSteps";

const STEP_TYPES = [
  { value: "presentiel", label: "Présentiel" },
  { value: "livekit", label: "Classe virtuelle (LiveKit)" },
  { value: "autoapprentissage", label: "Auto-apprentissage" },
  { value: "evaluation", label: "Évaluation" },
  { value: "certification", label: "Certification" },
] as const;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="ghost" size="sm" loading={pending}>
      Ajouter l&apos;étape
    </Button>
  );
}

export function NewTrainingStepForm({
  trainingId,
  modules,
}: {
  trainingId: string;
  modules: { id: string; title: string }[];
}) {
  const [state, formAction] = useActionState<TrainingStepFormState, FormData>(createTrainingStepAction, undefined);
  const [type, setType] = useState<string>("presentiel");
  const [moduleId, setModuleId] = useState<string>("");

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-DEFAULT border border-dashed border-border p-3">
      <input type="hidden" name="trainingId" value={trainingId} />
      <input type="hidden" name="type" value={type} />
      {type === "autoapprentissage" && <input type="hidden" name="module_id" value={moduleId} />}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label className="font-body text-xs font-medium text-foreground">Type</label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-9 text-sm" aria-label="Type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STEP_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input label="Titre de l'étape" name="title" required className="h-9 text-sm" />
        <Input label="Durée (min)" name="duration_minutes" type="number" min="0" className="h-9 text-sm" />
      </div>

      {type === "autoapprentissage" && modules.length > 0 && (
        <div className="flex flex-col gap-1.5 md:w-72">
          <label className="font-body text-xs font-medium text-foreground">Module concerné (facultatif)</label>
          <Select value={moduleId} onValueChange={setModuleId}>
            <SelectTrigger className="h-9 text-sm" aria-label="Module concerné">
              <SelectValue placeholder="Tous les modules" />
            </SelectTrigger>
            <SelectContent>
              {modules.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

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
