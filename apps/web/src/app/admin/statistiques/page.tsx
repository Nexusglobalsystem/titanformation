import { createClient } from "@/lib/supabase/server";
import { SpaceShell } from "@/components/SpaceShell";
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState, Progress } from "@titan-kinetic/ui";
import { IconAlertTriangle, IconTrendUp, IconUsers } from "@/components/icons";

const ENROLLMENT_STATUS_LABELS: Record<string, string> = {
  preinscrit: "Préinscrit",
  en_attente_paiement: "En attente de paiement",
  confirme: "Confirmé",
  annule: "Annulé",
  termine: "Terminé",
  abandonne: "Abandonné",
};

const CLAIM_STATUS_LABELS: Record<string, string> = {
  ouverte: "Ouverte",
  en_cours: "En cours",
  resolue: "Résolue",
  refusee: "Refusée",
};

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-5">
        <span className="font-body text-xs uppercase tracking-wide text-foreground-muted">{label}</span>
        <span className="font-display text-3xl font-semibold tabular-nums text-foreground">{value}</span>
      </CardContent>
    </Card>
  );
}

function CountBar({ label, count, total }: { label: string; count: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-40 shrink-0 font-body text-sm text-foreground-muted">{label}</span>
      <Progress value={count} max={total || 1} className="flex-1" />
      <span className="w-8 shrink-0 text-right font-mono-label text-sm tabular-nums text-foreground">
        {count}
      </span>
    </div>
  );
}

export default async function StatistiquesPage() {
  const supabase = await createClient();

  const [trainingsRes, enrollmentsRes, sessionsRes, claimsRes, certificatesRes, bookingsRes] =
    await Promise.all([
      supabase.from("trainings").select("id, status, satisfaction_rate"),
      supabase.from("enrollments").select("id, status, learner_id, created_at"),
      supabase.from("sessions").select("id, status, starts_on"),
      supabase.from("claims").select("id, status"),
      supabase.from("certificates").select("id", { count: "exact", head: true }),
      supabase.from("bookings").select("id, status, booking_date"),
    ]);

  const trainings = trainingsRes.data ?? [];
  const enrollments = enrollmentsRes.data ?? [];
  const sessions = sessionsRes.data ?? [];
  const claims = claimsRes.data ?? [];
  const totalCertificates = certificatesRes.count ?? 0;
  const bookings = bookingsRes.data ?? [];

  const publishedTrainings = trainings.filter((t) => t.status === "publiee").length;
  const satisfactionRates = trainings
    .map((t) => t.satisfaction_rate)
    .filter((r): r is number => typeof r === "number");
  const avgSatisfaction =
    satisfactionRates.length > 0
      ? Math.round(satisfactionRates.reduce((a, b) => a + b, 0) / satisfactionRates.length)
      : null;

  const distinctLearners = new Set(enrollments.map((e) => e.learner_id)).size;
  const today = new Date().toISOString().slice(0, 10);
  const upcomingSessions = sessions.filter((s) => s.starts_on >= today && s.status !== "annulee").length;
  const upcomingBookings = bookings.filter((b) => b.booking_date >= today && b.status === "confirmee").length;

  const enrollmentsByStatus = Object.keys(ENROLLMENT_STATUS_LABELS).map((status) => ({
    status,
    count: enrollments.filter((e) => e.status === status).length,
  }));

  const claimsByStatus = Object.keys(CLAIM_STATUS_LABELS).map((status) => ({
    status,
    count: claims.filter((c) => c.status === status).length,
  }));
  const openClaims = claims.filter((c) => c.status === "ouverte" || c.status === "en_cours").length;

  return (
    <SpaceShell title="Espace administration">
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard label="Formations publiées" value={publishedTrainings} />
          <KpiCard label="Apprenants inscrits" value={distinctLearners} />
          <KpiCard label="Sessions à venir" value={upcomingSessions} />
          <KpiCard label="Certificats délivrés" value={totalCertificates} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Inscriptions par statut</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {enrollmentsByStatus.map(({ status, count }) => (
                <CountBar
                  key={status}
                  label={ENROLLMENT_STATUS_LABELS[status]}
                  count={count}
                  total={enrollments.length}
                />
              ))}
              {enrollments.length === 0 && (
                <EmptyState icon={<IconUsers />} title="Aucune inscription pour le moment." />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Réclamations</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Badge variant={openClaims > 0 ? "warning" : "success"}>
                  {openClaims} en cours de traitement
                </Badge>
              </div>
              <div className="flex flex-col gap-3">
                {claimsByStatus.map(({ status, count }) => (
                  <CountBar
                    key={status}
                    label={CLAIM_STATUS_LABELS[status]}
                    count={count}
                    total={claims.length}
                  />
                ))}
                {claims.length === 0 && (
                  <EmptyState icon={<IconAlertTriangle />} title="Aucune réclamation pour le moment." />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Satisfaction moyenne (indicateur 2/3)</CardTitle>
            </CardHeader>
            <CardContent>
              {avgSatisfaction === null ? (
                <EmptyState icon={<IconTrendUp />} title="Aucun taux de satisfaction publié pour le moment." />
              ) : (
                <Progress value={avgSatisfaction} label="Toutes formations confondues" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agenda</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <p className="font-body text-sm text-foreground-muted">
                <span className="font-mono-label text-lg font-semibold tabular-nums text-foreground">
                  {upcomingBookings}
                </span>{" "}
                rendez-vous confirmés à venir
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </SpaceShell>
  );
}
