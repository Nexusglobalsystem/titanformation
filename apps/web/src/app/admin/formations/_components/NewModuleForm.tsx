"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button, Input } from "@titan-kinetic/ui";
import { createModuleAction, type ModuleFormState } from "../_actions/modules";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="sm" loading={pending}>
      Ajouter un module
    </Button>
  );
}

export function NewModuleForm({ trainingId, nextPosition }: { trainingId: string; nextPosition: number }) {
  const [state, formAction] = useActionState<ModuleFormState, FormData>(createModuleAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-DEFAULT border border-dashed border-border p-4">
      <input type="hidden" name="trainingId" value={trainingId} />
      <input type="hidden" name="position" value={nextPosition} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input label="Titre du module" name="title" placeholder="Module 1 : Introduction" required />
        </div>
        <SubmitButton />
      </div>
      {state?.error && (
        <p role="alert" className="font-body text-xs text-error">
          {state.error}
        </p>
      )}
    </form>
  );
}
