import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SpaceShell } from "@/components/SpaceShell";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@titan-kinetic/ui";
import { TrainingForm } from "../_components/TrainingForm";
import { NewSessionForm } from "../_components/NewSessionForm";
import { AssignTrainerForm } from "../_components/AssignTrainerForm";
import { NewModuleForm } from "../_components/NewModuleForm";
import { NewLessonForm } from "../_components/NewLessonForm";
import { AttachLessonFileForm } from "../_components/AttachLessonFileForm";
import { AttachTrainingImageForm } from "../_components/AttachTrainingImageForm";
import { TrainingStepsBoard } from "../_components/TrainingStepsBoard";
import { NewTrainingStepForm } from "../_components/NewTrainingStepForm";
import { CertificationRequirementsForm } from "../_components/CertificationRequirementsForm";
import { CertificationSignoffPanel } from "../_components/CertificationSignoffPanel";
import { updateTrainingAction } from "../_actions/trainings";
import { removeTrainerAction } from "../_actions/trainers";
import { CreateSatisfactionFormButton, RecalculateSatisfactionButton } from "../_components/SatisfactionActions";

const SESSION_STATUS_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  ouverte: "Ouverte",
  complete: "Complète",
  en_cours: "En cours",
  terminee: "Terminée",
  annulee: "Annulée",
};

const LESSON_TYPE_LABELS: Record<string, string> = {
  texte: "Texte",
  video: "Vidéo",
  audio: "Audio",
  document: "Document",
  quiz: "Quiz",
  live_slot: "Créneau live",
};

const LESSON_TYPE_VARIANTS: Record<string, "neutral" | "success" | "warning" | "featured"> = {
  texte: "neutral",
  video: "featured",
  audio: "success",
  document: "warning",
  quiz: "featured",
  live_slot: "warning",
};

export default async function EditFormationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: training } = await supabase.from("trainings").select("*").eq("id", id).maybeSingle();
  if (!training) notFound();

  const trainingImageUrl = training.image_path
    ? supabase.storage.from("training-images").getPublicUrl(training.image_path).data.publicUrl
    : null;

  const { data: sessions } = await supabase
    .from("sessions")
    .select(
      "id, reference, status, starts_on, ends_on, max_seats, session_trainers(trainer_id, profiles(first_name, last_name))",
    )
    .eq("training_id", id)
    .order("starts_on", { ascending: true });

  const { data: trainerRoles } = await supabase
    .from("user_roles")
    .select("user_id, profiles!user_roles_user_id_fkey(id, first_name, last_name)")
    .eq("role", "formateur");
  const trainers = (trainerRoles ?? [])
    .map((t) => t.profiles)
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, position, lessons(id, title, type, duration_minutes, position, document_path)")
    .eq("training_id", id)
    .order("position", { ascending: true });

  const { data: trainingStepsRaw } = await supabase
    .from("training_steps")
    .select("id, type, title, duration_minutes, modules(title)")
    .eq("training_id", id)
    .order("position", { ascending: true });

  let certificationRequirement: {
    id: string;
    min_attendance_pct: number | null;
    min_grade: number | null;
    requires_final_exam: boolean;
    final_exam_lesson_id: string | null;
    requires_pedagogical_signoff: boolean;
  } | null = null;
  let requiredModuleIds: string[] = [];
  let certificationEnrollments: {
    id: string;
    learnerName: string;
    signedAt: string | null;
    signedByName: string | null;
    comment: string | null;
  }[] = [];

  if (training.is_certifying) {
    const { data: req } = await supabase
      .from("certification_requirements")
      .select("id, min_attendance_pct, min_grade, requires_final_exam, final_exam_lesson_id, requires_pedagogical_signoff")
      .eq("training_id", id)
      .maybeSingle();
    certificationRequirement = req ?? null;

    if (certificationRequirement) {
      const { data: reqModules } = await supabase
        .from("certification_required_modules")
        .select("module_id")
        .eq("requirement_id", certificationRequirement.id);
      requiredModuleIds = (reqModules ?? []).map((m) => m.module_id);

      if (certificationRequirement.requires_pedagogical_signoff) {
        const { data: enrollments } = await supabase
          .from("enrollments")
          .select("id, profiles(first_name, last_name), sessions!inner(training_id)")
          .eq("sessions.training_id", id)
          .in("status", ["confirme", "termine"]);

        const enrollmentIds = (enrollments ?? []).map((e) => e.id);
        const { data: signoffs } = enrollmentIds.length
          ? await supabase
              .from("certification_signoffs")
              .select("enrollment_id, signed_at, comment, profiles(first_name, last_name)")
              .in("enrollment_id", enrollmentIds)
          : { data: [] };

        const signoffByEnrollment = new Map((signoffs ?? []).map((s) => [s.enrollment_id, s]));
        certificationEnrollments = (enrollments ?? []).map((e) => {
          const signoff = signoffByEnrollment.get(e.id);
          return {
            id: e.id,
            learnerName: `${e.profiles?.first_name ?? ""} ${e.profiles?.last_name ?? ""}`.trim() || "—",
            signedAt: signoff?.signed_at ?? null,
            signedByName: signoff?.profiles
              ? `${signoff.profiles.first_name ?? ""} ${signoff.profiles.last_name ?? ""}`.trim()
              : null,
            comment: signoff?.comment ?? null,
          };
        });
      }
    }
  }

  const quizLessons = (modules ?? [])
    .flatMap((m) => m.lessons ?? [])
    .filter((l) => l.type === "quiz")
    .map((l) => ({ id: l.id, title: l.title }));

  const { data: satisfactionForm } = await supabase
    .from("evaluation_forms")
    .select("id")
    .eq("training_id", id)
    .eq("kind", "satisfaction_chaud")
    .maybeSingle();

  let satisfactionResponseCount = 0;
  if (satisfactionForm) {
    const { count } = await supabase
      .from("evaluation_responses")
      .select("id", { count: "exact", head: true })
      .eq("form_id", satisfactionForm.id);
    satisfactionResponseCount = count ?? 0;
  }

  return (
    <SpaceShell title="Espace administration">
      <div className="flex flex-col gap-6">
        <Link
          href="/admin/formations"
          className="inline-block font-body text-sm text-accent-text hover:underline"
        >
          ← Retour aux formations
        </Link>
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Modifier « {training.title} »</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <TrainingForm training={training} action={updateTrainingAction} submitLabel="Enregistrer" />
            <div className="border-t border-border pt-6">
              <AttachTrainingImageForm trainingId={training.id} imageUrl={trainingImageUrl} />
            </div>
          </CardContent>
        </Card>

        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Sessions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {sessions && sessions.length > 0 && (
              <div className="flex flex-col gap-2">
                {sessions.map((session) => {
                  const assigned = session.session_trainers ?? [];
                  const assignedIds = new Set(assigned.map((a) => a.trainer_id));
                  const availableTrainers = trainers.filter((t) => !assignedIds.has(t.id));
                  return (
                    <div key={session.id} className="flex flex-col gap-2 rounded-DEFAULT border border-border p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-body text-sm font-semibold text-foreground">{session.reference}</p>
                          <p className="font-body text-xs text-foreground-muted">
                            {new Date(session.starts_on).toLocaleDateString("fr-FR")} –{" "}
                            {new Date(session.ends_on).toLocaleDateString("fr-FR")} · {session.max_seats} places
                          </p>
                        </div>
                        <Badge variant="neutral">{SESSION_STATUS_LABELS[session.status] ?? session.status}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {assigned.map((a) => (
                          <div
                            key={a.trainer_id}
                            className="flex items-center gap-1 rounded-full border border-border bg-surface-elevated py-1 pl-3 pr-1 font-body text-xs text-foreground"
                          >
                            {a.profiles?.first_name} {a.profiles?.last_name}
                            <form action={removeTrainerAction}>
                              <input type="hidden" name="sessionId" value={session.id} />
                              <input type="hidden" name="trainingId" value={training.id} />
                              <input type="hidden" name="trainerId" value={a.trainer_id} />
                              <Button
                                type="submit"
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 rounded-full p-0 text-xs"
                                aria-label="Retirer ce formateur"
                              >
                                ×
                              </Button>
                            </form>
                          </div>
                        ))}
                        <AssignTrainerForm sessionId={session.id} trainingId={training.id} trainers={availableTrainers} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <NewSessionForm trainingId={training.id} trainers={trainers} />
          </CardContent>
        </Card>

        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Programme (modules et leçons)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {modules && modules.length > 0 && (
              <div className="flex flex-col gap-6">
                {modules.map((module) => {
                  const lessons = [...(module.lessons ?? [])].sort((a, b) => a.position - b.position);
                  return (
                    <div key={module.id} className="flex flex-col gap-3">
                      <h3 className="font-mono-label text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                        {module.title}
                      </h3>
                      <div className="flex flex-col gap-2 border-l-2 border-border pl-4">
                        {lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="flex flex-col gap-3 rounded-DEFAULT border border-border p-3"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-body text-sm text-foreground">{lesson.title}</p>
                                <p className="font-body text-xs text-foreground-muted">
                                  {lesson.duration_minutes} min
                                </p>
                              </div>
                              <Badge variant={LESSON_TYPE_VARIANTS[lesson.type] ?? "neutral"}>
                                {LESSON_TYPE_LABELS[lesson.type] ?? lesson.type}
                              </Badge>
                            </div>
                            {(lesson.type === "audio" || lesson.type === "document") && (
                              <AttachLessonFileForm
                                lessonId={lesson.id}
                                trainingId={training.id}
                                currentPath={lesson.document_path}
                              />
                            )}
                            {lesson.type === "quiz" && (
                              <Link
                                href={`/admin/formations/${training.id}/lecons/${lesson.id}/quiz`}
                                className="font-body text-xs text-accent-text hover:underline"
                              >
                                Gérer le QCM →
                              </Link>
                            )}
                          </div>
                        ))}
                        <NewLessonForm moduleId={module.id} trainingId={training.id} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <NewModuleForm trainingId={training.id} nextPosition={modules?.length ?? 0} />
          </CardContent>
        </Card>

        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Parcours de la formation</CardTitle>
            <p className="font-body text-sm text-foreground-muted">
              Séquence d&apos;étapes (présentiel, classe virtuelle, auto-apprentissage, évaluation,
              certification) composant le parcours pédagogique. Glissez-déposez pour réordonner.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <TrainingStepsBoard trainingId={training.id} steps={trainingStepsRaw ?? []} />
            <NewTrainingStepForm
              trainingId={training.id}
              modules={(modules ?? []).map((m) => ({ id: m.id, title: m.title }))}
            />
          </CardContent>
        </Card>

        {training.is_certifying && (
          <Card className="max-w-3xl">
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
                modules={(modules ?? []).map((m) => ({ id: m.id, title: m.title }))}
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

        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Questionnaire de satisfaction (ind. 2/3)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="neutral">
                Taux de satisfaction :{" "}
                {training.satisfaction_rate !== null ? `${training.satisfaction_rate}%` : "non renseigné"}
              </Badge>
              {satisfactionForm && (
                <Badge variant="neutral">
                  {satisfactionResponseCount} réponse{satisfactionResponseCount > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            {satisfactionForm ? (
              <RecalculateSatisfactionButton trainingId={training.id} />
            ) : (
              <CreateSatisfactionFormButton trainingId={training.id} />
            )}
          </CardContent>
        </Card>
      </div>
    </SpaceShell>
  );
}
