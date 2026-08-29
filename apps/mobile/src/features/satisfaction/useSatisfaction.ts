import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

export type SatisfactionQuestion = { id: string; type: "note" | "texte"; label: string };

// Équivalent RN de apps/web/.../formations/[enrollmentId]/satisfaction/page.tsx.
export function useSatisfaction(enrollmentId: string) {
  return useQuery({
    queryKey: ["satisfaction", enrollmentId],
    queryFn: async () => {
      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("id, status, sessions(trainings(id, title))")
        .eq("id", enrollmentId)
        .maybeSingle();

      if (!enrollment || !["confirme", "termine"].includes(enrollment.status)) return null;
      const training = enrollment.sessions?.trainings;
      if (!training) return null;

      const { data: form } = await supabase
        .from("evaluation_forms")
        .select("id, title, schema")
        .eq("training_id", training.id)
        .eq("kind", "satisfaction_chaud")
        .eq("is_active", true)
        .maybeSingle();

      if (!form) return null;

      const { data: existingResponse } = await supabase
        .from("evaluation_responses")
        .select("id")
        .eq("form_id", form.id)
        .eq("enrollment_id", enrollmentId)
        .maybeSingle();

      const schema = form.schema as { questions?: SatisfactionQuestion[] } | null;

      return {
        trainingTitle: training.title,
        form,
        questions: schema?.questions ?? [],
        alreadyAnswered: Boolean(existingResponse),
      };
    },
  });
}

// Équivalent RN de submitSatisfactionAction — même moyenne des questions
// de type "note", même forme de payload (answers en JSON, score moyen).
export function useSubmitSatisfaction(enrollmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      formId: string;
      respondentId: string;
      questions: SatisfactionQuestion[];
      values: Record<string, string | number>;
    }) => {
      const answers: Record<string, string | number> = {};
      const scores: number[] = [];

      for (const q of input.questions) {
        const raw = input.values[q.id];
        if (q.type === "note") {
          const value = Number(raw);
          if (Number.isFinite(value)) {
            answers[q.id] = value;
            scores.push(value);
          }
        } else if (typeof raw === "string" && raw.trim()) {
          answers[q.id] = raw.trim();
        }
      }

      const score = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

      const { error } = await supabase.from("evaluation_responses").insert({
        form_id: input.formId,
        enrollment_id: enrollmentId,
        respondent_id: input.respondentId,
        answers,
        score,
      });
      if (error) {
        throw new Error("Impossible d'enregistrer vos réponses.");
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["satisfaction", enrollmentId] }),
  });
}
