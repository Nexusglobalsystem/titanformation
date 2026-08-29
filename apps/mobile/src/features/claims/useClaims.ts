import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

// Équivalent RN de apps/web/src/app/apprenant/reclamations/page.tsx +
// _actions/claims.ts.
export function useClaims(userId: string | undefined) {
  return useQuery({
    queryKey: ["claims", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data } = await supabase
        .from("claims")
        .select("id, subject, body, status, resolution, submitted_at")
        .eq("submitted_by", userId!)
        .order("submitted_at", { ascending: false });
      return data ?? [];
    },
  });
}

export function useSubmitClaim(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { subject: string; body: string }) => {
      const { error } = await supabase.from("claims").insert({
        submitted_by: userId!,
        subject: input.subject.trim(),
        body: input.body.trim(),
      });
      if (error) {
        throw new Error("Impossible d'envoyer la réclamation : " + error.message);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["claims", userId] }),
  });
}
