import Link from "next/link";
import { Brand } from "./Brand";
export function PublicFooter() {
  return (
    <footer className="campus-footer">
      <div className="campus-container">
        <div className="footer-invitation">
          <p>NE CESSEZ JAMAIS D’APPRENDRE.</p>
          <Link href="/formations">
            La suite vous appartient.<span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="footer-links">
          <Brand />
          <p>
            Des compétences.
            <br />
            De nouvelles perspectives.
          </p>
          <nav aria-label="Liens utiles">
            <Link href="/formations">Les formations</Link>
            <Link href="/connexion">Mon espace</Link>
            <a href="mailto:contact@titankinetic.fr">Nous contacter</a>
          </nav>
        </div>
        <div className="footer-legal">
          <span>© {new Date().getFullYear()} Titan Kinetic</span>
          <nav aria-label="Informations légales">
            <Link href="/mentions-legales">Mentions légales</Link>
            <Link href="/confidentialite">Confidentialité</Link>
            <Link href="/cgv">Conditions générales</Link>
          </nav>
          <span>LA CURIOSITÉ NOUS ANIME. ✳</span>
        </div>
      </div>
    </footer>
  );
}
