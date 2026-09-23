import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

// Équivalent RN de apps/web/src/app/apprenant/documents/page.tsx —
// mêmes URLs signées (1h), Linking.openURL (navigateur système/lecteur
// PDF du téléphone) remplace le <a target="_blank"> du web.
export function useDocuments(userId: string | undefined) {
  return useQuery({
    queryKey: ["documents", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data: documents } = await supabase
        .from("documents")
        .select("id, type, storage_path, generated_at, enrollments(sessions(trainings(title)))")
        .order("generated_at", { ascending: false });

      return Promise.all(
        (documents ?? []).map(async (doc) => {
          const { data: signed } = await supabase.storage.from("documents").createSignedUrl(doc.storage_path, 3600);
          return { ...doc, signedUrl: signed?.signedUrl ?? null };
        }),
      );
    },
  });
}
