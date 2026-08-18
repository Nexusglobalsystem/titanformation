"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@titan-kinetic/ui";
import { markLessonCompleteAction, type ProgressState } from "../../_actions/progress";

function SubmitButton({ alreadyDone }: { alreadyDone: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={alreadyDone ? "outline" : "primary"} loading={pending}>
      {alreadyDone ? "Marquer à nouveau comme terminé" : "Marquer comme terminé"}
    </Button>
  );
}

export function MarkCompleteButton({
  enrollmentId,
  lessonId,
  alreadyDone,
}: {
  enrollmentId: string;
  lessonId: string;
  alreadyDone: boolean;
}) {
  const [state, formAction] = useActionState<ProgressState, FormData>(markLessonCompleteAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="enrollmentId" value={enrollmentId} />
      <input type="hidden" name="lessonId" value={lessonId} />
      <SubmitButton alreadyDone={alreadyDone} />
      {state?.error && (
        <p role="alert" className="font-body text-xs text-error">
          {state.error}
        </p>
      )}
    </form>
  );
}
