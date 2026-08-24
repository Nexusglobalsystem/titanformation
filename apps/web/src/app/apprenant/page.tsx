import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SpaceShell } from "@/components/SpaceShell";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Progress } from "@titan-kinetic/ui";
import {
  IconArrowRight,
  IconCalendar,
  IconCheckCircle,
  IconClipboardCheck,
  IconClock,
  IconGraduationCap,
  IconLayers,
  IconVideo,
} from "@/components/icons";
import { SignAttendanceButton } from "./_components/SignAttendanceButton";
import { canJoinSlot } from "@/lib/joinWindow";

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

const HALF_DAY_LABELS: Record<string, string> = {
  matin: "Matin",
  apres_midi: "Après-midi",
};

export default async function ApprenantPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name")
    .eq("id", user!.id)
    .single();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id, status, created_at, sessions(reference, starts_on, ends_on, trainings(id, title, slug))")
    .eq("learner_id", user!.id)
    .order("created_at", { ascending: false });

  const confirmedEnrollments = (enrollments ?? []).filter((e) =>
    ["confirme", "termine"].includes(e.status),
  );
  const trainingIds = [
    ...new Set(confirmedEnrollments.map((e) => e.sessions?.trainings?.id).filter((id): id is string => Boolean(id))),
  ];
  const enrollmentIds = confirmedEnrollments.map((e) => e.id);

  const { data: lessonRows } = trainingIds.length
    ? await supabase
        .from("modules")
        .select("training_id, lessons(id)")
        .in("training_id", trainingIds)
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

  const { data: attendancesRaw } = await supabase
    .from("attendances")
    .select(
      "id, signed_at, present, session_slots(id, slot_date, half_day, starts_at, ends_at, modality, sessions(reference, trainings(title)))",
    );

  const HALF_DAY_ORDER: Record<string, number> = { matin: 0, apres_midi: 1 };
  const attendances = [...(attendancesRaw ?? [])].sort((a, b) => {
    const dateDiff = (a.session_slots?.slot_date ?? "").localeCompare(b.session_slots?.slot_date ?? "");
    if (dateDiff !== 0) return dateDiff;
    return (
      (HALF_DAY_ORDER[a.session_slots?.half_day ?? ""] ?? 0) -
      (HALF_DAY_ORDER[b.session_slots?.half_day ?? ""] ?? 0)
    );
  });

  const today = new Date().toISOString().slice(0, 10);
  const { data: nextBooking } = await supabase
    .from("bookings")
    .select("booking_date, start_time, reason, profiles!bookings_trainer_id_fkey(first_name, last_name)")
    .eq("learner_id", user!.id)
    .eq("status", "confirmee")
    .gte("booking_date", today)
    .order("booking_date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(1)
    .maybeSingle();

  // Formation "à reprendre" : inscription confirmée avec un programme en cours, pas encore terminée.
  const inProgress = confirmedEnrollments
    .map((e) => {
      const trainingId = e.sessions?.trainings?.id;
      const total = trainingId ? (lessonCountByTraining.get(trainingId) ?? 0) : 0;
      const completed = completedCountByEnrollment.get(e.id) ?? 0;
      return { enrollment: e, total, completed };
    })
    .find((x) => x.total > 0 && x.completed < x.total);

  const unsignedCount = attendances.filter((a) => !a.signed_at).length;

  // Regroupées par session (= une instance datée d'une formation) plutôt qu'en
  // liste plate — un apprenant inscrit à deux formations voit deux blocs
  // distincts au lieu de 20+ lignes indifférenciées.
  const attendanceGroups = (() => {
    const map = new Map<string, { key: string; label: string; items: typeof attendances }>();
    for (const a of attendances) {
      const session = a.session_slots?.sessions;
      const key = session?.reference ?? "—";
      const label = session?.trainings?.title ?? "Formation";
      if (!map.has(key)) map.set(key, { key, label, items: [] });
      map.get(key)!.items.push(a);
    }
    return Array.from(map.values());
  })();

  return (
    <SpaceShell title="Espace apprenant">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">
            Bienvenue{profile?.first_name ? `, ${profile.first_name}` : ""}
          </h1>
          <p className="mt-1 font-body text-sm text-foreground-muted">
            Voici où en est votre parcours de formation.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Hero : formation à reprendre */}
          <div className="flex flex-col justify-between overflow-hidden rounded-xl border border-accent/30 bg-primary p-6 text-on-primary lg:col-span-2">
            {inProgress ? (
              <>
                <div>
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1">
                    <IconClock size={14} />
                    <span className="font-mono-label text-[11px] uppercase tracking-wide text-accent">
                      En cours
                    </span>
                  </div>
                  <h2 className="font-display text-xl font-bold md:text-2xl">
                    {inProgress.enrollment.sessions?.trainings?.title ?? "Formation"}
                  </h2>
                  <p className="mt-1 font-body text-sm text-on-primary/70">
                    {inProgress.completed}/{inProgress.total} leçons terminées
                  </p>
                </div>
                <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="w-full sm:max-w-xs">
                    <Progress value={inProgress.completed} max={inProgress.total} />
                  </div>
                  <Link
                    href={`/apprenant/formations/${inProgress.enrollment.id}`}
                    className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-DEFAULT bg-accent px-5 font-body text-sm font-semibold text-on-accent hover:bg-accent/90"
                  >
                    Reprendre
                    <IconArrowRight />
                  </Link>
                </div>
              </>
            ) : confirmedEnrollments.length > 0 ? (
              <div>
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1">
                  <IconCheckCircle size={14} />
                  <span className="font-mono-label text-[11px] uppercase tracking-wide text-accent">
                    À jour
                  </span>
                </div>
                <h2 className="font-display text-xl font-bold md:text-2xl">Toutes vos formations sont terminées</h2>
                <p className="mt-2 font-body text-sm text-on-primary/70">
                  Découvrez un nouveau programme dans le catalogue.
                </p>
                <Link
                  href="/formations"
                  className="mt-4 inline-flex h-10 items-center gap-2 rounded-DEFAULT bg-accent px-4 font-body text-sm font-semibold text-on-accent hover:bg-accent/90"
                >
                  Parcourir le catalogue
                  <IconArrowRight />
                </Link>
              </div>
            ) : (
              <div>
                <h2 className="font-display text-xl font-bold md:text-2xl">Aucune formation en cours</h2>
                <p className="mt-2 font-body text-sm text-on-primary/70">
                  Inscrivez-vous à une formation pour démarrer votre parcours.
                </p>
                <Link
                  href="/formations"
                  className="mt-4 inline-flex h-10 items-center gap-2 rounded-DEFAULT bg-accent px-4 font-body text-sm font-semibold text-on-accent hover:bg-accent/90"
                >
                  Parcourir le catalogue
                  <IconArrowRight />
                </Link>
              </div>
            )}
          </div>

          {/* Prochain rendez-vous */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">Prochain rendez-vous</CardTitle>
              <IconCalendar size={18} />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {nextBooking ? (
                <div className="rounded-DEFAULT border border-accent/40 bg-surface-elevated p-3">
                  <p className="font-mono-label text-[11px] uppercase tracking-wide text-foreground-muted">
                    {new Date(nextBooking.booking_date + "T00:00:00").toLocaleDateString("fr-FR", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                    })}{" "}
                    · {nextBooking.start_time.slice(0, 5)}
                  </p>
                  <p className="mt-1 font-body text-sm font-medium text-foreground">
                    {nextBooking.profiles
                      ? `${nextBooking.profiles.first_name ?? ""} ${nextBooking.profiles.last_name ?? ""}`.trim()
                      : "Formateur"}
                  </p>
                  {nextBooking.reason && (
                    <p className="mt-0.5 font-body text-xs text-foreground-muted line-clamp-1">{nextBooking.reason}</p>
                  )}
                </div>
              ) : (
                <p className="font-body text-sm text-foreground-muted">Aucun rendez-vous à venir.</p>
              )}
              <Link
                href="/apprenant/reservations"
                className="font-body text-sm text-accent-text hover:underline"
              >
                {nextBooking ? "Voir mes réservations" : "Réserver un rendez-vous"}
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Mes formations — grille */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-foreground">Mes formations</h2>
          </div>
          {!enrollments || enrollments.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <EmptyState
                  icon={<IconGraduationCap />}
                  title="Aucune inscription pour le moment."
                  action={
                    <a href="/formations" className="font-body text-sm text-accent-text hover:underline">
                      Parcourir le catalogue
                    </a>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {enrollments.map((enrollment) => {
                const session = enrollment.sessions;
                const training = session?.trainings;
                const canAccessProgramme = ["confirme", "termine"].includes(enrollment.status);
                const totalLessons = training?.id ? (lessonCountByTraining.get(training.id) ?? 0) : 0;
                const completedLessons = completedCountByEnrollment.get(enrollment.id) ?? 0;
                return (
                  <div
                    key={enrollment.id}
                    className="flex flex-col gap-3 rounded-DEFAULT border border-border bg-surface-elevated p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-DEFAULT bg-accent/15 text-accent-text">
                        <IconLayers size={18} />
                      </div>
                      <Badge variant={STATUS_VARIANTS[enrollment.status] ?? "neutral"}>
                        {STATUS_LABELS[enrollment.status] ?? enrollment.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="font-body text-sm font-semibold text-foreground line-clamp-2">
                        {training?.title ?? "Formation"}
                      </p>
                      {session && (
                        <p className="mt-0.5 font-body text-xs text-foreground-muted">
                          {new Date(session.starts_on).toLocaleDateString("fr-FR")} –{" "}
                          {new Date(session.ends_on).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                    </div>
                    {canAccessProgramme && totalLessons > 0 && (
                      <Progress
                        value={completedLessons}
                        max={totalLessons}
                        label={`${completedLessons}/${totalLessons} leçons`}
                      />
                    )}
                    {canAccessProgramme && (
                      <Link
                        href={`/apprenant/formations/${enrollment.id}`}
                        className="mt-auto inline-flex items-center gap-1 font-body text-sm font-medium text-accent-text hover:underline"
                      >
                        Voir le programme
                        <IconArrowRight />
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Émargement</CardTitle>
            {unsignedCount > 0 && <Badge variant="warning">{unsignedCount} à signer</Badge>}
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {!attendances || attendances.length === 0 ? (
              <EmptyState icon={<IconClipboardCheck />} title="Aucun créneau d'émargement pour le moment." />
            ) : (
              attendanceGroups.map((group) => (
                <div key={group.key} className="flex flex-col gap-2">
                  <p className="font-mono-label text-xs uppercase tracking-wide text-foreground-muted">
                    {group.label} · {group.key}
                  </p>
                  <div className="flex flex-col gap-2">
                    {group.items.map((attendance) => {
                      const slot = attendance.session_slots;
                      return (
                        <div
                          key={attendance.id}
                          className="flex flex-col gap-2 rounded-DEFAULT border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            {slot && (
                              <p className="font-body text-sm font-semibold text-foreground">
                                {new Date(slot.slot_date).toLocaleDateString("fr-FR")} ·{" "}
                                {HALF_DAY_LABELS[slot.half_day] ?? slot.half_day}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {slot && slot.modality === "livekit" && canJoinSlot(slot.starts_at, slot.ends_at) && (
                              <Link href={`/salle/${slot.id}`}>
                                <Button variant="accent" size="sm" className="gap-1.5">
                                  <IconVideo size={16} />
                                  Rejoindre
                                </Button>
                              </Link>
                            )}
                            {attendance.signed_at ? (
                              <Badge variant="success">
                                Signé le {new Date(attendance.signed_at).toLocaleString("fr-FR")}
                              </Badge>
                            ) : (
                              <SignAttendanceButton attendanceId={attendance.id} />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </SpaceShell>
  );
}
