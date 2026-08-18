import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SpaceShell } from "@/components/SpaceShell";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Progress } from "@titan-kinetic/ui";

const LESSON_TYPE_LABELS: Record<string, string> = {
  texte: "Texte",
  video: "Vidéo",
  audio: "Audio",
  document: "Document",
  quiz: "Quiz",
  live_slot: "Créneau live",
};

export default async function ApprenantProgrammePage({
  params,
  searchParams,
}: {
  params: Promise<{ enrollmentId: string }>;
  searchParams: Promise<{ satisfaction?: string; error?: string }>;
}) {
  const { enrollmentId } = await params;
  const { satisfaction, error } = await searchParams;
  const supabase = await createClient();

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, status, sessions(reference, trainings(id, title))")
    .eq("id", enrollmentId)
    .maybeSingle();

  if (!enrollment || !["confirme", "termine"].includes(enrollment.status)) notFound();

  const training = enrollment.sessions?.trainings;
  if (!training) notFound();

  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, position, lessons(id, title, type, position, duration_minutes)")
    .eq("training_id", training.id)
    .order("position", { ascending: true });

  const { data: progressRows } = await supabase
    .from("learner_progress")
    .select("lesson_id, completed_at")
    .eq("enrollment_id", enrollmentId);

  const completedLessonIds = new Set(
    (progressRows ?? []).filter((p) => p.completed_at).map((p) => p.lesson_id),
  );

  const totalLessons = (modules ?? []).reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0);
  const completedLessons = (modules ?? []).reduce(
    (sum, m) => sum + (m.lessons?.filter((l) => completedLessonIds.has(l.id)).length ?? 0),
    0,
  );
  const isComplete = totalLessons > 0 && completedLessons === totalLessons;

  let satisfactionFormId: string | null = null;
  let satisfactionAnswered = false;
  if (isComplete) {
    const { data: form } = await supabase
      .from("evaluation_forms")
      .select("id")
      .eq("training_id", training.id)
      .eq("kind", "satisfaction_chaud")
      .eq("is_active", true)
      .maybeSingle();
    if (form) {
      satisfactionFormId = form.id;
      const { data: response } = await supabase
        .from("evaluation_responses")
        .select("id")
        .eq("form_id", form.id)
        .eq("enrollment_id", enrollmentId)
        .maybeSingle();
      satisfactionAnswered = Boolean(response);
    }
  }

  return (
    <SpaceShell title="Espace apprenant">
      <div className="flex flex-col gap-6">
        <Link href="/apprenant" className="inline-block font-body text-sm text-accent-text hover:underline">
          ← Retour à mes formations
        </Link>
        {satisfaction === "merci" && (
          <p className="font-body text-sm text-success">Merci pour vos réponses !</p>
        )}
        {error === "satisfaction" && (
          <p className="font-body text-sm text-error">Impossible d'enregistrer vos réponses.</p>
        )}
        <Card className="max-w-3xl">
          <CardHeader className="flex flex-col gap-3">
            <CardTitle>{training.title}</CardTitle>
            {totalLessons > 0 && (
              <Progress
                value={completedLessons}
                max={totalLessons}
                label={`${completedLessons}/${totalLessons} leçons terminées`}
              />
            )}
            {isComplete && (
              <div className="flex flex-wrap gap-3">
                <Link href={`/apprenant/formations/${enrollmentId}/certificat`} className="w-fit">
                  <Button variant="primary" size="sm">
                    Voir mon certificat
                  </Button>
                </Link>
                {satisfactionFormId && !satisfactionAnswered && (
                  <Link href={`/apprenant/formations/${enrollmentId}/satisfaction`} className="w-fit">
                    <Button variant="outline" size="sm">
                      Répondre au questionnaire de satisfaction
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {!modules || modules.length === 0 ? (
              <p className="font-body text-sm text-foreground-muted">
                Le programme de cette formation n'est pas encore disponible.
              </p>
            ) : (
              modules
                .map((m) => ({ ...m, lessons: [...(m.lessons ?? [])].sort((a, b) => a.position - b.position) }))
                .map((module) => (
                  <div key={module.id} className="flex flex-col gap-3">
                    <h3 className="font-mono-label text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                      {module.title}
                    </h3>
                    <div className="flex flex-col gap-2 border-l-2 border-border pl-4">
                      {module.lessons.map((lesson) => (
                        <Link
                          key={lesson.id}
                          href={
                            lesson.type === "quiz"
                              ? `/apprenant/formations/${enrollmentId}/quiz/${lesson.id}`
                              : `/apprenant/formations/${enrollmentId}/lecons/${lesson.id}`
                          }
                          className="flex items-center justify-between rounded-DEFAULT border border-border p-3 transition-colors hover:border-accent-text"
                        >
                          <div>
                            <p className="font-body text-sm text-foreground">{lesson.title}</p>
                            <p className="font-body text-xs text-foreground-muted">
                              {LESSON_TYPE_LABELS[lesson.type] ?? lesson.type} · {lesson.duration_minutes} min
                            </p>
                          </div>
                          {completedLessonIds.has(lesson.id) && <Badge variant="success">Terminé</Badge>}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </div>
    </SpaceShell>
  );
}
