"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export type GenerateQuizState = { error?: string; success?: string } | undefined;

const QUESTION_KINDS = ["qcu", "qcm", "vrai_faux"] as const;

const generatedQuestionSchema = z
  .object({
    statement: z.string().min(1),
    kind: z.enum(QUESTION_KINDS),
    options: z.array(z.object({ label: z.string().min(1), is_correct: z.boolean() })).min(2).max(6),
    explanation: z.string().optional(),
  })
  .refine((q) => q.options.some((o) => o.is_correct), { message: "Au moins une bonne réponse requise." })
  .refine((q) => q.kind !== "qcu" || q.options.filter((o) => o.is_correct).length === 1, {
    message: "QCU : exactement une bonne réponse.",
  });

const generatedResponseSchema = z.object({ questions: z.array(generatedQuestionSchema).min(1) });

const QUIZ_TOOL = {
  name: "submit_quiz_questions",
  description: "Soumet la liste de questions de QCM générées.",
  input_schema: {
    type: "object" as const,
    properties: {
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            statement: { type: "string", description: "Énoncé de la question, en français." },
            kind: { type: "string", enum: QUESTION_KINDS },
            options: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  label: { type: "string" },
                  is_correct: { type: "boolean" },
                },
                required: ["label", "is_correct"],
              },
            },
            explanation: { type: "string", description: "Courte explication pédagogique de la bonne réponse." },
          },
          required: ["statement", "kind", "options"],
        },
      },
    },
    required: ["questions"],
  },
};

// Génère un jeu de questions via Claude (tool-use forcé pour une sortie
// strictement structurée), validées avec zod, puis insérées avec exactement
// le même enchaînement que createQuestionAction (questions -> question_options
// -> quiz_items) — les questions générées sont donc éditables/supprimables
// comme des questions manuelles, sans nouvelle notion de brouillon.
export async function generateQuizQuestionsAction(
  _prev: GenerateQuizState,
  formData: FormData,
): Promise<GenerateQuizState> {
  const quizId = formData.get("quizId");
  const lessonId = formData.get("lessonId");
  const trainingId = formData.get("trainingId");
  const nextPosition = Number(formData.get("nextPosition") ?? 0);
  const countRaw = Number(formData.get("count") ?? 5);
  const topicRaw = formData.get("topic");
  const topic = typeof topicRaw === "string" && topicRaw.trim() ? topicRaw.trim() : null;

  if (typeof quizId !== "string" || typeof lessonId !== "string" || typeof trainingId !== "string") {
    return { error: "Formulaire invalide." };
  }

  const count = Number.isFinite(countRaw) ? Math.min(10, Math.max(1, Math.round(countRaw))) : 5;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { error: "Génération IA non configurée (clé API manquante)." };
  }

  const supabase = await createClient();

  const [{ data: lesson }, { data: training }] = await Promise.all([
    supabase.from("lessons").select("title").eq("id", lessonId).maybeSingle(),
    supabase.from("trainings").select("title, summary, objectives").eq("id", trainingId).maybeSingle(),
  ]);

  if (!training) return { error: "Formation introuvable." };

  const prompt = `Tu es concepteur pédagogique. Génère ${count} question(s) de quiz en français pour évaluer les acquis d'une leçon de formation professionnelle.

Formation : ${training.title}
Résumé : ${training.summary}
Objectifs : ${training.objectives}
Leçon évaluée : ${lesson?.title ?? "Évaluation"}
${topic ? `Sujet à privilégier : ${topic}` : ""}

Consignes :
- Mélange des types qcu (une seule bonne réponse), qcm (plusieurs bonnes réponses possibles) et vrai_faux selon ce qui convient le mieux à chaque question.
- Pour vrai_faux : exactement deux options, labellées exactement "Vrai" et "Faux".
- Pour qcu/qcm : 3 à 4 options plausibles et distinctes.
- Chaque question a une courte explication pédagogique de la bonne réponse.
- Questions précises, non ambiguës, directement liées au contenu de la formation ci-dessus.`;

  let generated: z.infer<typeof generatedResponseSchema>;
  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 4096,
      tools: [QUIZ_TOOL],
      tool_choice: { type: "tool", name: "submit_quiz_questions" },
      messages: [{ role: "user", content: prompt }],
    });

    const toolUse = response.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return { error: "La génération IA n'a renvoyé aucune question exploitable." };
    }

    const parsed = generatedResponseSchema.safeParse(toolUse.input);
    if (!parsed.success) {
      return { error: "La génération IA a renvoyé un format inattendu." };
    }
    generated = parsed.data;
  } catch (err) {
    return { error: "Échec de la génération IA : " + (err instanceof Error ? err.message : String(err)) };
  }

  let position = nextPosition;
  for (const q of generated.questions) {
    const { data: question, error: questionError } = await supabase
      .from("questions")
      .insert({ training_id: trainingId, statement: q.statement, kind: q.kind, explanation: q.explanation ?? null })
      .select("id")
      .single();

    if (questionError || !question) {
      return { error: "Échec de l'enregistrement d'une question générée : " + (questionError?.message ?? "") };
    }

    const { error: optionsError } = await supabase.from("question_options").insert(
      q.options.map((o, index) => ({ question_id: question.id, label: o.label, is_correct: o.is_correct, position: index })),
    );
    if (optionsError) {
      return { error: "Question générée mais échec de l'enregistrement des options : " + optionsError.message };
    }

    const { error: itemError } = await supabase
      .from("quiz_items")
      .insert({ quiz_id: quizId, question_id: question.id, position, points: 1 });
    if (itemError) {
      return { error: "Question générée mais échec du rattachement au QCM : " + itemError.message };
    }

    position += 1;
  }

  revalidatePath(`/admin/formations/${trainingId}/lecons/${lessonId}/quiz`);
  return { success: `${generated.questions.length} question(s) générée(s).` };
}

export async function deleteQuestionAction(formData: FormData): Promise<void> {
  const questionId = formData.get("questionId");
  const trainingId = formData.get("trainingId");
  const lessonId = formData.get("lessonId");
  if (typeof questionId !== "string" || typeof trainingId !== "string" || typeof lessonId !== "string") return;

  const supabase = await createClient();
  await supabase.from("questions").delete().eq("id", questionId);
  revalidatePath(`/admin/formations/${trainingId}/lecons/${lessonId}/quiz`);
}
