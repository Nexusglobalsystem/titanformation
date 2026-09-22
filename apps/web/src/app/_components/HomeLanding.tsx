import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import {
  TrainingCard,
  type CatalogueTraining,
} from "@/app/formations/_components/TrainingCard";
import { HeroExperience } from "./HeroExperience";
type HomeStats = {
  publishedTrainings: number;
  learnerCount: number;
  upcomingSessions: number;
  avgSatisfaction: number | null;
};
type UpcomingSession = {
  id: string;
  startsOn: string;
  endsOn: string;
  trainingTitle: string;
  trainingSlug: string;
};
const labels: Record<string, string> = {
  management: "Management",
  conformite: "Conformité",
  technologies: "Technologies",
};
export function HomeLanding({
  popularTrainings = [],
  categories = [],
  stats,
  upcomingSessions = [],
}: {
  popularTrainings?: CatalogueTraining[];
  categories?: string[];
  stats?: HomeStats;
  upcomingSessions?: UpcomingSession[];
}) {
  return (
    <div data-theme="dark" className="campus-root">
      <PublicHeader />
      <main id="main-content" tabIndex={-1}>
        <section className="campus-hero campus-container">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="status-dot" /> LE CAMPUS DES NOUVELLES
              PERSPECTIVES
            </p>
            <h1>
              Votre prochain
              <br />
              chapitre
              <br />
              <em>commence ici.</em>
            </h1>
            <p className="hero-description">
              La curiosité vous a mené ici.
              <br />
              Faites-en une compétence qui vous emmène plus loin.
            </p>
            <div className="hero-actions">
              <Link className="campus-button" href="/formations">
                Explorer les formations <span aria-hidden="true">↗</span>
              </Link>
              <a href="#experience" className="campus-text-link">
                Vivre l’expérience <span aria-hidden="true">↓</span>
              </a>
            </div>
            <div className="hero-note">
              <span className="small-orbit" aria-hidden="true">
                ✳
              </span>
              <p>
                À votre rythme. Avec un cap.
                <br />
                <strong>Et des formateurs pour vous accompagner.</strong>
              </p>
            </div>
          </div>
          <HeroExperience />
        </section>
        <div className="campus-ticker" aria-hidden="true">
          <div>
            RESTEZ CURIEUX <span>✳</span> APPRENEZ AUTREMENT <span>✳</span>{" "}
            PASSEZ À L’ACTION <span>✳</span> RESTEZ CURIEUX <span>✳</span>{" "}
            APPRENEZ AUTREMENT <span>✳</span> PASSEZ À L’ACTION <span>✳</span>
          </div>
        </div>
        <section id="formations" className="campus-section campus-container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">01 / TROUVEZ VOTRE ÉLAN</p>
              <h2>
                Une envie.
                <br />
                <em>De nouvelles possibilités.</em>
              </h2>
            </div>
            <p>
              Un premier pas ou un nouveau départ.
              <br />
              Trouvez le programme qui vous ressemble.
            </p>
          </div>
          <form action="/formations" method="GET" className="campus-search">
            <label htmlFor="home-search" className="sr-only">
              Quelle compétence voulez-vous développer ?
            </label>
            <span aria-hidden="true">⌕</span>
            <input
              id="home-search"
              name="q"
              type="search"
              placeholder="Quelle compétence voulez-vous développer ?"
            />
            <button type="submit">
              Trouver ma formation <span aria-hidden="true">↗</span>
            </button>
          </form>
          {categories.length > 0 && (
            <div className="category-links">
              <span>Explorez par univers</span>
              {categories.map((c) => (
                <Link
                  key={c}
                  href={"/formations?categorie=" + encodeURIComponent(c)}
                >
                  {labels[c] ?? c}
                  <span aria-hidden="true">↗</span>
                </Link>
              ))}
            </div>
          )}
          {popularTrainings.length > 0 ? (
            <div className="course-grid">
              {popularTrainings.slice(0, 3).map((t) => (
                <TrainingCard key={t.id} training={t} />
              ))}
            </div>
          ) : (
            <div className="catalogue-invitation">
              <p>Votre prochaine compétence vous attend.</p>
              <Link href="/formations" className="campus-text-link">
                Découvrir le catalogue <span aria-hidden="true">↗</span>
              </Link>
            </div>
          )}
          <div className="section-bottom">
            <span>Un parcours adapté à chaque ambition.</span>
            <Link href="/formations" className="campus-text-link">
              Toutes les formations <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </section>
        <section id="experience" className="experience-section">
          <div className="campus-container">
            <div className="section-heading">
              <div>
                <p className="eyebrow">02 / PLUS QU’UNE FORMATION</p>
                <h2>
                  Le déclic.
                  <br />
                  Puis <em>le mouvement.</em>
                </h2>
              </div>
              <p>
                Apprendre prend tout son sens
                <br />
                quand vous voyez le chemin parcouru.
              </p>
            </div>
            <div className="experience-grid">
              {[
                [
                  "01",
                  "Un parcours, votre rythme.",
                  "Des leçons organisées, des ressources à retrouver et une progression visible. Reprenez là où vous en étiez.",
                  "↗",
                ],
                [
                  "02",
                  "Des échanges qui font avancer.",
                  "Réservez un rendez-vous avec votre formateur. Posez vos questions et partagez vos idées en classe virtuelle.",
                  "↔",
                ],
                [
                  "03",
                  "Des acquis qui prennent forme.",
                  "Mettez vos connaissances à l’épreuve avec les quiz. Visualisez vos résultats et validez les étapes de votre formation.",
                  "✳",
                ],
              ].map(([n, title, body, symbol]) => (
                <article key={n} className="experience-item">
                  <div className="experience-item-top">
                    <span>{n}</span>
                    <span className="experience-symbol" aria-hidden="true">
                      {symbol}
                    </span>
                  </div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
            <div className="experience-caption">
              <span>VOTRE CURIOSITÉ EST LE POINT DE DÉPART.</span>
              <Link href="/inscription">
                Créer mon espace <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        </section>
        {upcomingSessions.length > 0 && (
          <section className="campus-section campus-container">
            <div className="section-heading">
              <div>
                <p className="eyebrow">03 / À VOS AGENDAS</p>
                <h2>
                  Le bon moment,
                  <br />
                  <em>c’est bientôt.</em>
                </h2>
              </div>
              <Link href="/formations" className="campus-text-link">
                Explorer le catalogue ↗
              </Link>
            </div>
            <div className="session-list">
              {upcomingSessions.map((s) => (
                <Link href={"/formations/" + s.trainingSlug} key={s.id}>
                  <time dateTime={s.startsOn}>
                    <strong>
                      {new Date(s.startsOn + "T12:00:00Z").toLocaleDateString(
                        "fr-FR",
                        { day: "2-digit", timeZone: "UTC" },
                      )}
                    </strong>
                    <span>
                      {new Date(s.startsOn + "T12:00:00Z").toLocaleDateString(
                        "fr-FR",
                        { month: "short", timeZone: "UTC" },
                      )}
                    </span>
                  </time>
                  <h3>{s.trainingTitle}</h3>
                  <span className="session-cta">
                    Découvrir la session <span aria-hidden="true">↗</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
        <section id="entreprises" className="campus-container team-section">
          <div>
            <p className="eyebrow">GRANDIR, ENSEMBLE</p>
            <h2>
              Les grandes avancées
              <br />
              sont aussi <em>collectives.</em>
            </h2>
            <p>
              Accompagnez les ambitions de votre équipe. Centralisez les
              inscriptions, suivez les parcours et construisez votre projet de
              formation.
            </p>
            <a
              className="campus-button"
              href="mailto:contact@titankinetic.fr?subject=Projet%20de%20formation%20en%20%C3%A9quipe"
            >
              Parlons de votre projet <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="team-art" aria-hidden="true">
            <span />
            <span />
            <span />
            <b>
              ENSEMBLE
              <br />
              PLUS LOIN.
            </b>
          </div>
        </section>
        {stats && stats.publishedTrainings > 0 && (
          <section
            className="campus-container campus-facts"
            aria-label="Le campus en chiffres"
          >
            <div>
              <strong>{stats.publishedTrainings}</strong>
              <span>formations à explorer</span>
            </div>
            <div>
              <strong>{stats.upcomingSessions}</strong>
              <span>sessions à venir</span>
            </div>
            {stats.learnerCount > 0 && (
              <div>
                <strong>{stats.learnerCount}</strong>
                <span>apprenants</span>
              </div>
            )}
            {stats.avgSatisfaction !== null && (
              <div>
                <strong>{stats.avgSatisfaction}%</strong>
                <span>satisfaction moyenne</span>
              </div>
            )}
          </section>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
