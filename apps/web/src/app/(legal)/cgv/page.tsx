import Link from "next/link";
import { getOrganizationSettings } from "../_lib/getOrganizationSettings";
import { LegalSection } from "../_components/LegalSection";

export const metadata = { title: "Conditions générales de vente — Titan Kinetic" };

export default async function CgvPage() {
  const settings = await getOrganizationSettings();
  const withdrawalDays = settings?.withdrawal_period_days ?? 14;

  return (
    <>
      <h1 className="mb-10 font-display text-3xl font-bold text-foreground">
        Conditions générales de vente
      </h1>

      <LegalSection title="Objet">
        <p>
          Les présentes conditions régissent la vente des formations professionnelles proposées
          par {settings?.legal_name || "Titan Kinetic"}, décrites sur le{" "}
          <Link href="/formations" className="text-accent-text hover:underline">
            catalogue
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Tarifs">
        <p>
          Les prix applicables sont ceux affichés sur la fiche de chaque formation au moment de
          l&apos;inscription, exprimés hors taxes (HT).
        </p>
      </LegalSection>

      {settings?.payment_terms && (
        <LegalSection title="Modalités de paiement">
          <p>{settings.payment_terms}</p>
        </LegalSection>
      )}

      <LegalSection title="Délai de rétractation">
        <p>
          Le client dispose d&apos;un délai de rétractation de {withdrawalDays} jours à compter de
          la confirmation de son inscription pour exercer son droit de rétractation, sauf
          disposition contraire prévue pour les formations professionnelles financées par
          l&apos;entreprise ou un organisme tiers.
        </p>
      </LegalSection>

      {settings?.cancellation_policy && (
        <LegalSection title="Annulation et report">
          <p>{settings.cancellation_policy}</p>
        </LegalSection>
      )}

      <LegalSection title="Responsabilité">
        <p>
          {settings?.legal_name || "Titan Kinetic"} met en œuvre les moyens nécessaires à la bonne
          exécution des formations. Sa responsabilité ne saurait être engagée en cas
          d&apos;interruption liée à un cas de force majeure.
        </p>
      </LegalSection>

      <LegalSection title="Droit applicable">
        <p>
          Les présentes conditions sont soumises au droit français. Tout litige relève de la
          compétence des tribunaux français.
        </p>
      </LegalSection>
    </>
  );
}
