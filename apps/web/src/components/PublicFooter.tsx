import Link from "next/link";
import { IconMail, IconShieldCheck } from "./icons";

const FOOTER_COLUMNS = [
  {
    title: "Formations",
    links: [{ label: "Catalogue", href: "/formations" }],
  },
  {
    title: "Mon espace",
    links: [
      { label: "Connexion", href: "/connexion" },
      { label: "Créer un compte", href: "/inscription" },
    ],
  },
] as const;

export function PublicFooter() {
  return (
    <footer className="mt-auto w-full border-t border-border bg-surface px-4 py-12 md:px-(--spacing-margin-desktop)">
      <div className="mx-auto flex max-w-(--spacing-container-max) flex-col gap-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="flex flex-col gap-3">
            <span className="font-display text-lg font-bold text-foreground">Titan Kinetic</span>
            <p className="font-body text-sm text-foreground-muted">
              Organisme de formation professionnelle.
            </p>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono-label text-[11px] uppercase tracking-wide text-accent-text">
              <IconShieldCheck size={14} />
              Certifié Qualiopi
            </span>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title} className="flex flex-col gap-3">
              <span className="font-mono-label text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                {column.title}
              </span>
              <ul className="flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="font-body text-sm text-foreground-muted hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="flex flex-col gap-3">
            <span className="font-mono-label text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              Contact
            </span>
            <a
              href="mailto:contact@titankinetic.fr"
              className="flex items-center gap-1.5 font-body text-sm text-foreground-muted hover:text-foreground"
            >
              <IconMail size={14} />
              contact@titankinetic.fr
            </a>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <p className="font-body text-xs text-foreground-muted">
            © {new Date().getFullYear()} Titan Kinetic. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
