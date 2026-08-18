"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge, Button } from "@titan-kinetic/ui";
import { markLessonCompleteAction } from "../../_actions/progress";

type Question = {
  id: string;
  statement: string;
  kind: string;
  options: { id: string; label: string }[];
};

type StartResponse = {
  attemptId: string;
  passThreshold: number;
  timeLimitMinutes: number | null;
  questions: Question[];
};

type SubmitResult = {
  score: number;
  maxScore: number;
  passed: boolean;
  passThreshold: number;
  results: { questionId: string; isCorrect: boolean; correctOptionIds: string[]; explanation: string | null }[];
};

export function QuizRunner({ lessonId, enrollmentId }: { lessonId: string; enrollmentId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<StartResponse | null>(null);
  const [answers, setAnswers] = useState<Map<string, Set<string>>>(new Map());
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    supabase.functions
      .invoke<StartResponse | { error: string }>("quiz-attempt", { body: { action: "start", lessonId } })
      .then(({ data, error: invokeError }) => {
        if (cancelled) return;
        if (invokeError || !data || "error" in data) {
          setError((data as { error?: string })?.error ?? invokeError?.message ?? "Impossible de démarrer le QCM.");
        } else {
          setAttempt(data);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [started, lessonId]);

  function toggleAnswer(questionId: string, optionId: string, multi: boolean) {
    setAnswers((prev) => {
      const next = new Map(prev);
      const current = new Set(next.get(questionId) ?? []);
      if (multi) {
        if (current.has(optionId)) current.delete(optionId);
        else current.add(optionId);
      } else {
        current.clear();
        current.add(optionId);
      }
      next.set(questionId, current);
      return next;
    });
  }

  async function handleSubmit() {
    if (!attempt) return;
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const payload = {
      attemptId: attempt.attemptId,
      answers: attempt.questions.map((q) => ({
        questionId: q.id,
        selectedOptionIds: [...(answers.get(q.id) ?? [])],
      })),
    };
    const { data, error: invokeError } = await supabase.functions.invoke<SubmitResult | { error: string }>(
      "quiz-attempt",
      { body: { action: "submit", ...payload } },
    );
    setSubmitting(false);
    if (invokeError || !data || "error" in data) {
      setError((data as { error?: string })?.error ?? invokeError?.message ?? "Échec de l'envoi.");
      return;
    }
    setResult(data);
    if (data.passed) {
      await markLessonCompleteAction(undefined, (() => {
        const fd = new FormData();
        fd.set("enrollmentId", enrollmentId);
        fd.set("lessonId", lessonId);
        return fd;
      })());
    }
  }

  if (!started) {
    return (
      <Button variant="primary" onClick={() => setStarted(true)}>
        Commencer le QCM
      </Button>
    );
  }

  if (loading) {
    return <p className="font-body text-sm text-foreground-muted">Chargement du QCM…</p>;
  }

  if (error) {
    return <p className="font-body text-sm text-error">{error}</p>;
  }

  if (result) {
    const pct = result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0;
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Badge variant={result.passed ? "success" : "error"}>
            {result.passed ? "Réussi" : "Non validé"}
          </Badge>
          <p className="font-body text-sm text-foreground">
            {result.score}/{result.maxScore} points ({pct}%, seuil {result.passThreshold}%)
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {attempt?.questions.map((q) => {
            const r = result.results.find((res) => res.questionId === q.id);
            return (
              <div key={q.id} className="rounded-DEFAULT border border-border p-3">
                <p className="font-body text-sm font-semibold text-foreground">{q.statement}</p>
                <p className={`font-body text-xs ${r?.isCorrect ? "text-success" : "text-error"}`}>
                  {r?.isCorrect ? "Bonne réponse" : "Réponse incorrecte"}
                </p>
                {r?.explanation && (
                  <p className="mt-1 font-body text-xs text-foreground-muted">{r.explanation}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (!attempt) return null;

  return (
    <div className="flex flex-col gap-6">
      {attempt.timeLimitMinutes && (
        <p className="font-body text-xs text-foreground-muted">Durée limite : {attempt.timeLimitMinutes} min</p>
      )}
      {attempt.questions.map((q, index) => {
        const multi = q.kind === "qcm";
        return (
          <div key={q.id} className="flex flex-col gap-2">
            <p className="font-body text-sm font-semibold text-foreground">
              {index + 1}. {q.statement}
            </p>
            <div className="flex flex-col gap-1.5 pl-2">
              {q.options.map((option) => (
                <label key={option.id} className="flex items-center gap-2 font-body text-sm text-foreground">
                  <input
                    type={multi ? "checkbox" : "radio"}
                    name={q.id}
                    checked={(answers.get(q.id) ?? new Set()).has(option.id)}
                    onChange={() => toggleAnswer(q.id, option.id, multi)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>
        );
      })}
      <div>
        <Button variant="primary" onClick={handleSubmit} loading={submitting} disabled={submitting}>
          Valider le QCM
        </Button>
      </div>
    </div>
  );
}
