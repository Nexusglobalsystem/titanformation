"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@titan-kinetic/ui";
import { signInAction, type ActionState } from "../_actions/auth";
import { SubmitButton } from "../_components/SubmitButton";
import { FormMessage } from "../_components/FormMessage";

export default function ConnexionPage() {
  const [state, formAction] = useActionState<ActionState, FormData>(signInAction, undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connexion</CardTitle>
        <CardDescription>Accède à ton espace Titan Kinetic.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <Input label="Email" name="email" type="email" autoComplete="email" required />
          <Input
            label="Mot de passe"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
          <FormMessage error={state?.error} success={state?.success} />
          <SubmitButton>Se connecter</SubmitButton>
        </form>
        <div className="mt-6 flex flex-col gap-2 text-center font-body text-sm text-foreground-muted">
          <Link href="/mot-de-passe-oublie" className="text-accent-text hover:underline">
            Mot de passe oublié ?
          </Link>
          <span>
            Pas encore de compte ?{" "}
            <Link href="/inscription" className="text-accent-text hover:underline">
              Inscris-toi
            </Link>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
