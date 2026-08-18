import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SpaceShell } from "@/components/SpaceShell";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@titan-kinetic/ui";
import { TrainingForm } from "../_components/TrainingForm";
import { NewSessionForm } from "../_components/NewSessionForm";
import { NewModuleForm } from "../_components/NewModuleForm";
import { NewLessonForm } from "../_components/NewLessonForm";
import { AttachLessonFileForm } from "../_components/AttachLessonFileForm";
import { updateTrainingAction } from "../_actions/trainings";

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

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, reference, status, starts_on, ends_on, max_seats")
    .eq("training_id", id)
    .order("starts_on", { ascending: true });

  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, position, lessons(id, title, type, duration_minutes, position, document_path)")
    .eq("training_id", id)
    .order("position", { ascending: true });

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
          <CardContent>
            <TrainingForm training={training} action={updateTrainingAction} submitLabel="Enregistrer" />
          </CardContent>
        </Card>

        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Sessions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {sessions && sessions.length > 0 && (
              <div className="flex flex-col gap-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between rounded-DEFAULT border border-border p-3"
                  >
                    <div>
                      <p className="font-body text-sm font-semibold text-foreground">{session.reference}</p>
                      <p className="font-body text-xs text-foreground-muted">
                        {new Date(session.starts_on).toLocaleDateString("fr-FR")} –{" "}
                        {new Date(session.ends_on).toLocaleDateString("fr-FR")} · {session.max_seats} places
                      </p>
                    </div>
                    <Badge variant="neutral">{SESSION_STATUS_LABELS[session.status] ?? session.status}</Badge>
                  </div>
                ))}
              </div>
            )}
            <NewSessionForm trainingId={training.id} />
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
      </div>
    </SpaceShell>
  );
}
