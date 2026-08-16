"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@titan-kinetic/ui";
import { enrollAction, type EnrollState } from "../_actions/enroll";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="accent" className="w-full" loading={pending}>
      S'inscrire
    </Button>
  );
}

export function EnrollForm({ sessionId, slug }: { sessionId: string; slug: string }) {
  const [state, formAction] = useActionState<EnrollState, FormData>(enrollAction, undefined);

  if (state?.success) {
    return (
      <p role="status" className="rounded-DEFAULT bg-success-bg px-3 py-2 font-body text-sm text-success">
        {state.success}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="slug" value={slug} />
      {state?.error && (
        <p role="alert" className="rounded-DEFAULT bg-error-bg px-3 py-2 font-body text-sm text-error">
          {state.error}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
