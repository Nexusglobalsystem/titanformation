"use client";

import { useState } from "react";
import type { Tables } from "@titan-kinetic/core/database.types";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@titan-kinetic/ui";
import { IconAlertTriangle, IconCheckCircle } from "@/components/icons";
import { TrainingForm } from "./TrainingForm";
import { AttachTrainingImageForm } from "./AttachTrainingImageForm";
import { TrainingStepsBoard, type TrainingStep } from "./TrainingStepsBoard";
import { NewTrainingStepForm } from "./NewTrainingStepForm";
import { ModulesLessonsPanel } from "./ModulesLessonsPanel";
import { SessionsPanel } from "./SessionsPanel";
import { CertificationRequirementsForm } from "./CertificationRequirementsForm";
import { CertificationSignoffPanel } from "./CertificationSignoffPanel";
import { CreateSatisfactionFormButton, RecalculateSatisfactionButton } from "./SatisfactionActions";
import { createTrainingAction, updateTrainingAction } from "../_actions/trainings";

type ModuleWithLessons = {
  id: string;
  title: string;
  position: number;
  lessons:
    | {
        id: string;
        title: string;
        type: string;
        duration_minutes: number | null;
        position: number;
        document_path: string | null;
      }[]
    | null;
};

type SessionWithTrainers = {
  id: string;
  reference: string;
  status: string;
  starts_on: string;
  ends_on: string;
  max_seats: number;
  session_trainers: { trainer_id: string; profiles: { first_name: string | null; last_name: string | null } | null }[] | null;
  session_slots: { id: string; slot_date: string; half_day: string; modality: string }[] | null;
};

const STEPS = [
  { id: 1, label: "Informations" },
  { id: 2, label: "Composer" },
  { id: 3, label: "Planifier" },
  { id: 4, label: "Publier" },
] as const;

function ChecklistRow({ label, done, detail }: { label: string; done: boolean; detail: string }) {
  return (
    <div className="flex items-center justify-between rounded-DEFAULT border border-border p-3">
      <div className="flex items-center gap-2">
        {done ? (
          <span className="text-success">
            <IconCheckCircle size={18} />
          </span>
        ) : (
          <span className="text-warning">
            <IconAlertTriangle size={18} />
          </span>
        )}
        <span className="font-body text-sm text-foreground">{label}</span>
      </div>
      <span className="font-body text-xs text-foreground-muted">{detail}</span>
    </div>
  );
}

// Assistant de création en 4 étapes : simple restructuration de navigation
// autour des Cards déjà existantes (TrainingForm, TrainingStepsBoard,
// ModulesLessonsPanel, SessionsPanel) — aucune nouvelle logique métier,
// les mêmes actions serveur produisent exactement les mêmes lignes que
// l'ancien flux à page unique.
type CertificationRequirement = {
  id: string;
  min_attendance_pct: number | null;
  min_grade: number | null;
  requires_final_exam: boolean;
  final_exam_lesson_id: string | null;
  requires_pedagogical_signoff: boolean;
};

type CertificationEnrollment = {
  id: string;
  learnerName: string;
  signedAt: string | null;
  signedByName: string | null;
  comment: string | null;
};

export function FormationWizard({
  training,
  trainingImageUrl,
  trainers,
  modules,
  trainingSteps,
  sessions,
  certificationRequirement = null,
  requiredModuleIds = [],
  certificationEnrollments = [],
  quizLessons = [],
  satisfactionFormId = null,
  satisfactionResponseCount = 0,
}: {
  training: Tables<"trainings"> | null;
  trainingImageUrl: string | null;
  trainers: { id: string; first_name: string | null; last_name: string | null }[];
  modules: ModuleWithLessons[];
  trainingSteps: TrainingStep[];
  sessions: SessionWithTrainers[];
  certificationRequirement?: CertificationRequirement | null;
  requiredModuleIds?: string[];
  certificationEnrollments?: CertificationEnrollment[];
  quizLessons?: { id: string; title: string }[];
  satisfactionFormId?: string | null;
  satisfactionResponseCount?: number;
}) {
  const [activeTab, setActiveTab] = useState<number>(training ? 2 : 1);
  const totalLessons = modules.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0);

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          {training ? `Modifier « ${training.title} »` : "Nouvelle formation"}
        </h1>
        <p className="mt-1 font-body text-sm text-foreground-muted">
          Informations → Composer → Planifier → Publier.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {STEPS.map((step) => {
          const disabled = step.id > 1 && !training;
          const isActive = activeTab === step.id;
          return (
            <button
              key={step.id}
              type="button"
              disabled={disabled}
              onClick={() => setActiveTab(step.id)}
              className={`inline-flex h-9 items-center gap-2 rounded-full border px-3 font-body text-sm transition-colors ${
                disabled
                  ? "cursor-not-allowed border-transparent text-foreground-muted/40"
                  : isActive
                    ? "border-primary bg-primary text-on-primary"
                    : "border-border text-foreground hover:bg-surface-elevated"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full font-mono-label text-[10px] ${
                  isActive ? "bg-on-primary/20" : "bg-accent/20 text-accent-text"
                }`}
              >
                {step.id}
              </span>
              {step.label}
            </button>
          );
        })}
      </div>

      {activeTab === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <TrainingForm
              training={training ?? undefined}
              action={training ? updateTrainingAction : createTrainingAction}
              submitLabel={training ? "Enregistrer" : "Créer et continuer"}
            />
            {training && (
              <div className="border-t border-border pt-6">
                <AttachTrainingImageForm trainingId={training.id} imageUrl={trainingImageUrl} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 2 && training && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Parcours de la formation</CardTitle>
              <p className="font-body text-sm text-foreground-muted">
                Séquence d&apos;étapes (présentiel, classe virtuelle, auto-apprentissage, évaluation,
                certification). Glissez-déposez pour réordonner.
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <TrainingStepsBoard trainingId={training.id} steps={trainingSteps} />
              <NewTrainingStepForm
                trainingId={training.id}
                modules={modules.map((m) => ({ id: m.id, title: m.title }))}
              />
            </CardContent>
          </Card>
          <ModulesLessonsPanel trainingId={training.id} modules={modules} />
        </div>
      )}

      {activeTab === 3 && training && (
        <SessionsPanel trainingId={training.id} sessions={sessions} trainers={trainers} />
      )}

      {activeTab === 4 && training && (
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Résumé</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <ChecklistRow label="Informations" done detail="Renseignées" />
              <ChecklistRow
                label="Parcours"
                done={trainingSteps.length > 0}
                detail={`${trainingSteps.length} étape(s)`}
              />
              <ChecklistRow
                label="Modules & leçons"
                done={modules.length > 0}
                detail={`${modules.length} module(s), ${totalLessons} leçon(s)`}
              />
              <ChecklistRow label="Sessions" done={sessions.length > 0} detail={`${sessions.length} session(s)`} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Statut de la formation</CardTitle>
              <p className="font-body text-sm text-foreground-muted">
                Passez le statut à « Publiée » pour la rendre visible dans le catalogue.
              </p>
            </CardHeader>
            <CardContent>
              <TrainingForm training={training} action={updateTrainingAction} submitLabel="Enregistrer" />
            </CardContent>
          </Card>

          {training.is_certifying && (
            <Card>
              <CardHeader>
                <CardTitle>Conditions de certification</CardTitle>
                <p className="font-body text-sm text-foreground-muted">
                  Sans condition définie ici, le certificat reste débloqué dès que 100% des leçons
                  obligatoires sont terminées.
                </p>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <CertificationRequirementsForm
                  trainingId={training.id}
                  requirement={certificationRequirement}
                  requiredModuleIds={requiredModuleIds}
                  modules={modules.map((m) => ({ id: m.id, title: m.title }))}
                  quizLessons={quizLessons}
                />
                {certificationRequirement?.requires_pedagogical_signoff && (
                  <div className="flex flex-col gap-3 border-t border-border pt-6">
                    <h3 className="font-display text-sm font-semibold text-foreground">
                      Validation pédagogique par apprenant
                    </h3>
                    <CertificationSignoffPanel trainingId={training.id} enrollments={certificationEnrollments} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Questionnaire de satisfaction (ind. 2/3)</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="neutral">
                  Taux de satisfaction :{" "}
                  {training.satisfaction_rate !== null ? `${training.satisfaction_rate}%` : "non renseigné"}
                </Badge>
                {satisfactionFormId && (
                  <Badge variant="neutral">
                    {satisfactionResponseCount} réponse{satisfactionResponseCount > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
              {satisfactionFormId ? (
                <RecalculateSatisfactionButton trainingId={training.id} />
              ) : (
                <CreateSatisfactionFormButton trainingId={training.id} />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
