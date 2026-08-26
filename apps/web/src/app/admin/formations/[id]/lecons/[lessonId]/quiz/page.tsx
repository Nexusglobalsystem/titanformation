import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SpaceShell } from "@/components/SpaceShell";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState } from "@titan-kinetic/ui";
import { IconClipboardCheck } from "@/components/icons";
import { QuizSettingsForm } from "../../../../_components/QuizSettingsForm";
import { NewQuestionForm } from "../../../../_components/NewQuestionForm";
import { GenerateQuizForm } from "../../../../_components/GenerateQuizForm";
import { deleteQuestionAction } from "../../../../_actions/quizAI";

const KIND_LABELS: Record<string, string> = {
  qcu: "Une seule bonne réponse",
  qcm: "Plusieurs bonnes réponses",
  vrai_faux: "Vrai ou faux",
};

export default async function AdminQuizPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id: trainingId, lessonId } = await params;
  const supabase = await createClient();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, title, type")
    .eq("id", lessonId)
    .maybeSingle();

  if (!lesson || lesson.type !== "quiz") notFound();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, pass_threshold, max_attempts, time_limit_minutes, shuffle_questions")
    .eq("lesson_id", lessonId)
    .maybeSingle();

  const { data: items } = quiz
    ? await supabase
        .from("quiz_items")
        .select(
          "position, points, questions(id, statement, kind, explanation, question_options(id, label, is_correct, position))",
        )
        .eq("quiz_id", quiz.id)
        .order("position", { ascending: true })
    : { data: [] };

  return (
    <SpaceShell title="Espace administration">
      <div className="flex flex-col gap-6">
        <Link
          href={`/admin/formations/nouvelle?id=${trainingId}`}
          className="inline-block font-body text-sm text-accent-text hover:underline"
        >
          ← Retour à la formation
        </Link>

        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>QCM — {lesson.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {!quiz ? (
              <QuizSettingsForm lessonId={lesson.id} trainingId={trainingId} />
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="neutral">Seuil de réussite : {quiz.pass_threshold}%</Badge>
                  <Badge variant="neutral">
                    Tentatives : {quiz.max_attempts ?? "illimitées"}
                  </Badge>
                  <Badge variant="neutral">
                    Durée : {quiz.time_limit_minutes ? `${quiz.time_limit_minutes} min` : "libre"}
                  </Badge>
                  {quiz.shuffle_questions && <Badge variant="neutral">Ordre mélangé</Badge>}
                </div>

                <div className="flex flex-col gap-4">
                  {(items ?? []).map((item, index) => {
                    const question = item.questions;
                    if (!question) return null;
                    const options = [...(question.question_options ?? [])].sort(
                      (a, b) => a.position - b.position,
                    );
                    return (
                      <div key={question.id} className="flex flex-col gap-2 rounded-DEFAULT border border-border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-body text-sm font-semibold text-foreground">
                            {index + 1}. {question.statement}
                          </p>
                          <div className="flex shrink-0 items-center gap-2">
                            <Badge variant="neutral">{KIND_LABELS[question.kind] ?? question.kind}</Badge>
                            <form action={deleteQuestionAction}>
                              <input type="hidden" name="questionId" value={question.id} />
                              <input type="hidden" name="trainingId" value={trainingId} />
                              <input type="hidden" name="lessonId" value={lesson.id} />
                              <Button type="submit" variant="ghost" size="sm" className="h-6 px-2 text-xs text-error">
                                Supprimer
                              </Button>
                            </form>
                          </div>
                        </div>
                        <ul className="flex flex-col gap-1 pl-4">
                          {options.map((option) => (
                            <li
                              key={option.id}
                              className={`font-body text-sm ${option.is_correct ? "font-semibold text-success" : "text-foreground-muted"}`}
                            >
                              {option.is_correct ? "✓ " : "· "}
                              {option.label}
                            </li>
                          ))}
                        </ul>
                        {question.explanation && (
                          <p className="font-body text-xs text-foreground-muted">
                            Explication : {question.explanation}
                          </p>
                        )}
                      </div>
                    );
                  })}
                  {(!items || items.length === 0) && (
                    <EmptyState icon={<IconClipboardCheck />} title="Aucune question pour l'instant." />
                  )}
                </div>

                <NewQuestionForm
                  quizId={quiz.id}
                  lessonId={lesson.id}
                  trainingId={trainingId}
                  nextPosition={items?.length ?? 0}
                />
                <GenerateQuizForm
                  quizId={quiz.id}
                  lessonId={lesson.id}
                  trainingId={trainingId}
                  nextPosition={items?.length ?? 0}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </SpaceShell>
  );
}
