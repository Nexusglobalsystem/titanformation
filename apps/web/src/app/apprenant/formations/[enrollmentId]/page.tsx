import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SpaceShell } from "@/components/SpaceShell";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@titan-kinetic/ui";

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
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const { enrollmentId } = await params;
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

  return (
    <SpaceShell title="Espace apprenant">
      <div className="flex flex-col gap-6">
        <Link href="/apprenant" className="inline-block font-body text-sm text-accent-text hover:underline">
          ← Retour à mes formations
        </Link>
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>{training.title}</CardTitle>
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
                          href={`/apprenant/formations/${enrollmentId}/lecons/${lesson.id}`}
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
