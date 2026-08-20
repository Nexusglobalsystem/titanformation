"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@titan-kinetic/ui";
import { attachTrainingImageAction, type AttachTrainingImageState } from "../_actions/trainings";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" loading={pending}>
      Envoyer l&apos;image
    </Button>
  );
}

export function AttachTrainingImageForm({
  trainingId,
  imageUrl,
}: {
  trainingId: string;
  imageUrl: string | null;
}) {
  const [state, formAction] = useActionState<AttachTrainingImageState, FormData>(
    attachTrainingImageAction,
    undefined,
  );

  return (
    <div className="flex flex-col gap-2">
      <label className="font-body text-sm font-medium text-foreground">Image de la formation</label>
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className="h-32 w-full max-w-sm rounded-DEFAULT border border-border object-cover"
        />
      )}
      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="trainingId" value={trainingId} />
        <input
          type="file"
          name="file"
          accept="image/*"
          required
          className="font-body text-xs text-foreground-muted file:mr-2 file:rounded-DEFAULT file:border file:border-border file:bg-surface file:px-2 file:py-1 file:font-body file:text-xs file:text-foreground"
        />
        <SubmitButton />
      </form>
      {state?.error && (
        <p role="alert" className="font-body text-xs text-error">
          {state.error}
        </p>
      )}
    </div>
  );
}
