"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type QuizFormState = { error?: string } | undefined;

export async function createQuizAction(
  _prev: QuizFormState,
  formData: FormData,
): Promise<QuizFormState> {
  const lessonId = formData.get("lessonId");
  const trainingId = formData.get("trainingId");

  if (typeof lessonId !== "string" || typeof trainingId !== "string") {
    return { error: "Formulaire invalide." };
  }

  const passThreshold = Number(formData.get("pass_threshold") ?? 70);
  const maxAttemptsRaw = formData.get("max_attempts");
  const maxAttempts = typeof maxAttemptsRaw === "string" && maxAttemptsRaw.trim() ? Number(maxAttemptsRaw) : null;
  const timeLimitRaw = formData.get("time_limit_minutes");
  const timeLimit = typeof timeLimitRaw === "string" && timeLimitRaw.trim() ? Number(timeLimitRaw) : null;
  const shuffleQuestions = formData.get("shuffle_questions") === "on";

  const supabase = await createClient();
  const { error } = await supabase.from("quizzes").insert({
    lesson_id: lessonId,
    pass_threshold: Number.isFinite(passThreshold) ? passThreshold : 70,
    max_attempts: maxAttempts && Number.isFinite(maxAttempts) ? maxAttempts : null,
    time_limit_minutes: timeLimit && Number.isFinite(timeLimit) ? timeLimit : null,
    shuffle_questions: shuffleQuestions,
  });

  if (error) {
    return { error: "Impossible de créer le QCM : " + error.message };
  }

  revalidatePath(`/admin/formations/${trainingId}/lecons/${lessonId}/quiz`);
}

const QUESTION_KINDS = ["qcm", "qcu", "vrai_faux"] as const;

export type QuestionFormState = { error?: string } | undefined;

export async function createQuestionAction(
  _prev: QuestionFormState,
  formData: FormData,
): Promise<QuestionFormState> {
  const quizId = formData.get("quizId");
  const lessonId = formData.get("lessonId");
  const trainingId = formData.get("trainingId");
  const position = Number(formData.get("position") ?? 0);
  const statement = formData.get("statement");
  const kind = formData.get("kind");
  const explanationRaw = formData.get("explanation");

  if (
    typeof quizId !== "string" ||
    typeof lessonId !== "string" ||
    typeof trainingId !== "string" ||
    typeof statement !== "string" ||
    !statement.trim() ||
    typeof kind !== "string" ||
    !QUESTION_KINDS.includes(kind as (typeof QUESTION_KINDS)[number])
  ) {
    return { error: "Formulaire invalide." };
  }

  const explanation = typeof explanationRaw === "string" && explanationRaw.trim() ? explanationRaw.trim() : null;

  let options: { label: string; is_correct: boolean; position: number }[] = [];

  if (kind === "vrai_faux") {
    const correct = formData.get("correct_bool");
    options = [
      { label: "Vrai", is_correct: correct === "vrai", position: 0 },
      { label: "Faux", is_correct: correct === "faux", position: 1 },
    ];
  } else {
    const correctIndexes = new Set(formData.getAll("correct").map(String));
    for (let i = 1; i <= 4; i++) {
      const label = formData.get(`option_${i}`);
      if (typeof label === "string" && label.trim()) {
        options.push({ label: label.trim(), is_correct: correctIndexes.has(String(i)), position: i - 1 });
      }
    }
  }

  if (options.length < 2) {
    return { error: "Au moins deux options sont requises." };
  }
  if (!options.some((o) => o.is_correct)) {
    return { error: "Sélectionnez au moins une bonne réponse." };
  }

  const supabase = await createClient();

  const { data: question, error: questionError } = await supabase
    .from("questions")
    .insert({ training_id: trainingId, statement: statement.trim(), kind, explanation })
    .select("id")
    .single();

  if (questionError || !question) {
    return { error: "Impossible de créer la question : " + (questionError?.message ?? "") };
  }

  const { error: optionsError } = await supabase
    .from("question_options")
    .insert(options.map((o) => ({ question_id: question.id, ...o })));

  if (optionsError) {
    return { error: "Question créée mais échec de l'enregistrement des options : " + optionsError.message };
  }

  const { error: itemError } = await supabase
    .from("quiz_items")
    .insert({ quiz_id: quizId, question_id: question.id, position, points: 1 });

  if (itemError) {
    return { error: "Question créée mais échec du rattachement au QCM : " + itemError.message };
  }

  revalidatePath(`/admin/formations/${trainingId}/lecons/${lessonId}/quiz`);
}
