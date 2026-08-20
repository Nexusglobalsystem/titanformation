import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { evaluateCertificationEligibility } from "@/lib/certification";
import { PrintCertificateButton } from "../../_components/PrintCertificateButton";

export default async function CertificatPage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const { enrollmentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select(
      "id, status, sessions(reference, starts_on, ends_on, trainings(id, title, duration_hours)), profiles(first_name, last_name)",
    )
    .eq("id", enrollmentId)
    .maybeSingle();

  if (!enrollment || !["confirme", "termine"].includes(enrollment.status)) notFound();

  const training = enrollment.sessions?.trainings;
  if (!training) notFound();

  let { data: certificate } = await supabase
    .from("certificates")
    .select("certificate_number, issued_at")
    .eq("enrollment_id", enrollmentId)
    .maybeSingle();

  // Un certificat déjà délivré est un document historique immuable — jamais
  // réévalué si les conditions de la formation changent après coup. Seule
  // une première demande passe par la vérification d'éligibilité.
  if (!certificate) {
    const eligibility = await evaluateCertificationEligibility(supabase, enrollmentId, training.id);
    if (!eligibility.eligible) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center">
          <p className="font-body text-sm text-foreground-muted">Le certificat n&apos;est pas encore disponible.</p>
          <ul className="flex flex-col gap-1">
            {eligibility.reasons.map((reason) => (
              <li key={reason} className="font-body text-sm text-foreground-muted">
                {reason}
              </li>
            ))}
          </ul>
          <Link
            href={`/apprenant/formations/${enrollmentId}`}
            className="font-body text-sm text-accent-text hover:underline"
          >
            ← Retour au programme
          </Link>
        </div>
      );
    }

    const certificateNumber = `CERT-${new Date().getFullYear()}-${enrollmentId.slice(0, 8).toUpperCase()}`;
    const { data: created } = await supabase
      .from("certificates")
      .insert({ enrollment_id: enrollmentId, certificate_number: certificateNumber })
      .select("certificate_number, issued_at")
      .single();
    certificate = created;
  }

  if (!certificate) notFound();

  const learner = enrollment.profiles;
  const learnerName = `${learner?.first_name ?? ""} ${learner?.last_name ?? ""}`.trim();
  const issuedDate = new Date(certificate.issued_at).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-between border-b border-border px-6 py-4 print:hidden">
        <Link
          href={`/apprenant/formations/${enrollmentId}`}
          className="font-body text-sm text-accent-text hover:underline"
        >
          ← Retour au programme
        </Link>
        <PrintCertificateButton />
      </div>

      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="border-2 border-accent p-2 print:border-4">
          <div className="border border-border p-10 text-center sm:p-16">
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-DEFAULT bg-primary font-display text-lg font-bold text-accent">
              TK
            </div>
            <p className="font-mono-label text-xs uppercase tracking-[0.2em] text-accent-text">
              Titan Kinetic — Organisme de formation certifié Qualiopi
            </p>
            <h1 className="mt-6 font-display text-3xl font-bold text-foreground sm:text-4xl">
              Certificat de réussite
            </h1>
            <p className="mt-8 font-body text-sm text-foreground-muted">Décerné à</p>
            <p className="mt-2 font-display text-2xl font-semibold text-foreground">{learnerName}</p>
            <p className="mt-8 font-body text-sm text-foreground-muted">
              pour avoir suivi avec succès la formation
            </p>
            <p className="mt-2 font-display text-xl font-semibold text-accent-text">{training.title}</p>
            <p className="mt-2 font-body text-sm text-foreground-muted">
              {training.duration_hours} heures de formation
            </p>

            <div className="mx-auto mt-10 flex max-w-sm items-center justify-between border-t border-border pt-6 text-left">
              <div>
                <p className="font-mono-label text-[10px] uppercase text-foreground-muted">Délivré le</p>
                <p className="font-body text-sm text-foreground">{issuedDate}</p>
              </div>
              <div className="text-right">
                <p className="font-mono-label text-[10px] uppercase text-foreground-muted">N° de certificat</p>
                <p className="font-mono-label text-sm text-foreground">{certificate.certificate_number}</p>
              </div>
            </div>

            <p className="mt-10 font-body text-xs italic text-foreground-muted">
              Le responsable pédagogique — Titan Kinetic
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
