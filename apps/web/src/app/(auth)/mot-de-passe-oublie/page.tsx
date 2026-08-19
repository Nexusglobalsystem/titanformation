"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@titan-kinetic/ui";
import { forgotPasswordAction, type ActionState } from "../_actions/auth";
import { SubmitButton } from "../_components/SubmitButton";
import { FormMessage } from "../_components/FormMessage";

export default function MotDePasseOubliePage() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    forgotPasswordAction,
    undefined,
  );

  return (
    <Card className="border-border/60 bg-surface-elevated shadow-2xl">
      <CardHeader>
        <span className="mb-1 font-mono-label text-xs uppercase tracking-widest text-accent-text">
          Récupération
        </span>
        <CardTitle>Mot de passe oublié</CardTitle>
        <CardDescription>
          Indique ton email : tu recevras un lien pour choisir un nouveau mot de passe.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <Input label="Email" name="email" type="email" autoComplete="email" required />
          <FormMessage error={state?.error} success={state?.success} />
          <SubmitButton>Envoyer le lien</SubmitButton>
        </form>
        <p className="mt-6 text-center font-body text-sm text-foreground-muted">
          <Link href="/connexion" className="text-accent-text hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
