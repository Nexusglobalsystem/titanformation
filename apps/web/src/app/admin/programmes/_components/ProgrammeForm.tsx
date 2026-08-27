"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@titan-kinetic/ui";
import type { Tables } from "@titan-kinetic/core/database.types";
import type { ProgrammeFormState } from "../_actions/programmes";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" loading={pending}>
      {label}
    </Button>
  );
}

export function ProgrammeForm({
  programme,
  action,
  submitLabel,
}: {
  programme?: Tables<"programmes">;
  action: (state: ProgrammeFormState, formData: FormData) => Promise<ProgrammeFormState>;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState<ProgrammeFormState, FormData>(action, undefined);
  const [title, setTitle] = useState(programme?.title ?? "");
  const [slug, setSlug] = useState(programme?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(programme));
  const [status, setStatus] = useState(programme?.status ?? "brouillon");

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {programme && <input type="hidden" name="id" value={programme.id} />}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Titre"
          name="title"
          required
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
        />
        <Input
          label="Slug (URL)"
          name="slug"
          required
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugify(e.target.value));
          }}
        />
      </div>

      <Textarea label="Résumé" name="summary" defaultValue={programme?.summary ?? ""} />

      <div className="flex flex-col gap-1.5 md:w-64">
        <label className="font-body text-sm font-medium text-foreground">Statut</label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger aria-label="Statut">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="brouillon">Brouillon</SelectItem>
            <SelectItem value="publiee">Publié</SelectItem>
            <SelectItem value="archivee">Archivé</SelectItem>
          </SelectContent>
        </Select>
        <input type="hidden" name="status" value={status} />
      </div>

      {state?.error && (
        <p role="alert" className="rounded-DEFAULT bg-error-bg px-3 py-2 font-body text-sm text-error">
          {state.error}
        </p>
      )}

      <div>
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
