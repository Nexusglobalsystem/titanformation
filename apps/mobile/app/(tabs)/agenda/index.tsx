import { Link } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useRequireAuth } from "../../../src/hooks/useRequireAuth";
import { SignInPrompt } from "../../../src/components/SignInPrompt";
import { useAgenda, useCancelBooking, type BookingEntry, type SlotEntry } from "../../../src/features/agenda/useAgenda";
import { canJoinSlot } from "../../../src/lib/joinWindow";
import { useAppTheme } from "../../../src/theme/ThemeProvider";
import { Card } from "../../../src/components/Card";
import { Badge } from "../../../src/components/Badge";
import { SubmitButton } from "../../../src/components/form/SubmitButton";
import { IconCalendar, IconLock } from "../../../src/components/Icon";

const HALF_DAY_LABELS: Record<string, string> = { matin: "Matin", apres_midi: "Après-midi" };

const MODALITY_LABELS: Record<string, string> = {
  presentiel: "Présentiel",
  livekit: "Classe virtuelle",
  autoapprentissage: "Auto-apprentissage",
  evaluation: "Évaluation",
  certification: "Certification",
};

const MODALITY_VARIANTS: Record<string, "neutral" | "success" | "warning" | "featured"> = {
  presentiel: "neutral",
  livekit: "featured",
  autoapprentissage: "success",
  evaluation: "warning",
  certification: "warning",
};

const BOOKING_STATUS_LABELS: Record<string, string> = { demandee: "Demandée", confirmee: "Confirmée" };

// Équivalent RN de apps/web/src/app/apprenant/agenda/page.tsx. "Rejoindre"
// LiveKit reste un badge "Disponible sur le web" (même motif qu'au lot 3.2,
// LiveKit hors périmètre mobile v1). La réservation d'un nouveau rendez-vous
// (calendrier 21 jours) arrive au lot 4.2.
export default function AgendaScreen() {
  const { theme } = useAppTheme();
  const { isAuthenticated, session, loading: authLoading } = useRequireAuth();
  const { data, isLoading } = useAgenda(session?.user.id);
  const cancelBooking = useCancelBooking(session?.user.id);

  if (authLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <SignInPrompt message="Connectez-vous pour accéder à votre agenda." />;
  }

  if (isLoading || !data) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  const { entriesByDate, orderedDates, moduleSections } = data;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-6 px-gutter py-6">
      <View>
        <Text className="font-display text-2xl font-bold text-foreground">Mon agenda</Text>
        <Text className="mt-1 font-body text-sm text-foreground-muted">
          Vos créneaux de formation et vos rendez-vous, dans l&apos;ordre chronologique.
        </Text>
      </View>

      <Card>
        {orderedDates.length === 0 ? (
          <Text className="font-body text-sm text-foreground-muted">Rien de prévu pour le moment.</Text>
        ) : (
          <View className="gap-6">
            {orderedDates.map((dateKey) => (
              <View key={dateKey} className="gap-2">
                <Text className="font-mono-label text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                  {new Date(dateKey + "T00:00:00").toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                  })}
                </Text>
                <View className="gap-2">
                  {entriesByDate.get(dateKey)!.map((entry) =>
                    entry.type === "slot" ? (
                      <SlotRow key={`slot-${entry.id}`} entry={entry} />
                    ) : (
                      <BookingRow
                        key={`booking-${entry.id}`}
                        entry={entry}
                        onCancel={() => cancelBooking.mutate(entry.id)}
                        cancelling={cancelBooking.isPending}
                      />
                    ),
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </Card>

      {moduleSections.length > 0 && (
        <Card>
          <Text className="mb-4 font-display text-base font-semibold text-foreground">Mes modules</Text>
          <View className="gap-6">
            {moduleSections.map((section) => (
              <View key={section.enrollmentId} className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="font-body text-sm font-semibold text-foreground">{section.trainingTitle}</Text>
                  <Link href={`/formations/${section.enrollmentId}`} className="font-body text-xs text-accent-text">
                    Voir le programme
                  </Link>
                </View>
                <View className="gap-1.5">
                  {[...section.modules]
                    .sort((a, b) => a.position - b.position)
                    .map((module) => {
                      const unlock = section.unlockMap.get(module.id) ?? { unlocked: true, lockReason: null };
                      return unlock.unlocked ? (
                        <Link
                          key={module.id}
                          href={`/formations/${section.enrollmentId}`}
                          className="flex-row items-center justify-between rounded-DEFAULT border border-border p-3"
                        >
                          <Text className="font-body text-sm text-foreground">{module.title}</Text>
                        </Link>
                      ) : (
                        <View key={module.id} className="flex-row items-center justify-between rounded-DEFAULT border border-border bg-surface p-3 opacity-60">
                          <View>
                            <Text className="font-body text-sm text-foreground">{module.title}</Text>
                            {unlock.lockReason && (
                              <Text className="font-body text-xs text-foreground-muted">{unlock.lockReason}</Text>
                            )}
                          </View>
                          <IconLock size={16} color={theme.colors.foregroundMuted} />
                        </View>
                      );
                    })}
                </View>
              </View>
            ))}
          </View>
        </Card>
      )}
    </ScrollView>
  );
}

function SlotRow({ entry }: { entry: SlotEntry }) {
  return (
    <View className="flex-row flex-wrap items-center justify-between gap-2 rounded-DEFAULT border border-border p-3">
      <View>
        <Text className="font-body text-sm font-semibold text-foreground">{entry.trainingTitle}</Text>
        <Text className="font-body text-xs text-foreground-muted">
          {HALF_DAY_LABELS[entry.halfDay] ?? entry.halfDay} · {entry.sessionReference}
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        <Badge variant={MODALITY_VARIANTS[entry.modality] ?? "neutral"}>
          {MODALITY_LABELS[entry.modality] ?? entry.modality}
        </Badge>
        {entry.modality === "livekit" && canJoinSlot(entry.startsAt, entry.endsAt) && (
          <Badge variant="neutral">Disponible sur le web</Badge>
        )}
      </View>
    </View>
  );
}

function BookingRow({
  entry,
  onCancel,
  cancelling,
}: {
  entry: BookingEntry;
  onCancel: () => void;
  cancelling: boolean;
}) {
  const { theme } = useAppTheme();
  return (
    <View className="flex-row flex-wrap items-center justify-between gap-2 rounded-DEFAULT border border-border bg-accent/5 p-3">
      <View className="flex-row items-center gap-2">
        <IconCalendar size={16} color={theme.colors.foreground} />
        <View>
          <Text className="font-body text-sm font-semibold text-foreground">Rendez-vous — {entry.trainerName}</Text>
          <Text className="font-body text-xs text-foreground-muted">
            {entry.startTime.slice(0, 5)} – {entry.endTime.slice(0, 5)}
            {entry.reason ? ` · ${entry.reason}` : ""}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center gap-2">
        <Badge variant={entry.status === "confirmee" ? "success" : "warning"}>
          {BOOKING_STATUS_LABELS[entry.status] ?? entry.status}
        </Badge>
        {entry.status === "confirmee" && (
          <SubmitButton onPress={onCancel} loading={cancelling}>
            Annuler
          </SubmitButton>
        )}
      </View>
    </View>
  );
}
