import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

// Équivalent RN de signAttendanceAction — signature_ip volontairement
// null (pas d'IP fiable côté mobile sans appel externe, champ déjà
// nullable/informatif côté web aussi).
export function useSignAttendance(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (attendanceId: string) => {
      const { error } = await supabase
        .from("attendances")
        .update({ signed_at: new Date().toISOString(), present: true, signature_ip: null })
        .eq("id", attendanceId);
      if (error) {
        throw new Error("Impossible de signer : " + error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", userId] });
    },
  });
}
