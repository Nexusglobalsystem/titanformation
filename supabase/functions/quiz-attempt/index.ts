import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type StartBody = { action: "start"; lessonId: string };
type SubmitBody = {
  action: "submit";
  attemptId: string;
  answers: { questionId: string; selectedOptionIds: string[] }[];
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Authentification requise." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: "Session invalide." }, 401);
  const userId = userData.user.id;

  let body: StartBody | SubmitBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Corps de requête invalide." }, 400);
  }

  if (body.action === "start") {
    const { lessonId } = body;
    if (!lessonId) return json({ error: "lessonId requis." }, 400);

    const { data: lesson } = await admin
      .from("lessons")
      .select("id, type, module_id, modules(training_id)")
      .eq("id", lessonId)
      .maybeSingle();

    if (!lesson || lesson.type !== "quiz") return json({ error: "Leçon QCM introuvable." }, 404);
    const trainingId = (lesson.modules as { training_id: string } | null)?.training_id;
    if (!trainingId) return json({ error: "Formation introuvable." }, 404);

    const { data: quiz } = await admin
      .from("quizzes")
      .select("id, pass_threshold, max_attempts, time_limit_minutes, shuffle_questions, questions_drawn")
      .eq("lesson_id", lessonId)
      .maybeSingle();
    if (!quiz) return json({ error: "Ce QCM n'est pas encore configuré." }, 404);

    const { data: enrollments } = await admin
      .from("enrollments")
      .select("id, status, sessions(training_id)")
      .eq("learner_id", userId)
      .in("status", ["confirme", "termine"]);

    const enrollment = (enrollments ?? []).find(
      (e) => (e.sessions as { training_id: string } | null)?.training_id === trainingId,
    );
    if (!enrollment) return json({ error: "Vous n'êtes pas inscrit à cette formation." }, 403);

    const { data: existingAttempts } = await admin
      .from("quiz_attempts")
      .select("id, attempt_number, submitted_at")
      .eq("quiz_id", quiz.id)
      .eq("enrollment_id", enrollment.id)
      .order("attempt_number", { ascending: false });

    const unsubmitted = (existingAttempts ?? []).find((a) => !a.submitted_at);
    const submittedCount = (existingAttempts ?? []).filter((a) => a.submitted_at).length;

    let attemptId: string;
    if (unsubmitted) {
      attemptId = unsubmitted.id;
    } else {
      if (quiz.max_attempts && submittedCount >= quiz.max_attempts) {
        return json({ error: "Nombre maximal de tentatives atteint pour ce QCM." }, 403);
      }
      const nextNumber = (existingAttempts?.[0]?.attempt_number ?? 0) + 1;
      const { data: newAttempt, error: attemptError } = await admin
        .from("quiz_attempts")
        .insert({ quiz_id: quiz.id, enrollment_id: enrollment.id, attempt_number: nextNumber })
        .select("id")
        .single();
      if (attemptError || !newAttempt) return json({ error: "Impossible de démarrer la tentative." }, 500);
      attemptId = newAttempt.id;
    }

    const { data: items } = await admin
      .from("quiz_items")
      .select("position, points, questions(id, statement, kind, question_options(id, label, position))")
      .eq("quiz_id", quiz.id)
      .order("position", { ascending: true });

    let questions = (items ?? [])
      .map((item) => item.questions)
      .filter((q): q is NonNullable<typeof q> => Boolean(q))
      .map((q) => ({
        id: q.id,
        statement: q.statement,
        kind: q.kind,
        options: [...(q.question_options ?? [])]
          .sort((a, b) => a.position - b.position)
          .map((o) => ({ id: o.id, label: o.label })),
      }));

    if (quiz.questions_drawn && quiz.questions_drawn < questions.length) {
      questions = shuffle(questions).slice(0, quiz.questions_drawn);
    }
    if (quiz.shuffle_questions) {
      questions = shuffle(questions);
    }

    return json({
      attemptId,
      passThreshold: quiz.pass_threshold,
      timeLimitMinutes: quiz.time_limit_minutes,
      questions,
    });
  }

  if (body.action === "submit") {
    const { attemptId, answers } = body;
    if (!attemptId || !Array.isArray(answers)) return json({ error: "Requête invalide." }, 400);

    const { data: attempt } = await admin
      .from("quiz_attempts")
      .select("id, quiz_id, enrollment_id, submitted_at")
      .eq("id", attemptId)
      .maybeSingle();
    if (!attempt) return json({ error: "Tentative introuvable." }, 404);
    if (attempt.submitted_at) return json({ error: "Cette tentative a déjà été soumise." }, 409);

    const { data: enrollment } = await admin
      .from("enrollments")
      .select("id, learner_id")
      .eq("id", attempt.enrollment_id)
      .maybeSingle();
    if (!enrollment || enrollment.learner_id !== userId) {
      return json({ error: "Cette tentative ne vous appartient pas." }, 403);
    }

    const { data: quiz } = await admin
      .from("quizzes")
      .select("id, pass_threshold")
      .eq("id", attempt.quiz_id)
      .single();

    const { data: items } = await admin
      .from("quiz_items")
      .select("points, questions(id, explanation, question_options(id, is_correct))")
      .eq("quiz_id", attempt.quiz_id);

    const answerByQuestion = new Map(answers.map((a) => [a.questionId, new Set(a.selectedOptionIds ?? [])]));

    let score = 0;
    let maxScore = 0;
    const results: {
      questionId: string;
      isCorrect: boolean;
      correctOptionIds: string[];
      explanation: string | null;
    }[] = [];
    const answerRows: {
      attempt_id: string;
      question_id: string;
      selected_option_ids: string[];
      is_correct: boolean;
      points_awarded: number;
    }[] = [];

    for (const item of items ?? []) {
      const question = item.questions;
      if (!question) continue;
      maxScore += item.points;

      const correctOptionIds = (question.question_options ?? [])
        .filter((o) => o.is_correct)
        .map((o) => o.id);
      const correctSet = new Set(correctOptionIds);
      const selected = answerByQuestion.get(question.id) ?? new Set<string>();
      const isCorrect =
        selected.size === correctSet.size && [...selected].every((id) => correctSet.has(id));
      const pointsAwarded = isCorrect ? item.points : 0;
      score += pointsAwarded;

      answerRows.push({
        attempt_id: attempt.id,
        question_id: question.id,
        selected_option_ids: [...selected],
        is_correct: isCorrect,
        points_awarded: pointsAwarded,
      });
      results.push({
        questionId: question.id,
        isCorrect,
        correctOptionIds,
        explanation: question.explanation,
      });
    }

    if (answerRows.length > 0) {
      await admin.from("quiz_answers").insert(answerRows);
    }

    const passed = maxScore > 0 ? (score / maxScore) * 100 >= (quiz?.pass_threshold ?? 70) : false;

    await admin
      .from("quiz_attempts")
      .update({ score, max_score: maxScore, passed, submitted_at: new Date().toISOString() })
      .eq("id", attempt.id);

    return json({ score, maxScore, passed, passThreshold: quiz?.pass_threshold ?? 70, results });
  }

  return json({ error: "Action inconnue." }, 400);
});
