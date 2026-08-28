import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tables } from "@titan-kinetic/core/database.types";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../hooks/useSession";

export interface TrainingDetail {
  training: Tables<"trainings">;
  imageUrl: string | null;
  modules: Pick<Tables<"modules">, "id" | "title" | "description">[];
  session: Tables<"sessions"> | null;
  existingEnrollment: { status: string } | null;
}

// Équivalent RN des requêtes parallélisées de
// apps/web/src/app/formations/[slug]/page.tsx — mêmes tables/policies RLS
// (le client mobile s'authentifie sur le même projet Supabase que le web,
// les policies s'appliquent identiquement). "Inscrire un salarié"
// (responsable d'entreprise) volontairement hors périmètre v1 mobile —
// l'espace entreprise reste desktop-web.
export function useTrainingDetail(slug: string) {
  const { session: authSession } = useSession();
  const userId = authSession?.user.id ?? null;

  return useQuery({
    queryKey: ["training-detail", slug, userId],
    queryFn: async (): Promise<TrainingDetail | null> => {
      const { data: training } = await supabase
        .from("trainings")
        .select("*")
        .eq("slug", slug)
        .eq("status", "publiee")
        .maybeSingle();

      if (!training) return null;

      const imageUrl = training.image_path
        ? supabase.storage.from("training-images").getPublicUrl(training.image_path).data.publicUrl
        : null;

      const [{ data: modules }, { data: trainingSession }] = await Promise.all([
        supabase
          .from("modules")
          .select("id, title, description")
          .eq("training_id", training.id)
          .order("position", { ascending: true }),
        supabase
          .from("sessions")
          .select("*")
          .eq("training_id", training.id)
          .eq("status", "ouverte")
          .order("starts_on", { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);

      let existingEnrollment: { status: string } | null = null;
      if (userId && trainingSession) {
        const { data } = await supabase
          .from("enrollments")
          .select("status")
          .eq("session_id", trainingSession.id)
          .eq("learner_id", userId)
          .maybeSingle();
        existingEnrollment = data;
      }

      return { training, imageUrl, modules: modules ?? [], session: trainingSession, existingEnrollment };
    },
  });
}

// Équivalent RN de enrollAction — insert direct, même code de conflit
// (23505 = déjà préinscrit, traité comme un succès idempotent, pas une
// erreur). L'email de confirmation (Resend) n'est PAS envoyé depuis le
// mobile : la clé API est service-only, ne doit jamais partir dans un
// bundle client — la ligne en base est identique dans les deux cas.
export function useEnroll(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, learnerId }: { sessionId: string; learnerId: string }) => {
      const { error } = await supabase.from("enrollments").insert({
        session_id: sessionId,
        learner_id: learnerId,
        status: "preinscrit",
        funding: "particulier_cb",
      });
      if (error && error.code !== "23505") {
        throw new Error("Impossible d'enregistrer la préinscription : " + error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-detail", slug] });
    },
  });
}
