import { Link } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useRequireAuth } from "../../src/hooks/useRequireAuth";
import { SignInPrompt } from "../../src/components/SignInPrompt";
import { useDashboard } from "../../src/features/dashboard/useDashboard";
import { useAppTheme } from "../../src/theme/ThemeProvider";
import { Card } from "../../src/components/Card";
import { Progress } from "../../src/components/Progress";
import { SubmitButton } from "../../src/components/form/SubmitButton";
import { IconArrowRight, IconCalendar, IconCheckCircle, IconClock } from "../../src/components/Icon";

// Équivalent RN de apps/web/src/app/apprenant/page.tsx. Lot 3.1 : données
// + carte héro ("à reprendre" / "à jour" / "aucune formation") + prochain
// rendez-vous. "Mes formations" et Émargement arrivent au lot 3.2.
export default function AccueilScreen() {
  const { theme } = useAppTheme();
  const { isAuthenticated, session, loading: authLoading } = useRequireAuth();
  const { data, isLoading } = useDashboard(session?.user.id);

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

  const { profile, confirmedEnrollments, nextBooking, inProgress } = data;

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

      <Card>
        <Text className="font-body text-sm text-foreground-muted">
          « Mes formations » et l&apos;émargement arrivent au lot 3.2.
        </Text>
      </Card>
    </ScrollView>
  );
}
