"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@titan-kinetic/ui";
import { signAttendanceAction, type SignAttendanceState } from "../_actions/attendance";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="accent" size="sm" loading={pending}>
      Signer ma présence
    </Button>
  );
}

export function SignAttendanceButton({ attendanceId }: { attendanceId: string }) {
  const [state, formAction] = useActionState<SignAttendanceState, FormData>(
    signAttendanceAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="attendanceId" value={attendanceId} />
      <SubmitButton />
      {state?.error && (
        <p role="alert" className="font-body text-xs text-error">
          {state.error}
        </p>
      )}
    </form>
  );
}
