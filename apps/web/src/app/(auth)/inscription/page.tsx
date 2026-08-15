"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@titan-kinetic/ui";
import { signUpAction, type ActionState } from "../_actions/auth";
import { SubmitButton } from "../_components/SubmitButton";
import { FormMessage } from "../_components/FormMessage";

export default function InscriptionPage() {
  const [state, formAction] = useActionState<ActionState, FormData>(signUpAction, undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Créer un compte</CardTitle>
        <CardDescription>Inscris-toi pour accéder au catalogue de formations.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Prénom" name="firstName" autoComplete="given-name" required />
            <Input label="Nom" name="lastName" autoComplete="family-name" required />
          </div>
          <Input label="Email" name="email" type="email" autoComplete="email" required />
          <Input
            label="Mot de passe"
            name="password"
            type="password"
            autoComplete="new-password"
            hint="8 caractères minimum"
            required
          />
          <Input
            label="Confirmer le mot de passe"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
          />
          <FormMessage error={state?.error} success={state?.success} />
          <SubmitButton>Créer mon compte</SubmitButton>
        </form>
        <p className="mt-6 text-center font-body text-sm text-foreground-muted">
          Déjà un compte ?{" "}
          <Link href="/connexion" className="text-accent-text hover:underline">
            Connecte-toi
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
