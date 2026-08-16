"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@titan-kinetic/ui";
import { confirmEnrollmentAction, type ConfirmEnrollmentState } from "../_actions/enrollments";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" loading={pending}>
      Confirmer
    </Button>
  );
}

export function ConfirmEnrollmentButton({ enrollmentId }: { enrollmentId: string }) {
  const [state, formAction] = useActionState<ConfirmEnrollmentState, FormData>(
    confirmEnrollmentAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="enrollmentId" value={enrollmentId} />
      <SubmitButton />
      {state?.error && (
        <p role="alert" className="font-body text-xs text-error">
          {state.error}
        </p>
      )}
    </form>
  );
}
