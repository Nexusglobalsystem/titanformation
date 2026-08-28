import { useState } from "react";
import { Link } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useRequireAuth } from "../../src/hooks/useRequireAuth";
import { SignInPrompt } from "../../src/components/SignInPrompt";
import { useDashboard } from "../../src/features/dashboard/useDashboard";
import { useSignAttendance } from "../../src/features/dashboard/useSignAttendance";
import { useAppTheme } from "../../src/theme/ThemeProvider";
import { Card } from "../../src/components/Card";
import { Progress } from "../../src/components/Progress";
import { Badge } from "../../src/components/Badge";
import { EmptyState } from "../../src/components/EmptyState";
import { SubmitButton } from "../../src/components/form/SubmitButton";
import { ErrorText } from "../../src/components/form/ErrorText";
import {
  IconCalendar,
  IconCheckCircle,
  IconClipboardCheck,
  IconClock,
  IconGraduationCap,
  IconLayers,
} from "../../src/components/Icon";
import { canJoinSlot } from "../../src/lib/joinWindow";

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

// Équivalent RN de apps/web/src/app/apprenant/page.tsx. Lots 3.1 (héro +
// prochain rendez-vous) et 3.2 (Mes formations + émargement) réunis sur
// le même écran.
export default function AccueilScreen() {
  const { theme } = useAppTheme();
  const { isAuthenticated, session, loading: authLoading } = useRequireAuth();
  const { data, isLoading } = useDashboard(session?.user.id);
  const signAttendance = useSignAttendance(session?.user.id);
  const [signError, setSignError] = useState<string | null>(null);

  if (authLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <SignInPrompt message="Connectez-vous pour accéder à votre espace apprenant." />;
  }

  if (isLoading || !data) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  const {
    profile,
    enrollments,
    confirmedEnrollments,
    nextBooking,
    inProgress,
    lessonCountByTraining,
    completedCountByEnrollment,
    unsignedCount,
    attendanceGroups,
  } = data;

  async function handleSign(attendanceId: string) {
    setSignError(null);
    try {
      await signAttendance.mutateAsync(attendanceId);
    } catch (err) {
      setSignError(err instanceof Error ? err.message : "Une erreur est survenue.");
    }
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-6 px-gutter py-6">
      <View>
        <Text className="font-display text-2xl font-bold text-foreground">
          Bienvenue{profile?.first_name ? `, ${profile.first_name}` : ""}
        </Text>
        <Text className="mt-1 font-body text-sm text-foreground-muted">
          Voici où en est votre parcours de formation.
        </Text>
      </View>

      <View className="gap-4 overflow-hidden rounded-xl bg-primary p-6">
        {inProgress ? (
          <>
            <View className="mb-1 flex-row items-center gap-1.5 self-start rounded-full bg-accent/10 px-3 py-1">
              <IconClock size={14} color={theme.colors.accent} />
              <Text className="font-mono-label text-[11px] uppercase tracking-wide" style={{ color: theme.colors.accent }}>
                En cours
              </Text>
            </View>
            <Text className="font-display text-xl font-bold text-on-primary">
              {inProgress.enrollment.sessions?.trainings?.title ?? "Formation"}
            </Text>
            <Text className="font-body text-sm text-on-primary/70">
              {inProgress.completed}/{inProgress.total} leçons terminées
            </Text>
            <Progress value={inProgress.completed} max={inProgress.total} />
            <Link href={`/formations/${inProgress.enrollment.id}`} asChild>
              <SubmitButton onPress={() => {}}>Reprendre</SubmitButton>
            </Link>
          </>
        ) : confirmedEnrollments.length > 0 ? (
          <>
            <View className="mb-1 flex-row items-center gap-1.5 self-start rounded-full bg-accent/10 px-3 py-1">
              <IconCheckCircle size={14} color={theme.colors.accent} />
              <Text className="font-mono-label text-[11px] uppercase tracking-wide" style={{ color: theme.colors.accent }}>
                À jour
              </Text>
            </View>
            <Text className="font-display text-xl font-bold text-on-primary">
              Toutes vos formations sont terminées
            </Text>
            <Text className="font-body text-sm text-on-primary/70">
              Découvrez un nouveau programme dans le catalogue.
            </Text>
            <Link href="/(tabs)/formations" asChild>
              <SubmitButton onPress={() => {}}>Parcourir le catalogue</SubmitButton>
            </Link>
          </>
        ) : (
          <>
            <Text className="font-display text-xl font-bold text-on-primary">Aucune formation en cours</Text>
            <Text className="font-body text-sm text-on-primary/70">
              Inscrivez-vous à une formation pour démarrer votre parcours.
            </Text>
            <Link href="/(tabs)/formations" asChild>
              <SubmitButton onPress={() => {}}>Parcourir le catalogue</SubmitButton>
            </Link>
          </>
        )}
      </View>

      <Card>
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="font-display text-base font-semibold text-foreground">Prochain rendez-vous</Text>
          <IconCalendar size={18} color={theme.colors.foreground} />
        </View>
        {nextBooking ? (
          <View className="rounded-DEFAULT border border-border bg-surface p-3">
            <Text className="font-mono-label text-[11px] uppercase tracking-wide text-foreground-muted">
              {new Date(nextBooking.booking_date + "T00:00:00").toLocaleDateString("fr-FR", {
                weekday: "short",
                day: "2-digit",
                month: "short",
              })}{" "}
              · {nextBooking.start_time.slice(0, 5)}
            </Text>
            <Text className="mt-1 font-body text-sm font-medium text-foreground">
              {nextBooking.profiles
                ? `${nextBooking.profiles.first_name ?? ""} ${nextBooking.profiles.last_name ?? ""}`.trim()
                : "Formateur"}
            </Text>
            {nextBooking.reason && (
              <Text numberOfLines={1} className="mt-0.5 font-body text-xs text-foreground-muted">
                {nextBooking.reason}
              </Text>
            )}
          </View>
        ) : (
          <Text className="font-body text-sm text-foreground-muted">Aucun rendez-vous à venir.</Text>
        )}
        <Link href="/(tabs)/agenda" className="mt-3 font-body text-sm text-accent-text">
          {nextBooking ? "Voir mes réservations" : "Réserver un rendez-vous"}
        </Link>
      </Card>

      <View className="gap-4">
        <Text className="font-display text-lg font-semibold text-foreground">Mes formations</Text>
        {enrollments.length === 0 ? (
          <Card>
            <EmptyState
              icon={<IconGraduationCap size={20} color={theme.colors.foregroundMuted} />}
              title="Aucune inscription pour le moment."
              action={
                <Link href="/(tabs)/formations" className="font-body text-sm text-accent-text">
                  Parcourir le catalogue
                </Link>
              }
            />
          </Card>
        ) : (
          <View className="gap-3">
            {enrollments.map((enrollment) => {
              const trainingSession = enrollment.sessions;
              const training = trainingSession?.trainings;
              const canAccessProgramme = ["confirme", "termine"].includes(enrollment.status);
              const totalLessons = training?.id ? (lessonCountByTraining.get(training.id) ?? 0) : 0;
              const completedLessons = completedCountByEnrollment.get(enrollment.id) ?? 0;
              return (
                <View key={enrollment.id} className="gap-3 rounded-DEFAULT border border-border bg-surface-elevated p-4">
                  <View className="flex-row items-start justify-between gap-2">
                    <View className="h-9 w-9 items-center justify-center rounded-DEFAULT bg-accent/15">
                      <IconLayers size={18} color={theme.colors.accentText} />
                    </View>
                    <Badge variant={STATUS_VARIANTS[enrollment.status] ?? "neutral"}>
                      {STATUS_LABELS[enrollment.status] ?? enrollment.status}
                    </Badge>
                  </View>
                  <View>
                    <Text numberOfLines={2} className="font-body text-sm font-semibold text-foreground">
                      {training?.title ?? "Formation"}
                    </Text>
                    {trainingSession && (
                      <Text className="mt-0.5 font-body text-xs text-foreground-muted">
                        {new Date(trainingSession.starts_on).toLocaleDateString("fr-FR")} –{" "}
                        {new Date(trainingSession.ends_on).toLocaleDateString("fr-FR")}
                      </Text>
                    )}
                  </View>
                  {canAccessProgramme && totalLessons > 0 && (
                    <Progress value={completedLessons} max={totalLessons} label={`${completedLessons}/${totalLessons} leçons`} />
                  )}
                  {canAccessProgramme && (
                    <Link href={`/formations/${enrollment.id}`} className="flex-row items-center gap-1 font-body text-sm font-medium text-accent-text">
                      Voir le programme
                    </Link>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>

      <Card>
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="font-display text-base font-semibold text-foreground">Émargement</Text>
          {unsignedCount > 0 && <Badge variant="warning">{`${unsignedCount} à signer`}</Badge>}
        </View>
        {signError && <ErrorText>{signError}</ErrorText>}
        {attendanceGroups.length === 0 ? (
          <EmptyState
            icon={<IconClipboardCheck size={20} color={theme.colors.foregroundMuted} />}
            title="Aucun créneau d'émargement pour le moment."
          />
        ) : (
          <View className="gap-6">
            {attendanceGroups.map((group) => (
              <View key={group.key} className="gap-2">
                <Text className="font-mono-label text-xs uppercase tracking-wide text-foreground-muted">
                  {group.label} · {group.key}
                </Text>
                <View className="gap-2">
                  {group.items.map((attendance) => {
                    const slot = attendance.session_slots;
                    return (
                      <View key={attendance.id} className="gap-2 rounded-DEFAULT border border-border p-4">
                        {slot && (
                          <Text className="font-body text-sm font-semibold text-foreground">
                            {new Date(slot.slot_date).toLocaleDateString("fr-FR")} ·{" "}
                            {HALF_DAY_LABELS[slot.half_day] ?? slot.half_day}
                          </Text>
                        )}
                        <View className="flex-row items-center gap-2">
                          {slot && slot.modality === "livekit" && canJoinSlot(slot.starts_at, slot.ends_at) && (
                            <Badge variant="neutral">Disponible sur le web</Badge>
                          )}
                          {attendance.signed_at ? (
                            <Badge variant="success">{`Signé le ${new Date(attendance.signed_at).toLocaleString("fr-FR")}`}</Badge>
                          ) : (
                            <SubmitButton
                              onPress={() => handleSign(attendance.id)}
                              loading={signAttendance.isPending}
                            >
                              Signer ma présence
                            </SubmitButton>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}
      </Card>
    </ScrollView>
  );
}
