import Link from "next/link";
import { Button } from "@titan-kinetic/ui";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-(--spacing-container-max) items-center justify-between px-4 py-4 md:px-(--spacing-margin-desktop)">
        <Link href="/formations" className="font-display text-xl font-bold tracking-tight text-accent">
          Titan Kinetic
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/formations"
            className="border-b-2 border-accent pb-1 font-body text-sm font-bold text-accent"
          >
            Catalogue
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/connexion">
            <Button variant="ghost" size="sm" className="hidden text-accent hover:bg-surface-elevated md:inline-flex">
              Connexion
            </Button>
          </Link>
          <Link href="/inscription">
            <Button variant="primary" size="sm">
              Créer un compte
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
