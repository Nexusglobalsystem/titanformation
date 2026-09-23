import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { evaluateCertificationEligibility } from "../../lib/certification";

// Équivalent RN de apps/web/.../formations/[enrollmentId]/certificat/page.tsx
// — un certificat déjà délivré est un document historique immuable (jamais
// réévalué après coup) ; seule une première demande passe par la
// vérification d'éligibilité, avant insertion.
export function useCertificate(enrollmentId: string) {
  return useQuery({
    queryKey: ["certificate", enrollmentId],
    queryFn: async () => {
      const { data: enrollment } = await supabase
        .from("enrollments")
        .select(
          "id, status, sessions(reference, starts_on, ends_on, trainings(id, title, duration_hours)), profiles(first_name, last_name)",
        )
        .eq("id", enrollmentId)
        .maybeSingle();

      if (!enrollment || !["confirme", "termine"].includes(enrollment.status)) return null;
      const training = enrollment.sessions?.trainings;
      if (!training) return null;

      let certificate = (
        await supabase
          .from("certificates")
          .select("certificate_number, issued_at")
          .eq("enrollment_id", enrollmentId)
          .maybeSingle()
      ).data;

      if (!certificate) {
        const eligibility = await evaluateCertificationEligibility(supabase, enrollmentId, training.id);
        if (!eligibility.eligible) {
          return { training, learner: enrollment.profiles, certificate: null, reasons: eligibility.reasons };
        }

        const certificateNumber = `CERT-${new Date().getFullYear()}-${enrollmentId.slice(0, 8).toUpperCase()}`;
        const { data: created } = await supabase
          .from("certificates")
          .insert({ enrollment_id: enrollmentId, certificate_number: certificateNumber })
          .select("certificate_number, issued_at")
          .single();
        certificate = created ?? null;
      }

      return { training, learner: enrollment.profiles, certificate, reasons: [] as string[] };
    },
  });
}
