import { getOrganizationSettings, hasAnyLegalInfo } from "../_lib/getOrganizationSettings";
import { LegalSection, LegalField, IncompleteNotice } from "../_components/LegalSection";

export const metadata = { title: "Mentions légales — Titan Kinetic" };

export default async function MentionsLegalesPage() {
  const settings = await getOrganizationSettings();
  const hasEditorInfo = hasAnyLegalInfo(settings);
  const fullAddress = [settings?.address_line1, settings?.address_line2].filter(Boolean).join(", ");
  const cityLine = [settings?.postal_code, settings?.city].filter(Boolean).join(" ");

  return (
    <>
      <h1 className="mb-10 font-display text-3xl font-bold text-foreground">Mentions légales</h1>

      <p className="mb-10 font-body text-sm leading-relaxed text-foreground-muted">
        Conformément aux dispositions de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans
        l&apos;économie numérique, il est précisé aux utilisateurs du site Titan Kinetic
        l&apos;identité des différents intervenants dans le cadre de sa réalisation et de son
        suivi.
      </p>

      <LegalSection title="Éditeur du site">
        {hasEditorInfo ? (
          <>
            <LegalField label="Raison sociale" value={settings?.legal_name} />
            <LegalField label="Forme juridique" value={settings?.legal_form} />
            <LegalField label="Capital social" value={settings?.share_capital} />
            <LegalField label="SIRET" value={settings?.siret} />
            {(fullAddress || cityLine) && (
              <p>
                <span className="font-medium text-foreground">Adresse : </span>
                {[fullAddress, cityLine].filter(Boolean).join(" — ")}
              </p>
            )}
            <LegalField label="Responsable de publication" value={settings?.publication_director} />
          </>
        ) : (
          <IncompleteNotice />
        )}
      </LegalSection>

      <LegalSection title="Hébergement">
        <p>Hébergement applicatif : Vercel Inc. (vercel.com).</p>
        <p>
          Hébergement des données : Supabase, région Union européenne (eu-west-3, Paris,
          France).
        </p>
        <p>Classes virtuelles : LiveKit.</p>
      </LegalSection>

      {(settings?.contact_email || settings?.contact_phone) && (
        <LegalSection title="Contact">
          <LegalField label="Email" value={settings?.contact_email} />
          <LegalField label="Téléphone" value={settings?.contact_phone} />
        </LegalSection>
      )}

      <LegalSection title="Propriété intellectuelle">
        <p>
          L&apos;ensemble des contenus présents sur ce site (textes, structure, logo) est protégé
          par le droit d&apos;auteur. Toute reproduction, même partielle, est soumise à
          autorisation préalable.
        </p>
      </LegalSection>
    </>
  );
}
