import Link from "next/link";
import { Button } from "@titan-kinetic/ui";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <span
        aria-hidden="true"
        className="flex h-14 w-14 items-center justify-center rounded-DEFAULT bg-primary font-display text-2xl font-bold text-accent"
      >
        TK
      </span>
      <h1 className="font-display text-3xl font-bold text-foreground">Titan Kinetic</h1>
      <p className="max-w-md font-body text-sm text-foreground-muted">
        LMS certifié Qualiopi. Le catalogue public de formations sera livré dans un lot
        ultérieur — cette version couvre l'authentification et les espaces par rôle.
      </p>
      <div className="flex gap-3">
        <Link href="/connexion">
          <Button variant="primary">Se connecter</Button>
        </Link>
        <Link href="/inscription">
          <Button variant="outline">Créer un compte</Button>
        </Link>
      </div>
    </main>
  );
}
