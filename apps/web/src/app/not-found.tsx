import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@titan-kinetic/ui";

export default function NotFound() {
  return (
    <div data-theme="dark" className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader />
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center outline-none">
        <span className="font-mono-label text-sm uppercase tracking-wide text-accent-text">Erreur 404</span>
        <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
          Cette page n&apos;existe pas.
        </h1>
        <p className="max-w-md font-body text-foreground-muted">
          La page que vous cherchez a peut-être été déplacée ou n&apos;a jamais existé.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/">
            <Button variant="primary">Retour à l&apos;accueil</Button>
          </Link>
          <Link href="/formations">
            <Button variant="outline">Voir le catalogue</Button>
          </Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
