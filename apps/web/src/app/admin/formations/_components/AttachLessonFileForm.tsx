"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button, FileDropzone } from "@titan-kinetic/ui";
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
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="lessonId" value={lessonId} />
      <input type="hidden" name="trainingId" value={trainingId} />
      {currentPath && (
        <p className="font-body text-xs text-foreground-muted">
          Fichier actuel : {currentPath.split("/").pop()}
        </p>
      )}
      <FileDropzone name="file" required />
      <div>
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
