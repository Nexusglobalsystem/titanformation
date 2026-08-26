import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SpaceShell } from "@/components/SpaceShell";
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState, Progress } from "@titan-kinetic/ui";
import { IconGraduationCap } from "@/components/icons";

const STATUS_LABELS: Record<string, string> = {
  preinscrit: "Préinscrit",
  en_attente_paiement: "En attente de paiement",
  confirme: "Confirmé",
  annule: "Annulé",
  termine: "Terminé",
  abandonne: "Abandonné",
};

const STATUS_VARIANTS: Record<string, "neutral" | "success" | "warning" | "error"> = {
  preinscrit: "warning",
  en_attente_paiement: "warning",
  confirme: "success",
  annule: "error",
  termine: "success",
  abandonne: "error",
};

export default async function SalarieDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const supabase = await createClient();

  const { data: companyIds } = await supabase.rpc("managed_company_ids");
  const companyId = companyIds?.[0] ?? null;
  if (!companyId) notFound();

  const { data: membership } = await supabase
    .from("company_members")
    .select("user_id, profiles(first_name, last_name, email)")
    .eq("company_id", companyId)
    .eq("user_id", userId)
    .eq("role", "salarie")
    .maybeSingle();
  if (!membership || !membership.profiles) notFound();
  const p = membership.profiles;

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id, status, created_at, sessions(reference, starts_on, trainings(id, title))")
    .eq("learner_id", userId)
    .order("created_at", { ascending: false });

  const trainingIds = [
    ...new Set((enrollments ?? []).map((e) => e.sessions?.trainings?.id).filter((id): id is string => Boolean(id))),
  ];
  const enrollmentIds = (enrollments ?? []).map((e) => e.id);

  const { data: lessonRows } = trainingIds.length
    ? await supabase.from("modules").select("training_id, lessons(id)").in("training_id", trainingIds)
    : { data: [] };
  const lessonCountByTraining = new Map<string, number>();
  for (const row of lessonRows ?? []) {
    lessonCountByTraining.set(
      row.training_id,
      (lessonCountByTraining.get(row.training_id) ?? 0) + (row.lessons?.length ?? 0),
    );
  }

  const { data: progressRows } = enrollmentIds.length
    ? await supabase
        .from("learner_progress")
        .select("enrollment_id, completed_at")
        .in("enrollment_id", enrollmentIds)
        .not("completed_at", "is", null)
    : { data: [] };
  const completedCountByEnrollment = new Map<string, number>();
  for (const row of progressRows ?? []) {
    completedCountByEnrollment.set(row.enrollment_id, (completedCountByEnrollment.get(row.enrollment_id) ?? 0) + 1);
  }

  const { data: attendanceRows } = enrollmentIds.length
    ? await supabase.from("attendances").select("enrollment_id, signed_at").in("enrollment_id", enrollmentIds)
    : { data: [] };
  const attendanceStatsByEnrollment = new Map<string, { signed: number; total: number }>();
  for (const row of attendanceRows ?? []) {
    const stats = attendanceStatsByEnrollment.get(row.enrollment_id) ?? { signed: 0, total: 0 };
    stats.total += 1;
    if (row.signed_at) stats.signed += 1;
    attendanceStatsByEnrollment.set(row.enrollment_id, stats);
  }

  return (
    <SpaceShell title="Espace entreprise">
      <div className="flex max-w-3xl flex-col gap-6">
        <Link href="/entreprise/salaries" className="font-body text-sm text-accent-text hover:underline">
          ← Retour aux salariés
        </Link>

        <div>
          <h1 className="font-display text-xl font-semibold text-foreground">
            {`${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "—"}
          </h1>
          <p className="mt-1 font-body text-sm text-foreground-muted">{p.email}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Formations</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {!enrollments || enrollments.length === 0 ? (
              <EmptyState icon={<IconGraduationCap />} title="Aucune inscription pour le moment." />
            ) : (
              enrollments.map((enrollment) => {
                const training = enrollment.sessions?.trainings;
                const total = training?.id ? (lessonCountByTraining.get(training.id) ?? 0) : 0;
                const completed = completedCountByEnrollment.get(enrollment.id) ?? 0;
                const attendance = attendanceStatsByEnrollment.get(enrollment.id);
                return (
                  <div key={enrollment.id} className="flex flex-col gap-2 rounded-DEFAULT border border-border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-body text-sm font-semibold text-foreground">
                        {training?.title ?? "Formation"}
                      </p>
                      <Badge variant={STATUS_VARIANTS[enrollment.status] ?? "neutral"}>
                        {STATUS_LABELS[enrollment.status] ?? enrollment.status}
                      </Badge>
                    </div>
                    {total > 0 && (
                      <div className="flex flex-col gap-1">
                        <Progress value={completed} max={total} />
                        <p className="font-body text-xs text-foreground-muted">
                          {completed}/{total} leçons terminées
                        </p>
                      </div>
                    )}
                    {attendance && attendance.total > 0 && (
                      <p className="font-body text-xs text-foreground-muted">
                        Émargement : {attendance.signed}/{attendance.total} créneaux signés
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </SpaceShell>
  );
}
