import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@titan-kinetic/ui";

function IconLayers() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 3 8l9 5 9-5-9-5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="m3 13 9 5 9-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="14.5" r="1.4" fill="currentColor" />
    </svg>
  );
}
function IconSignature() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3.5 17c2-4 3.3-7 4.3-7 1.2 0 .4 5.3 1.6 5.3S12 9 13.3 9s.9 6 2.2 6 2-3 4.5-3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3.5 20.5h17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IconBuilding() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4.5" y="3.5" width="10" height="17" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14.5 9.5h5v11h-5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7.5 7.5h1M7.5 11h1M7.5 14.5h1M11 7.5h1M11 11h1M11 14.5h1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IconShieldCheck({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3.5 5 6v6c0 4.5 3 7.5 7 8.5 4-1 7-4 7-8.5V6l-7-2.5Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12h16M14 6l6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="mt-0.5 shrink-0">
      <path d="m5 12.5 4.5 4.5L19 7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const MODULES = [
  {
    icon: IconLayers,
    title: "Programme structuré",
    body: "Modules et leçons en texte, audio, vidéo ou document, avec QCM de validation noté automatiquement en fin de parcours.",
    span: "lg:col-span-2 lg:row-span-2",
    big: true,
  },
  {
    icon: IconCalendar,
    title: "Agenda & rendez-vous",
    body: "Le formateur publie ses disponibilités, l'apprenant réserve son créneau et indique le motif de l'échange.",
    span: "",
    big: false,
  },
  {
    icon: IconSignature,
    title: "Suivi & émargement",
    body: "Progression en temps réel, signature électronique horodatée à chaque demi-journée.",
    span: "",
    big: false,
  },
  {
    icon: IconBuilding,
    title: "Espace entreprise",
    body: "Le responsable suit en un coup d'œil les inscriptions et l'assiduité de ses salariés.",
    span: "lg:col-span-2",
    big: false,
  },
] as const;

export function HomeLanding() {
  return (
    <div data-theme="dark" className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          <HeroBackdrop />
          <div className="relative z-10 mx-auto flex max-w-(--spacing-container-max) flex-col gap-6 px-4 py-28 md:px-(--spacing-margin-desktop) md:py-36">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono-label text-xs uppercase tracking-wider text-accent-text">
              LMS certifié Qualiopi
            </span>
            <h1 className="max-w-3xl font-display text-4xl font-bold leading-tight text-foreground md:text-6xl">
              La formation professionnelle, orchestrée avec précision.
            </h1>
            <p className="max-w-xl font-body text-base text-foreground-muted md:text-lg">
              De l&apos;inscription à la certification : programme structuré, suivi de présence,
              évaluations et rendez-vous individuels réunis dans un seul espace.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <Link href="/formations">
                <Button variant="primary" size="lg" className="gap-2">
                  Découvrir le catalogue
                  <IconArrowRight />
                </Button>
              </Link>
              <Link href="/connexion">
                <Button variant="outline" size="lg">
                  Se connecter
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Bento modules */}
        <section className="border-b border-border bg-surface py-24">
          <div className="mx-auto max-w-(--spacing-container-max) px-4 md:px-(--spacing-margin-desktop)">
            <div className="mb-12 max-w-2xl">
              <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
                Une plateforme, tout le parcours.
              </h2>
              <p className="mt-3 font-body text-foreground-muted">
                Chaque outil du parcours de formation, interconnecté, du programme jusqu&apos;au
                rendez-vous individuel.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-(--spacing-gutter) lg:grid-cols-3 lg:auto-rows-[180px]">
              {MODULES.map((m) => (
                <div
                  key={m.title}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-surface-elevated p-6 transition-colors hover:border-accent/40 ${m.span}`}
                >
                  <div>
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-accent/20 bg-primary text-accent">
                      <m.icon />
                    </div>
                    <h3 className="font-display text-lg font-semibold text-foreground">{m.title}</h3>
                    <p className={`mt-2 font-body text-sm text-foreground-muted ${m.big ? "max-w-sm" : ""}`}>
                      {m.body}
                    </p>
                  </div>
                  {m.big && (
                    <div className="mt-8 flex flex-wrap gap-2">
                      {["Texte", "Audio", "Vidéo", "Document", "QCM noté"].map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-border bg-surface px-3 py-1 font-mono-label text-[11px] uppercase tracking-wide text-foreground-muted"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Qualiopi */}
        <section className="border-b border-border py-28">
          <div className="mx-auto grid max-w-(--spacing-container-max) grid-cols-1 gap-16 px-4 md:px-(--spacing-margin-desktop) lg:grid-cols-2 lg:items-center">
            <div className="flex flex-col gap-5">
              <span className="font-mono-label text-xs uppercase tracking-widest text-accent-text">
                Conformité
              </span>
              <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
                Chaque formation documente ses indicateurs clés.
              </h2>
              <p className="font-body text-foreground-muted">
                Objectifs, prérequis, durée, modalités d&apos;accessibilité, méthodes
                pédagogiques et d&apos;évaluation : les indicateurs attendus dans le cadre du
                référentiel national qualité sont renseignés pour chaque programme, pas ajoutés
                après coup.
              </p>
            </div>
            <ComplianceMock />
          </div>
        </section>

        {/* Learner experience */}
        <section className="border-b border-border bg-surface py-28">
          <div className="mx-auto grid max-w-(--spacing-container-max) grid-cols-1 gap-16 px-4 md:px-(--spacing-margin-desktop) lg:grid-cols-2 lg:items-center">
            <ProgressMock className="order-2 lg:order-1" />
            <div className="order-1 flex flex-col gap-5 lg:order-2">
              <span className="font-mono-label text-xs uppercase tracking-widest text-accent-text">
                Expérience apprenant
              </span>
              <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
                Une progression visible, du premier module au dernier QCM.
              </h2>
              <p className="font-body text-foreground-muted">
                L&apos;apprenant suit sa progression en temps réel, consulte ses leçons quel que
                soit le format, valide chaque parcours par un QCM noté automatiquement, et
                réserve un rendez-vous individuel avec son formateur quand il en a besoin.
              </p>
              <ul className="mt-2 flex flex-col gap-3">
                <li className="flex items-start gap-3 font-body text-sm text-foreground-muted">
                  <span className="text-accent-text"><IconCheck /></span>
                  Lecture des leçons en texte, audio, vidéo ou document
                </li>
                <li className="flex items-start gap-3 font-body text-sm text-foreground-muted">
                  <span className="text-accent-text"><IconCheck /></span>
                  QCM avec correction immédiate et seuil de réussite
                </li>
                <li className="flex items-start gap-3 font-body text-sm text-foreground-muted">
                  <span className="text-accent-text"><IconCheck /></span>
                  Émargement électronique horodaté par demi-journée
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden py-28 text-center">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center text-accent opacity-[0.07]"
          >
            <IconShieldCheck size={420} />
          </div>
          <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-6 px-4">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Prêt à démarrer votre formation ?
            </h2>
            <p className="font-body text-foreground-muted">
              Parcourez le catalogue, préinscrivez-vous en ligne, et suivez votre parcours de
              bout en bout.
            </p>
            <Link href="/formations">
              <Button variant="primary" size="lg" className="gap-2">
                Voir les formations
                <IconArrowRight />
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 80% 60% at 30% 20%, black 40%, transparent 90%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 30% 20%, black 40%, transparent 90%)",
        }}
      />
      <div className="absolute -left-32 -top-32 h-[520px] w-[520px] rounded-full bg-primary/40 blur-[120px]" />
      <div className="absolute right-0 top-1/3 h-[420px] w-[420px] rounded-full bg-accent/10 blur-[130px]" />
    </div>
  );
}

function ComplianceMock() {
  const rows = [
    { critere: "Ind. 1", label: "Conditions d'information du public", status: "Renseigné", tone: "ok" },
    { critere: "Ind. 5", label: "Moyens pédagogiques et d'encadrement", status: "Renseigné", tone: "ok" },
    { critere: "Ind. 9", label: "Modalités d'accessibilité handicap", status: "Renseigné", tone: "ok" },
  ] as const;
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-2xl">
      <div className="flex items-center justify-between border-b border-border bg-surface px-5 py-3">
        <span className="font-mono-label text-xs uppercase tracking-wide text-foreground-muted">
          Fiche formation — indicateurs
        </span>
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-error/50" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/50" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/50" />
        </div>
      </div>
      <div className="flex flex-col divide-y divide-border">
        {rows.map((r) => (
          <div key={r.critere} className="flex items-center gap-4 px-5 py-4">
            <span className="w-14 shrink-0 font-mono-label text-xs text-foreground-muted">{r.critere}</span>
            <span className="flex-1 font-body text-sm text-foreground-muted">{r.label}</span>
            <span className="inline-flex items-center gap-1 rounded border border-success/30 bg-success-bg px-2 py-1 font-mono-label text-[10px] uppercase text-success">
              <IconCheck /> {r.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressMock({ className = "" }: { className?: string }) {
  const items = [
    { label: "Introduction au module", pct: 100 },
    { label: "Vidéo de présentation", pct: 100 },
    { label: "Podcast du module", pct: 60 },
    { label: "Évaluation finale", pct: 0 },
  ];
  return (
    <div className={`overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-2xl ${className}`}>
      <div className="border-b border-border bg-surface px-5 py-3">
        <span className="font-mono-label text-xs uppercase tracking-wide text-foreground-muted">
          Ma progression
        </span>
      </div>
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between font-body text-sm text-foreground">
          <span>2/4 leçons terminées</span>
          <span className="font-mono-label tabular-nums text-accent-text">50%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
          <div className="h-full w-1/2 rounded-full bg-accent" />
        </div>
        <div className="mt-2 flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${item.pct === 100 ? "bg-success" : item.pct > 0 ? "bg-accent" : "bg-border"}`}
              />
              <span className="flex-1 font-body text-xs text-foreground-muted">{item.label}</span>
              <span className="font-mono-label text-[10px] text-foreground-muted">{item.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
