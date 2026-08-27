import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import sanitizeHtml from "sanitize-html";
import { createClient } from "@/lib/supabase/server";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { Button, Card, CardContent } from "@titan-kinetic/ui";
import { EnrollForm } from "./_components/EnrollForm";
import { EnrollEmployeeForm } from "./_components/EnrollEmployeeForm";
import { TrainingCoverArt } from "../_components/TrainingCoverArt";

function IconLayers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 3 8l9 5 9-5-9-5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="m3 13 9 5 9-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconTarget() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 19c.8-3.2 3-5 5.5-5s4.7 1.8 5.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M15.5 13c2 .2 3.5 1.8 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconShieldCheck() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3.5 5 6v6c0 4.5 3 7.5 7 8.5 4-1 7-4 7-8.5V6l-7-2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SectionHeading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-accent md:text-xl">
      <span aria-hidden="true">{icon}</span>
      {children}
    </h2>
  );
}

// Repli pour les fiches jamais rééditées avec RichTextEditor : ces champs
// texte étaient saisis en une seule colonne sans format riche, où un retour
// à la ligne dans le formulaire admin correspond à un nouveau paragraphe
// voulu, jamais à un simple retour à l'écran.
function MultiParagraphLegacy({ text, className }: { text: string; className: string }) {
  const paragraphs = text
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <div className="flex flex-col gap-3">
      {paragraphs.map((p, i) => (
        <p key={i} className={className}>
          {p}
        </p>
      ))}
    </div>
  );
}

const RICH_TEXT_ALLOWED_TAGS = ["p", "br", "strong", "em", "b", "i", "ul", "ol", "li"];

// Champs produits soit par l'ancien <Textarea> (texte brut, \n = paragraphe),
// soit par le nouveau RichTextEditor (HTML gras/italique/listes). On
// distingue les deux au rendu plutôt que de migrer les fiches existantes.
function RichOrLegacyText({ text, className }: { text: string | null; className: string }) {
  if (!text) return null;
  const clean = sanitizeHtml(text, { allowedTags: RICH_TEXT_ALLOWED_TAGS, allowedAttributes: {} });
  const isRich = /<[a-z][\s\S]*>/i.test(clean);
  if (!isRich) return <MultiParagraphLegacy text={text} className={className} />;
  return (
    <div
      className={`${className} [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_strong]:font-semibold`}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}

export default async function TrainingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // training et l'utilisateur courant sont indépendants — parallélisables
  // même si training échoue ensuite (le coût de getUser() est négligeable).
  const [{ data: training }, { data: { user } }] = await Promise.all([
    supabase.from("trainings").select("*").eq("slug", slug).eq("status", "publiee").maybeSingle(),
    supabase.auth.getUser(),
  ]);

  if (!training) notFound();

  const trainingImageUrl = training.image_path
    ? supabase.storage.from("training-images").getPublicUrl(training.image_path).data.publicUrl
    : null;

  // modules et session dépendent tous deux uniquement de training.id, pas
  // l'un de l'autre — parallélisables.
  const [{ data: modules }, { data: session }] = await Promise.all([
    supabase
      .from("modules")
      .select("id, title, description")
      .eq("training_id", training.id)
      .order("position", { ascending: true }),
    supabase
      .from("sessions")
      .select("*")
      .eq("training_id", training.id)
      .eq("status", "ouverte")
      .order("starts_on", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  async function loadExistingEnrollment(): Promise<{ status: string } | null> {
    if (!user || !session) return null;
    const { data } = await supabase
      .from("enrollments")
      .select("status")
      .eq("session_id", session.id)
      .eq("learner_id", user.id)
      .maybeSingle();
    return data;
  }

  // Responsable d'entreprise : carte d'inscription additionnelle pour un
  // salarié, à côté de (jamais à la place de) l'auto-inscription/devis
  // déjà en production.
  async function loadResponsableEmployees(): Promise<{
    isResponsable: boolean;
    employees: { id: string; name: string }[];
  }> {
    if (!user) return { isResponsable: false, employees: [] };
    const { data: companyIds } = await supabase.rpc("managed_company_ids");
    const companyId = companyIds?.[0];
    if (!companyId) return { isResponsable: false, employees: [] };
    const { data: members } = await supabase
      .from("company_members")
      .select("user_id, profiles(id, first_name, last_name)")
      .eq("company_id", companyId)
      .eq("role", "salarie");
    const employees = (members ?? [])
      .map((m) => m.profiles)
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map((p) => ({ id: p.id, name: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.id }));
    return { isResponsable: true, employees };
  }

  // existingEnrollment (dépend de user+session) et le lookup responsable
  // (dépend seulement de user) ne dépendent pas l'un de l'autre.
  const [existingEnrollment, { isResponsable, employees }] = await Promise.all([
    loadExistingEnrollment(),
    loadResponsableEmployees(),
  ]);

  return (
    <div data-theme="dark" className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader />
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-(--spacing-container-max) flex-1 px-4 py-8 outline-none md:px-(--spacing-margin-desktop)">
        <nav className="mb-8 flex items-center gap-2 font-mono-label text-xs uppercase tracking-wide text-foreground-muted">
          <Link href="/formations" className="hover:text-accent">
            Catalogue
          </Link>
          <span>/</span>
          <span className="text-accent">{training.title}</span>
        </nav>

        <div className="relative mb-8 h-48 w-full overflow-hidden rounded-xl md:h-64">
          {trainingImageUrl ? (
            <Image src={trainingImageUrl} alt="" fill sizes="100vw" priority className="object-cover" />
          ) : (
            <TrainingCoverArt seed={training.id} className="h-full w-full" />
          )}
        </div>

        <div className="mb-8 flex flex-col gap-4">
          <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">{training.title}</h1>
          <p className="max-w-3xl font-body text-sm text-foreground-muted md:text-base">{training.summary}</p>
        </div>

        <div className="grid grid-cols-1 gap-(--spacing-gutter) lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-8">
            <Card>
              <CardContent className="p-6 pt-6">
                <SectionHeading icon={<IconTarget />}>Objectifs de la formation</SectionHeading>
                <RichOrLegacyText text={training.objectives} className="font-body text-sm text-foreground" />
              </CardContent>
            </Card>

            {modules && modules.length > 0 && (
              <Card>
                <CardContent className="p-6 pt-6">
                  <SectionHeading icon={<IconLayers />}>Programme détaillé</SectionHeading>
                  <ol className="flex flex-col gap-4">
                    {modules.map((m, i) => (
                      <li key={m.id} className="border-l-2 border-border pl-4">
                        <p className="font-mono-label text-[11px] uppercase tracking-wide text-foreground-muted">
                          Module {i + 1}
                        </p>
                        <p className="font-body text-sm font-semibold text-foreground">{m.title}</p>
                        {m.description && (
                          <p className="font-body text-sm text-foreground-muted">{m.description}</p>
                        )}
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-6 pt-6">
                <SectionHeading icon={<IconLayers />}>Modalités pédagogiques</SectionHeading>
                <RichOrLegacyText text={training.pedagogical_means} className="font-body text-sm text-foreground" />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-(--spacing-gutter) md:grid-cols-2">
              <Card>
                <CardContent className="p-6 pt-6">
                  <SectionHeading icon={<IconUsers />}>Public visé</SectionHeading>
                  <RichOrLegacyText text={training.target_audience} className="font-body text-sm text-foreground-muted" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 pt-6">
                  <SectionHeading icon={<IconShieldCheck />}>Prérequis</SectionHeading>
                  <RichOrLegacyText text={training.prerequisites} className="font-body text-sm text-foreground-muted" />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-6 pt-6">
                <h2 className="mb-3 font-display text-lg font-semibold text-accent">Modalités d'évaluation</h2>
                <RichOrLegacyText text={training.assessment_methods} className="font-body text-sm text-foreground-muted" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 pt-6">
                <h2 className="mb-3 font-display text-lg font-semibold text-accent">Accessibilité</h2>
                <RichOrLegacyText text={training.accessibility_info} className="font-body text-sm text-foreground-muted" />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4">
            <Card className="sticky top-24">
              <CardContent className="flex flex-col gap-6 p-6 pt-6">
                <div className="flex items-end justify-between border-b border-border pb-6">
                  <span className="font-display text-3xl font-bold text-accent">{training.price_ht} €</span>
                  <span className="pb-1 font-body text-sm text-foreground-muted">HT / participant</span>
                </div>

                <dl className="flex flex-col gap-3 font-body text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-foreground-muted">Durée</dt>
                    <dd className="text-right font-semibold text-foreground">{training.duration_hours} heures</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-foreground-muted">Format</dt>
                    <dd className="text-right font-semibold text-foreground">{training.modalities}</dd>
                  </div>
                  {training.is_certifying && (
                    <div className="flex items-center justify-between">
                      <dt className="text-foreground-muted">Certification</dt>
                      <dd className="text-right font-semibold text-foreground">
                        {training.certification_name || "Certificat de réalisation"}
                      </dd>
                    </div>
                  )}
                  {session && (
                    <div className="flex items-center justify-between">
                      <dt className="text-foreground-muted">Prochaine session</dt>
                      <dd className="text-right font-semibold text-foreground">
                        {new Date(session.starts_on).toLocaleDateString("fr-FR")} · {session.reference}
                      </dd>
                    </div>
                  )}
                </dl>

                <div className="flex flex-col gap-3 pt-2">
                  {!session ? (
                    <p className="font-body text-sm text-foreground-muted">
                      Aucune session ouverte pour le moment.
                    </p>
                  ) : existingEnrollment ? (
                    <p role="status" className="rounded-DEFAULT bg-success-bg px-3 py-2 font-body text-sm text-success">
                      Inscription enregistrée — statut : {existingEnrollment.status}. Un gestionnaire te
                      contactera pour la suite.
                    </p>
                  ) : user ? (
                    <EnrollForm sessionId={session.id} slug={training.slug} />
                  ) : (
                    <Link href={`/connexion?next=/formations/${training.slug}`}>
                      <Button variant="accent" className="w-full">
                        Se connecter pour s'inscrire
                      </Button>
                    </Link>
                  )}
                  <a href="mailto:contact@titankinetic.fr?subject=Demande de devis">
                    <Button variant="outline" className="w-full">
                      Demander un devis
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>

            {isResponsable && session && (
              <Card className="mt-6">
                <CardContent className="flex flex-col gap-4 p-6 pt-6">
                  <div>
                    <h2 className="font-display text-base font-semibold text-foreground">
                      Inscrire un salarié
                    </h2>
                    <p className="mt-1 font-body text-xs text-foreground-muted">
                      En tant que responsable d&apos;entreprise, inscrivez directement un de vos
                      salariés à cette session.
                    </p>
                  </div>
                  <EnrollEmployeeForm sessionId={session.id} slug={training.slug} employees={employees} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
