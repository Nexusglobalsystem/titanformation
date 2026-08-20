"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@titan-kinetic/ui";
import { IconMail } from "./icons";

const NAV_LINKS = [
  { href: "/formations", label: "Catalogue" },
] as const;

export function PublicHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-(--spacing-container-max) items-center justify-between gap-6 px-4 py-4 md:px-(--spacing-margin-desktop)">
        <Link href="/" className="shrink-0 font-display text-xl font-bold tracking-tight text-accent">
          Titan Kinetic
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`border-b-2 pb-1 font-body text-sm font-bold transition-colors ${
                  isActive
                    ? "border-accent text-accent"
                    : "border-transparent text-foreground-muted hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <a
            href="mailto:contact@titankinetic.fr"
            className="flex items-center gap-1.5 border-b-2 border-transparent pb-1 font-body text-sm font-bold text-foreground-muted transition-colors hover:text-foreground"
          >
            <IconMail size={16} />
            Contact
          </a>
        </nav>
        <div className="flex shrink-0 items-center gap-3">
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
