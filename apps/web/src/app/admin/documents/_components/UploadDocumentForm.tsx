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
import { uploadDocumentAction, type DocumentActionState } from "../_actions/documents";
import { DOCUMENT_TYPE_LABELS } from "../_lib/document-types";

const UPLOADABLE_TYPES = [
  "programme",
  "convention",
  "contrat",
  "feuille_emargement",
  "certificat_realisation",
  "evaluation_synthese",
  "autre",
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" loading={pending}>
      Envoyer
    </Button>
  );
}

export function UploadDocumentForm({ enrollments }: { enrollments: { id: string; label: string }[] }) {
  const [state, formAction] = useActionState<DocumentActionState, FormData>(uploadDocumentAction, undefined);
  const [enrollmentId, setEnrollmentId] = useState("");
  const [type, setType] = useState("programme");

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="enrollmentId" value={enrollmentId} />
      <input type="hidden" name="type" value={type} />
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
        <Select value={type} onValueChange={setType}>
          <SelectTrigger aria-label="Type de document">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {UPLOADABLE_TYPES.map((value) => (
              <SelectItem key={value} value={value}>
                {DOCUMENT_TYPE_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <input
        type="file"
        name="file"
        required
        className="font-body text-xs text-foreground-muted file:mr-2 file:rounded-DEFAULT file:border file:border-border file:bg-surface file:px-2 file:py-1 file:font-body file:text-xs file:text-foreground"
      />
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
