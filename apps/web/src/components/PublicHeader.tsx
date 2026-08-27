"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button, Dialog, DialogClose, DialogContent, DialogTrigger, SkipLink } from "@titan-kinetic/ui";
import { IconMail, IconMenu, IconX } from "./icons";

const NAV_LINKS = [
  { href: "/formations", label: "Catalogue" },
] as const;

export function PublicHeader() {
  const pathname = usePathname();

  return (
    <>
      <SkipLink />
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
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                aria-label="Ouvrir le menu"
                className="flex h-9 w-9 items-center justify-center rounded-DEFAULT text-foreground-muted transition-colors hover:bg-surface-elevated hover:text-foreground md:hidden"
              >
                <IconMenu />
              </button>
            </DialogTrigger>
            <DialogContent
              data-theme="dark"
              className="inset-x-0 top-0 max-w-none translate-x-0 translate-y-0 rounded-none rounded-b-xl border-x-0 border-t-0 p-0 shadow-lg"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-4">
                <span className="font-display text-lg font-bold text-accent">Titan Kinetic</span>
                <DialogClose asChild>
                  <button
                    type="button"
                    aria-label="Fermer le menu"
                    className="flex h-9 w-9 items-center justify-center rounded-DEFAULT text-foreground-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
                  >
                    <IconX />
                  </button>
                </DialogClose>
              </div>
              <nav className="flex flex-col gap-1 p-4">
                {NAV_LINKS.map((link) => {
                  const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                  return (
                    <DialogClose asChild key={link.href}>
                      <Link
                        href={link.href}
                        className={`rounded-DEFAULT px-3 py-2.5 font-body text-sm font-bold transition-colors ${
                          isActive
                            ? "bg-accent/10 text-accent"
                            : "text-foreground-muted hover:bg-surface-elevated hover:text-foreground"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </DialogClose>
                  );
                })}
                <DialogClose asChild>
                  <a
                    href="mailto:contact@titankinetic.fr"
                    className="flex items-center gap-2 rounded-DEFAULT px-3 py-2.5 font-body text-sm font-bold text-foreground-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
                  >
                    <IconMail size={16} />
                    Contact
                  </a>
                </DialogClose>
              </nav>
              <div className="border-t border-border p-4">
                <DialogClose asChild>
                  <Link href="/connexion">
                    <Button variant="outline" className="w-full">
                      Connexion
                    </Button>
                  </Link>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      </header>
    </>
  );
}
