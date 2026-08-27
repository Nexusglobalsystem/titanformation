"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@titan-kinetic/ui";
import { generateDocumentAction, type DocumentActionState } from "../_actions/documents";

const KIND_LABELS: Record<string, string> = {
  convocation: "Convocation",
  attestation_fin_formation: "Attestation de fin de formation",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="sm" loading={pending}>
      Générer
    </Button>
  );
}

export function GenerateDocumentForm({
  enrollments,
}: {
  enrollments: { id: string; label: string }[];
}) {
  const [state, formAction] = useActionState<DocumentActionState, FormData>(generateDocumentAction, undefined);
  const [enrollmentId, setEnrollmentId] = useState("");
  const [kind, setKind] = useState("convocation");

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="enrollmentId" value={enrollmentId} />
      <input type="hidden" name="kind" value={kind} />
      <div className="flex flex-col gap-1.5">
        <label className="font-body text-sm font-medium text-foreground">Inscription</label>
        <Select value={enrollmentId} onValueChange={setEnrollmentId}>
          <SelectTrigger aria-label="Inscription">
            <SelectValue placeholder="Choisir un apprenant / une formation" />
          </SelectTrigger>
          <SelectContent>
            {enrollments.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="font-body text-sm font-medium text-foreground">Type de document</label>
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger aria-label="Type de document">
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
