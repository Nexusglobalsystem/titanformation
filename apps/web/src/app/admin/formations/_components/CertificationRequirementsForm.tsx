"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button, Input } from "@titan-kinetic/ui";
import {
  upsertCertificationRequirementsAction,
  type CertificationFormState,
} from "../_actions/certification";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="sm" loading={pending}>
      Enregistrer les conditions
    </Button>
  );
}

export function CertificationRequirementsForm({
  trainingId,
  requirement,
  requiredModuleIds,
  modules,
  quizLessons,
}: {
  trainingId: string;
  requirement: {
    min_attendance_pct: number | null;
    min_grade: number | null;
    requires_final_exam: boolean;
    final_exam_lesson_id: string | null;
    requires_pedagogical_signoff: boolean;
  } | null;
  requiredModuleIds: string[];
  modules: { id: string; title: string }[];
  quizLessons: { id: string; title: string }[];
}) {
  const [state, formAction] = useActionState<CertificationFormState, FormData>(
    upsertCertificationRequirementsAction,
    undefined,
  );
  const [requiresFinalExam, setRequiresFinalExam] = useState(requirement?.requires_final_exam ?? false);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="trainingId" value={trainingId} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Assiduité minimale (%)"
          name="min_attendance_pct"
          type="number"
          min="0"
          max="100"
          step="1"
          defaultValue={requirement?.min_attendance_pct ?? ""}
          hint="Laisser vide pour ne pas exiger de taux de présence."
        />
        <Input
          label="Note minimale (%)"
          name="min_grade"
          type="number"
          min="0"
          max="100"
          step="1"
          defaultValue={requirement?.min_grade ?? ""}
          hint="Moyenne des meilleurs scores obtenus sur les QCM de la formation."
        />
      </div>

      {modules.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="font-body text-sm font-medium text-foreground">
            Modules obligatoires (vide = tous les modules)
          </label>
          <div className="flex flex-col gap-1.5">
            {modules.map((m) => (
              <label key={m.id} className="flex items-center gap-2 font-body text-sm text-foreground">
                <input
                  type="checkbox"
                  name="required_module_ids"
                  value={m.id}
                  defaultChecked={requiredModuleIds.includes(m.id)}
                  className="h-4 w-4 accent-accent"
                />
                {m.title}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="requires_final_exam"
          name="requires_final_exam"
          defaultChecked={requirement?.requires_final_exam ?? false}
          onChange={(e) => setRequiresFinalExam(e.target.checked)}
          className="h-4 w-4 accent-accent"
        />
        <label htmlFor="requires_final_exam" className="font-body text-sm text-foreground">
          Exige la réussite d&apos;un examen final
        </label>
      </div>

      {requiresFinalExam && quizLessons.length > 0 && (
        <div className="flex flex-col gap-1.5 md:w-96">
          <label className="font-body text-sm font-medium text-foreground">QCM servant d&apos;examen final</label>
          <select
            name="final_exam_lesson_id"
            defaultValue={requirement?.final_exam_lesson_id ?? ""}
            className="h-10 rounded border border-border bg-surface px-3 font-body text-sm text-foreground"
          >
            <option value="">— Choisir —</option>
            {quizLessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="requires_pedagogical_signoff"
          name="requires_pedagogical_signoff"
          defaultChecked={requirement?.requires_pedagogical_signoff ?? false}
          className="h-4 w-4 accent-accent"
        />
        <label htmlFor="requires_pedagogical_signoff" className="font-body text-sm text-foreground">
          Exige une validation pédagogique manuelle par apprenant
        </label>
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
