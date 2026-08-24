"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@titan-kinetic/ui";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center text-foreground">
      <span className="font-display text-xl font-bold text-accent">Titan Kinetic</span>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-bold text-foreground">Une erreur est survenue.</h1>
        <p className="max-w-md font-body text-sm text-foreground-muted">
          Le problème a été enregistré. Réessayez, ou revenez à l&apos;accueil si ça persiste.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="primary" onClick={() => reset()}>
          Réessayer
        </Button>
        <Link href="/">
          <Button variant="outline">Retour à l&apos;accueil</Button>
        </Link>
      </div>
    </div>
  );
}
