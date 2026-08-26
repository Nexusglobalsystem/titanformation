import { getOrganizationSettings } from "../_lib/getOrganizationSettings";
import { LegalSection, LegalField } from "../_components/LegalSection";

export const metadata = { title: "Politique de confidentialité — Titan Kinetic" };

export default async function ConfidentialitePage() {
  const settings = await getOrganizationSettings();

  return (
    <>
      <h1 className="mb-10 font-display text-3xl font-bold text-foreground">
        Politique de confidentialité
      </h1>

      <p className="mb-10 font-body text-sm leading-relaxed text-foreground-muted">
        Cette page décrit comment Titan Kinetic collecte, utilise et protège les données
        personnelles des utilisateurs de la plateforme, conformément au Règlement général sur la
        protection des données (RGPD).
      </p>

      <LegalSection title="Responsable du traitement">
        {settings?.legal_name || settings?.contact_email ? (
          <>
            <LegalField label="Raison sociale" value={settings?.legal_name} />
            <LegalField label="Contact" value={settings?.contact_email} />
          </>
        ) : (
          <p>Titan Kinetic.</p>
        )}
      </LegalSection>

      <LegalSection title="Données collectées">
        <p>
          Identité et coordonnées (nom, prénom, email), données de suivi pédagogique
          (progression dans les modules, résultats aux QCM, présence aux sessions signée
          électroniquement), et, pour les comptes entreprise, les données liées aux salariés
          inscrits.
        </p>
      </LegalSection>

      <LegalSection title="Finalités">
        <p>
          Gestion des inscriptions et de la relation contractuelle, suivi pédagogique et délivrance
          des certifications, respect des obligations de conservation liées à la certification
          Qualiopi (preuves de présence et d&apos;assiduité), et facturation.
        </p>
      </LegalSection>

      <LegalSection title="Durée de conservation">
        <p>
          Les données sont conservées le temps nécessaire aux finalités décrites ci-dessus, ainsi
          qu&apos;aux durées légales de conservation applicables aux organismes de formation
          certifiés Qualiopi.
        </p>
      </LegalSection>

      <LegalSection title="Hébergement et sous-traitants">
        <p>Base de données et authentification : Supabase (Union européenne, région eu-west-3, Paris).</p>
        <p>Hébergement applicatif : Vercel Inc.</p>
        <p>Classes virtuelles : LiveKit.</p>
      </LegalSection>

      <LegalSection title="Vos droits">
        <p>
          Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification,
          d&apos;effacement, d&apos;opposition et de portabilité sur vos données, ainsi que du
          droit d&apos;introduire une réclamation auprès de la CNIL.
        </p>
        {settings?.contact_email && (
          <p>
            Pour exercer ces droits, contactez :{" "}
            <span className="font-medium text-foreground">{settings.contact_email}</span>
          </p>
        )}
      </LegalSection>
    </>
  );
}
