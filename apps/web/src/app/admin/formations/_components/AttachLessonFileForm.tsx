"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@titan-kinetic/ui";
import { attachLessonFileAction, type AttachFileState } from "../_actions/modules";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" loading={pending}>
      Envoyer
    </Button>
  );
}

export function AttachLessonFileForm({
  lessonId,
  trainingId,
  currentPath,
}: {
  lessonId: string;
  trainingId: string;
  currentPath: string | null;
}) {
  const [state, formAction] = useActionState<AttachFileState, FormData>(attachLessonFileAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-1.5">
      <input type="hidden" name="lessonId" value={lessonId} />
      <input type="hidden" name="trainingId" value={trainingId} />
      <div className="flex flex-wrap items-center gap-2">
        {currentPath && (
          <p className="font-body text-xs text-foreground-muted">
            Fichier actuel : {currentPath.split("/").pop()}
          </p>
        )}
        <input
          type="file"
          name="file"
          required
          className="font-body text-xs text-foreground-muted file:mr-2 file:rounded-DEFAULT file:border file:border-border file:bg-surface file:px-2 file:py-1 file:font-body file:text-xs file:text-foreground"
        />
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
