"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea } from "@titan-kinetic/ui";
import type { Tables } from "@titan-kinetic/core/database.types";
import { updateSettingsAction, type SettingsFormState } from "../_actions/settings";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" loading={pending}>
      Enregistrer
    </Button>
  );
}

export function SettingsForm({ settings }: { settings: Tables<"organization_settings"> | null }) {
  const [state, formAction] = useActionState<SettingsFormState, FormData>(updateSettingsAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Identité de l&apos;entreprise</CardTitle>
          <p className="font-body text-sm text-foreground-muted">
            Alimente les mentions légales publiques. Laissez vide ce que vous ne pouvez pas encore
            renseigner — la page l&apos;omettra plutôt que d&apos;afficher une information fausse.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Raison sociale" name="legalName" defaultValue={settings?.legal_name ?? ""} />
            <Input
              label="Forme juridique"
              name="legalForm"
              placeholder="SAS, SARL, EI..."
              defaultValue={settings?.legal_form ?? ""}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="SIRET" name="siret" defaultValue={settings?.siret ?? ""} />
            <Input
              label="Capital social"
              name="shareCapital"
              placeholder="Ex. 10 000 €"
              defaultValue={settings?.share_capital ?? ""}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Adresse (ligne 1)"
              name="addressLine1"
              defaultValue={settings?.address_line1 ?? ""}
            />
            <Input
              label="Adresse (ligne 2, facultatif)"
              name="addressLine2"
              defaultValue={settings?.address_line2 ?? ""}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Code postal" name="postalCode" defaultValue={settings?.postal_code ?? ""} />
            <Input label="Ville" name="city" defaultValue={settings?.city ?? ""} />
          </div>
          <Input
            label="Responsable de publication"
            name="publicationDirector"
            placeholder="Nom du gérant, président..."
            defaultValue={settings?.publication_director ?? ""}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
          <p className="font-body text-sm text-foreground-muted">
            Utilisé sur les pages légales (mentions légales, exercice des droits RGPD).
            Indépendant de l&apos;email de contact déjà affiché ailleurs sur le site.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Email de contact légal"
              name="contactEmail"
              type="email"
              defaultValue={settings?.contact_email ?? ""}
            />
            <Input label="Téléphone" name="contactPhone" defaultValue={settings?.contact_phone ?? ""} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conditions commerciales</CardTitle>
          <p className="font-body text-sm text-foreground-muted">Alimente les CGV/CGU.</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Input
            label="Délai de rétractation (jours)"
            name="withdrawalPeriodDays"
            type="number"
            min={0}
            className="md:w-64"
            defaultValue={settings?.withdrawal_period_days ?? 14}
          />
          <Textarea
            label="Modalités de paiement"
            name="paymentTerms"
            placeholder="Ex. carte bancaire à l'inscription, virement, financement OPCO/CPF..."
            defaultValue={settings?.payment_terms ?? ""}
          />
          <Textarea
            label="Politique d'annulation / report"
            name="cancellationPolicy"
            defaultValue={settings?.cancellation_policy ?? ""}
          />
        </CardContent>
      </Card>

      {state?.error && (
        <p role="alert" className="rounded-DEFAULT bg-error-bg px-3 py-2 font-body text-sm text-error">
          {state.error}
        </p>
      )}

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
