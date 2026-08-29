import { useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useQuizPage } from "../../../../src/features/quiz/useQuizPage";
import { useMarkLessonComplete } from "../../../../src/features/lessons/useLesson";
import { supabase } from "../../../../src/lib/supabase";
import { Badge } from "../../../../src/components/Badge";
import { SubmitButton } from "../../../../src/components/form/SubmitButton";

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

// Équivalent RN de .../quiz/[lessonId]/page.tsx + QuizRunner.tsx. Le
// déroulé (démarrer/répondre/valider) appelle directement la même Edge
// Function "quiz-attempt" que le web, inchangée — c'est déjà une Edge
// Function côté web (pas une Server Action), donc directement appelable
// depuis le client RN ; seul l'état React (sélection, affichage des
// résultats) est porté vers des primitives RN.
export default function QuizScreen() {
  const { enrollmentId, lessonId } = useLocalSearchParams<{ enrollmentId: string; lessonId: string }>();
  const { data, isLoading } = useQuizPage(enrollmentId ?? "", lessonId ?? "");

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (!data || data.isLocked) {
    return (
      <View className="flex-1 items-center justify-center gap-2 bg-background px-gutter">
        <Text className="font-body text-foreground-muted">Quiz indisponible.</Text>
      </View>
    );
  }

  const { trainingTitle, lesson, quiz, submittedAttempts, hasPassed, attemptsExhausted } = data;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-6 px-gutter py-6">
      <View className="gap-1">
        <Text className="font-display text-xl font-bold text-foreground">{lesson.title}</Text>
        <Text className="font-body text-xs text-foreground-muted">{trainingTitle}</Text>
      </View>

      {!quiz ? (
        <Text className="font-body text-sm text-foreground-muted">Ce QCM n&apos;est pas encore disponible.</Text>
      ) : (
        <>
          {submittedAttempts.length > 0 && (
            <View className="gap-2">
              <Text className="font-mono-label text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                Tentatives précédentes
              </Text>
              {submittedAttempts.map((a) => (
                <View
                  key={a.attempt_number}
                  className="flex-row items-center justify-between rounded-DEFAULT border border-border p-3"
                >
                  <Text className="font-body text-sm text-foreground">
                    Tentative {a.attempt_number} · {a.score}/{a.max_score} points
                  </Text>
                  <Badge variant={a.passed ? "success" : "error"}>{a.passed ? "Réussi" : "Non validé"}</Badge>
                </View>
              ))}
            </View>
          )}

          {hasPassed ? (
            <Text className="font-body text-sm text-success">Vous avez déjà validé ce QCM.</Text>
          ) : attemptsExhausted ? (
            <Text className="font-body text-sm text-error">
              Nombre maximal de tentatives atteint ({quiz.max_attempts}).
            </Text>
          ) : (
            <QuizRunner lessonId={lessonId ?? ""} enrollmentId={enrollmentId ?? ""} />
          )}
        </>
      )}
    </ScrollView>
  );
}

function QuizRunner({ lessonId, enrollmentId }: { lessonId: string; enrollmentId: string }) {
  const markComplete = useMarkLessonComplete(enrollmentId);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<StartResponse | null>(null);
  const [answers, setAnswers] = useState<Map<string, Set<string>>>(new Map());
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  async function handleStart() {
    setStarted(true);
    setLoading(true);
    setError(null);
    const { data, error: invokeError } = await supabase.functions.invoke<StartResponse | { error: string }>(
      "quiz-attempt",
      { body: { action: "start", lessonId } },
    );
    if (invokeError || !data || "error" in data) {
      setError((data as { error?: string } | undefined)?.error ?? invokeError?.message ?? "Impossible de démarrer le QCM.");
    } else {
      setAttempt(data);
    }
    setLoading(false);
  }

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
      setError((data as { error?: string } | undefined)?.error ?? invokeError?.message ?? "Échec de l'envoi.");
      return;
    }
    setResult(data);
    if (data.passed) {
      markComplete.mutate(lessonId);
    }
  }

  if (!started) {
    return <SubmitButton onPress={handleStart}>Commencer le QCM</SubmitButton>;
  }

  if (loading) {
    return <Text className="font-body text-sm text-foreground-muted">Chargement du QCM…</Text>;
  }

  if (error) {
    return <Text className="font-body text-sm text-error">{error}</Text>;
  }

  if (result) {
    const pct = result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0;
    return (
      <View className="gap-4">
        <View className="flex-row items-center gap-3">
          <Badge variant={result.passed ? "success" : "error"}>{result.passed ? "Réussi" : "Non validé"}</Badge>
          <Text className="font-body text-sm text-foreground">
            {result.score}/{result.maxScore} points ({pct}%, seuil {result.passThreshold}%)
          </Text>
        </View>
        <View className="gap-3">
          {attempt?.questions.map((q) => {
            const r = result.results.find((res) => res.questionId === q.id);
            return (
              <View key={q.id} className="rounded-DEFAULT border border-border p-3">
                <Text className="font-body text-sm font-semibold text-foreground">{q.statement}</Text>
                <Text className={["font-body text-xs", r?.isCorrect ? "text-success" : "text-error"].join(" ")}>
                  {r?.isCorrect ? "Bonne réponse" : "Réponse incorrecte"}
                </Text>
                {r?.explanation && (
                  <Text className="mt-1 font-body text-xs text-foreground-muted">{r.explanation}</Text>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  }

  if (!attempt) return null;

  return (
    <View className="gap-6">
      {attempt.timeLimitMinutes && (
        <Text className="font-body text-xs text-foreground-muted">Durée limite : {attempt.timeLimitMinutes} min</Text>
      )}
      {attempt.questions.map((q, index) => {
        const multi = q.kind === "qcm";
        const selected = answers.get(q.id) ?? new Set<string>();
        return (
          <View key={q.id} className="gap-2">
            <Text className="font-body text-sm font-semibold text-foreground">
              {index + 1}. {q.statement}
            </Text>
            <View className="gap-1.5 pl-2">
              {q.options.map((option) => {
                const isSelected = selected.has(option.id);
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => toggleAnswer(q.id, option.id, multi)}
                    accessibilityRole={multi ? "checkbox" : "radio"}
                    accessibilityState={{ checked: isSelected }}
                    accessibilityLabel={option.label}
                    className="flex-row items-center gap-2 py-1"
                  >
                    <View
                      className={[
                        "h-4 w-4 items-center justify-center border",
                        multi ? "rounded-sm" : "rounded-full",
                        isSelected ? "border-accent bg-accent" : "border-border",
                      ].join(" ")}
                    >
                      {isSelected && <View className="h-2 w-2 bg-on-accent" style={multi ? undefined : { borderRadius: 9999 }} />}
                    </View>
                    <Text className="font-body text-sm text-foreground">{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
      <SubmitButton onPress={handleSubmit} loading={submitting}>
        Valider le QCM
      </SubmitButton>
    </View>
  );
}
