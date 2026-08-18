"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function submitSatisfactionAction(formData: FormData) {
  const formId = formData.get("formId");
  const enrollmentId = formData.get("enrollmentId");
  const questionIds = formData.getAll("questionIds").map(String);

  if (typeof formId !== "string" || typeof enrollmentId !== "string") {
    redirect(`/apprenant/formations/${enrollmentId}?error=formulaire`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const answers: Record<string, string | number> = {};
  const scores: number[] = [];

  for (const questionId of questionIds) {
    const kind = formData.get(`kind_${questionId}`);
    const raw = formData.get(`answer_${questionId}`);
    if (kind === "note") {
      const value = Number(raw);
      if (Number.isFinite(value)) {
        answers[questionId] = value;
        scores.push(value);
      }
    } else if (typeof raw === "string" && raw.trim()) {
      answers[questionId] = raw.trim();
    }
  }

  const score = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

  const { error } = await supabase.from("evaluation_responses").insert({
    form_id: formId,
    enrollment_id: enrollmentId,
    respondent_id: user!.id,
    answers,
    score,
  });

  if (error) {
    redirect(`/apprenant/formations/${enrollmentId}?error=satisfaction`);
  }

  redirect(`/apprenant/formations/${enrollmentId}?satisfaction=merci`);
}
