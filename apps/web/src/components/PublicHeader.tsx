"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SkipLink } from "@titan-kinetic/ui";
import { Brand } from "./Brand";
export function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <>
      <SkipLink />
      <header className="campus-header">
        <div className="campus-header-inner">
          <Brand />
          <nav
            aria-label="Navigation principale"
            className="campus-desktop-nav"
          >
            <Link
              href="/formations"
              aria-current={
                pathname.startsWith("/formations") ? "page" : undefined
              }
            >
              Les formations
            </Link>
            <Link href="/#experience">L’expérience Titan</Link>
            <Link href="/#entreprises">Pour les équipes</Link>
          </nav>
          <div className="campus-header-actions">
            <Link href="/connexion" className="campus-login">
              Mon espace <span aria-hidden="true">↗</span>
            </Link>
            <button
              className="campus-menu-toggle"
              aria-expanded={open}
              aria-controls="campus-mobile-nav"
              onClick={() => setOpen(!open)}
              aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {open ? "Fermer −" : "Menu +"}
            </button>
          </div>
        </div>
        {open && (
          <nav
            id="campus-mobile-nav"
            aria-label="Navigation mobile"
            className="campus-mobile-nav"
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
            }}
          >
            {[
              ["/formations", "Les formations"],
              ["/#experience", "L’expérience Titan"],
              ["/#entreprises", "Pour les équipes"],
              ["/inscription", "Créer un compte"],
            ].map(([href, label]) => (
              <Link key={href} href={href!} onClick={() => setOpen(false)}>
                {label}
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
          </nav>
        )}
      </header>
    </>
  );
}
