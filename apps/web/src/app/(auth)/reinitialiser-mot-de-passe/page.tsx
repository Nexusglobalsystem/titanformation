"use client";

import { useActionState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, PasswordInput } from "@titan-kinetic/ui";
import { resetPasswordAction, type ActionState } from "../_actions/auth";
import { SubmitButton } from "../_components/SubmitButton";
import { FormMessage } from "../_components/FormMessage";

export default function ReinitialiserMotDePassePage() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    resetPasswordAction,
    undefined,
  );

  return (
    <Card className="border-border/60 bg-surface-elevated shadow-2xl">
      <CardHeader>
        <span className="mb-1 font-mono-label text-xs uppercase tracking-widest text-accent-text">
          Sécurité du compte
        </span>
        <CardTitle>Choisir un nouveau mot de passe</CardTitle>
        <CardDescription>Ce lien n&apos;est valable qu&apos;une seule fois.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <PasswordInput
            label="Nouveau mot de passe"
            name="password"
            autoComplete="new-password"
            hint="8 caractères minimum"
            required
          />
          <PasswordInput
            label="Confirmer le mot de passe"
            name="confirmPassword"
            autoComplete="new-password"
            required
          />
          <FormMessage error={state?.error} success={state?.success} />
          <SubmitButton>Mettre à jour le mot de passe</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
