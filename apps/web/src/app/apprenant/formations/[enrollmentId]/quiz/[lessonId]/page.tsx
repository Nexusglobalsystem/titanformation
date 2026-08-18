import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SpaceShell } from "@/components/SpaceShell";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@titan-kinetic/ui";
import { QuizRunner } from "../../../_components/QuizRunner";

export default async function ApprenantQuizPage({
  params,
}: {
  params: Promise<{ enrollmentId: string; lessonId: string }>;
}) {
  const { enrollmentId, lessonId } = await params;
  const supabase = await createClient();

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, status, sessions(trainings(title))")
    .eq("id", enrollmentId)
    .maybeSingle();

  if (!enrollment || !["confirme", "termine"].includes(enrollment.status)) notFound();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, title, type")
    .eq("id", lessonId)
    .maybeSingle();

  if (!lesson || lesson.type !== "quiz") notFound();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, pass_threshold, max_attempts, time_limit_minutes")
    .eq("lesson_id", lessonId)
    .maybeSingle();

  const { data: attempts } = quiz
    ? await supabase
        .from("quiz_attempts")
        .select("attempt_number, score, max_score, passed, submitted_at")
        .eq("quiz_id", quiz.id)
        .eq("enrollment_id", enrollmentId)
        .order("attempt_number", { ascending: false })
    : { data: [] };

  const submittedAttempts = (attempts ?? []).filter((a) => a.submitted_at);
  const hasPassed = submittedAttempts.some((a) => a.passed);
  const attemptsExhausted = Boolean(
    quiz?.max_attempts && submittedAttempts.length >= quiz.max_attempts && !hasPassed,
  );

  return (
    <SpaceShell title="Espace apprenant">
      <div className="flex flex-col gap-6">
        <Link
          href={`/apprenant/formations/${enrollmentId}`}
          className="inline-block font-body text-sm text-accent-text hover:underline"
        >
          ← Retour au programme
        </Link>
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>{lesson.title}</CardTitle>
            <p className="font-body text-xs text-foreground-muted">{enrollment.sessions?.trainings?.title}</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {!quiz ? (
              <p className="font-body text-sm text-foreground-muted">
                Ce QCM n'est pas encore disponible.
              </p>
            ) : (
              <>
                {submittedAttempts.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="font-mono-label text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                      Tentatives précédentes
                    </p>
                    {submittedAttempts.map((a) => (
                      <div
                        key={a.attempt_number}
                        className="flex items-center justify-between rounded-DEFAULT border border-border p-3"
                      >
                        <p className="font-body text-sm text-foreground">
                          Tentative {a.attempt_number} · {a.score}/{a.max_score} points
                        </p>
                        <Badge variant={a.passed ? "success" : "error"}>
                          {a.passed ? "Réussi" : "Non validé"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {hasPassed ? (
                  <p className="font-body text-sm text-success">
                    Vous avez déjà validé ce QCM.
                  </p>
                ) : attemptsExhausted ? (
                  <p className="font-body text-sm text-error">
                    Nombre maximal de tentatives atteint ({quiz.max_attempts}).
                  </p>
                ) : (
                  <QuizRunner lessonId={lessonId} enrollmentId={enrollmentId} />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </SpaceShell>
  );
}
