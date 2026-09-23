"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge, Button } from "@titan-kinetic/ui";
type Question = {
  id: string;
  statement: string;
  kind: string;
  options: { id: string; label: string }[];
};
type Attempt = {
  attemptId: string;
  passThreshold: number;
  timeLimitMinutes: number | null;
  expiresAt: string | null;
  questions: Question[];
};
type Result = {
  score: number;
  maxScore: number;
  passed: boolean;
  expired?: boolean;
  passThreshold: number;
  results: {
    questionId: string;
    isCorrect: boolean;
    correctOptionIds: string[];
    explanation: string | null;
  }[];
};
function Deadline({ expiresAt }: { expiresAt: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const seconds = Math.max(
    0,
    Math.ceil((new Date(expiresAt).getTime() - now) / 1000),
  );
  return (
    <p
      role="timer"
      className={
        seconds === 0 ? "text-error text-sm" : "text-foreground-muted text-sm"
      }
    >
      {seconds === 0
        ? "Temps écoulé : cette tentative ne pourra plus être validée."
        : "Temps restant : " +
          Math.floor(seconds / 60) +
          ":" +
          String(seconds % 60).padStart(2, "0")}
    </p>
  );
}
export function QuizRunner({
  lessonId,
  enrollmentId,
}: {
  lessonId: string;
  enrollmentId: string;
}) {
  const [attempt, setAttempt] = useState<Attempt | null>(null),
    [answers, setAnswers] = useState<Record<string, string[]>>({}),
    [result, setResult] = useState<Result | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  async function start() {
    setBusy(true);
    setError(null);
    setResult(null);
    setAttempt(null);
    setAnswers({});
    try {
      const { data, error: failure } = await createClient().functions.invoke<
        Attempt | { error: string }
      >("quiz-attempt", { body: { action: "start", lessonId, enrollmentId } });
      if (failure || !data || "error" in data)
        throw new Error(
          data && "error" in data
            ? data.error
            : "Impossible de démarrer le quiz. Réessayez.",
        );
      setAttempt(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connexion indisponible.");
    } finally {
      setBusy(false);
    }
  }
  async function submit() {
    if (!attempt) return;
    setBusy(true);
    setError(null);
    try {
      const { data, error: failure } = await createClient().functions.invoke<
        Result | { error: string }
      >("quiz-attempt", {
        body: {
          action: "submit",
          attemptId: attempt.attemptId,
          answers: attempt.questions.map((q) => ({
            questionId: q.id,
            selectedOptionIds: answers[q.id] ?? [],
          })),
        },
      });
      if (failure || !data || "error" in data)
        throw new Error(
          data && "error" in data
            ? data.error
            : "Impossible d’enregistrer vos réponses. Réessayez.",
        );
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connexion indisponible.");
    } finally {
      setBusy(false);
    }
  }
  function choose(q: Question, optionId: string) {
    setAnswers((previous) => {
      const current = previous[q.id] ?? [];
      return {
        ...previous,
        [q.id]:
          q.kind === "qcm"
            ? current.includes(optionId)
              ? current.filter((x) => x !== optionId)
              : [...current, optionId]
            : [optionId],
      };
    });
  }
  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
      {!attempt ? (
        <div>
          <p className="mb-4 text-sm text-foreground-muted">
            Prenez le temps de lire chaque question. Votre progression sera
            enregistrée après validation.
          </p>
          <Button onClick={start} loading={busy} disabled={busy}>
            Commencer le quiz
          </Button>
        </div>
      ) : result ? (
        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-border bg-surface p-6">
            <Badge variant={result.passed ? "success" : "error"}>
              {result.passed ? "Étape validée" : "Continuez à progresser"}
            </Badge>
            <h3 className="mt-4 text-3xl font-display">
              {result.maxScore
                ? Math.round((100 * result.score) / result.maxScore)
                : 0}
              %
            </h3>
            <p className="mt-2 text-sm text-foreground-muted">
              {result.score}/{result.maxScore} points · Objectif :{" "}
              {result.passThreshold}%
            </p>
            {result.expired && (
              <p className="mt-2 text-sm text-error">
                La durée autorisée était dépassée.
              </p>
            )}
          </div>
          {attempt.questions.map((q) => {
            const feedback = result.results.find((r) => r.questionId === q.id);
            return (
              <div key={q.id} className="rounded-xl border border-border p-4">
                <h4 className="font-semibold">{q.statement}</h4>
                <p
                  className={
                    feedback?.isCorrect
                      ? "text-sm text-success"
                      : "text-sm text-error"
                  }
                >
                  {feedback?.isCorrect ? "Bonne réponse" : "À revoir"}
                </p>
                {feedback?.explanation && (
                  <p className="mt-2 text-sm text-foreground-muted">
                    {feedback.explanation}
                  </p>
                )}
              </div>
            );
          })}
          {!result.passed && (
            <Button
              variant="outline"
              onClick={start}
              disabled={busy}
              loading={busy}
            >
              Nouvelle tentative
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap justify-between gap-3">
            <p className="text-sm text-foreground-muted">
              {attempt.questions.length} questions · Objectif :{" "}
              {attempt.passThreshold}%
            </p>
            {attempt.expiresAt && <Deadline expiresAt={attempt.expiresAt} />}
          </div>
          {attempt.questions.map((q, i) => (
            <fieldset
              key={q.id}
              className="rounded-xl border border-border p-5"
            >
              <legend className="px-2 font-semibold">
                {i + 1}. {q.statement}
              </legend>
              {q.kind === "qcm" && (
                <p className="mb-3 text-xs text-foreground-muted">
                  Plusieurs réponses possibles
                </p>
              )}
              <div className="grid gap-2">
                {q.options.map((o) => (
                  <label
                    key={o.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 text-sm hover:bg-surface-zebra"
                  >
                    <input
                      type={q.kind === "qcm" ? "checkbox" : "radio"}
                      name={q.id}
                      checked={(answers[q.id] ?? []).includes(o.id)}
                      onChange={() => choose(q, o.id)}
                      disabled={busy}
                    />
                    {o.label}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <Button onClick={submit} disabled={busy} loading={busy}>
            Valider mes réponses
          </Button>
        </>
      )}
    </div>
  );
}
