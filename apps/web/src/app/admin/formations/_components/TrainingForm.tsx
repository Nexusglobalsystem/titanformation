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
import type { TrainingFormState } from "../_actions/trainings";

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

export function TrainingForm({
  training,
  action,
  submitLabel,
}: {
  training?: Tables<"trainings">;
  action: (state: TrainingFormState, formData: FormData) => Promise<TrainingFormState>;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState<TrainingFormState, FormData>(action, undefined);
  const [title, setTitle] = useState(training?.title ?? "");
  const [slug, setSlug] = useState(training?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(training));
  const [isCertifying, setIsCertifying] = useState(training?.is_certifying ?? false);
  const [status, setStatus] = useState(training?.status ?? "brouillon");
  const [level, setLevel] = useState(training?.level ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {training && <input type="hidden" name="id" value={training.id} />}

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold text-foreground">Identité</h2>
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
            hint="Utilisé dans l'URL publique : /formations/ce-slug"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Input label="Catégorie" name="category" defaultValue={training?.category ?? ""} />
          <div className="flex flex-col gap-1.5">
            <label className="font-body text-sm font-medium text-foreground">Niveau</label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Non précisé" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="debutant">Débutant</SelectItem>
                <SelectItem value="intermediaire">Intermédiaire</SelectItem>
                <SelectItem value="avance">Avancé</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" name="level" value={level} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-body text-sm font-medium text-foreground">Statut</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="brouillon">Brouillon</SelectItem>
                <SelectItem value="publiee">Publiée</SelectItem>
                <SelectItem value="archivee">Archivée</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" name="status" value={status} />
          </div>
          <div className="flex items-end gap-2 pb-2.5">
            <input
              type="checkbox"
              id="is_certifying"
              name="is_certifying"
              defaultChecked={training?.is_certifying ?? false}
              onChange={(e) => setIsCertifying(e.target.checked)}
              className="h-4 w-4 accent-accent"
            />
            <label htmlFor="is_certifying" className="font-body text-sm text-foreground">
              Formation certifiante
            </label>
          </div>
        </div>
        {isCertifying && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Nom de la certification"
              name="certification_name"
              defaultValue={training?.certification_name ?? ""}
            />
            <Input label="Code RNCP" name="rncp_code" defaultValue={training?.rncp_code ?? ""} />
          </div>
        )}
        <div className="flex items-start gap-2 rounded-DEFAULT border border-border p-3">
          <input
            type="checkbox"
            id="sequential_unlock"
            name="sequential_unlock"
            defaultChecked={training?.sequential_unlock ?? false}
            className="mt-0.5 h-4 w-4 accent-accent"
          />
          <label htmlFor="sequential_unlock" className="flex flex-col gap-0.5">
            <span className="font-body text-sm text-foreground">Déverrouillage progressif des modules</span>
            <span className="font-body text-xs text-foreground-muted">
              Chaque module ne s&apos;ouvre que lorsque toutes les leçons du module précédent sont terminées.
              Désactivé par défaut : tous les modules restent accessibles librement.
            </span>
          </label>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Contenu Qualiopi (indicateur 1)
        </h2>
        <Textarea label="Résumé" name="summary" required defaultValue={training?.summary ?? ""} />
        <Textarea
          label="Objectifs pédagogiques"
          name="objectives"
          required
          defaultValue={training?.objectives ?? ""}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Textarea
            label="Prérequis"
            name="prerequisites"
            required
            hint="« Aucun » est une réponse valable."
            defaultValue={training?.prerequisites ?? ""}
          />
          <Textarea
            label="Public visé"
            name="target_audience"
            required
            defaultValue={training?.target_audience ?? ""}
          />
        </div>
        <Textarea
          label="Moyens pédagogiques"
          name="pedagogical_means"
          required
          defaultValue={training?.pedagogical_means ?? ""}
        />
        <Textarea
          label="Modalités d'évaluation"
          name="assessment_methods"
          required
          defaultValue={training?.assessment_methods ?? ""}
        />
        <Textarea
          label="Accessibilité (indicateur 9)"
          name="accessibility_info"
          required
          hint="Modalités d'adaptation handicap et contact du référent."
          defaultValue={training?.accessibility_info ?? ""}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold text-foreground">Modalités & tarif</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Modalités"
            name="modalities"
            required
            hint="Ex. Blended : classes virtuelles synchrones et modules asynchrones."
            defaultValue={training?.modalities ?? ""}
          />
          <Input
            label="Délai d'accès"
            name="access_delay"
            required
            defaultValue={training?.access_delay ?? ""}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Input
            label="Durée (heures)"
            name="duration_hours"
            type="number"
            step="0.5"
            min="0"
            required
            defaultValue={training?.duration_hours ?? ""}
          />
          <Input
            label="Durée (jours)"
            name="duration_days"
            type="number"
            step="0.5"
            min="0"
            defaultValue={training?.duration_days ?? ""}
          />
          <Input
            label="Prix HT (€)"
            name="price_ht"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={training?.price_ht ?? ""}
          />
          <Input
            label="TVA (%)"
            name="vat_rate"
            type="number"
            step="0.1"
            min="0"
            defaultValue={training?.vat_rate ?? 0}
          />
        </div>
      </section>

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
