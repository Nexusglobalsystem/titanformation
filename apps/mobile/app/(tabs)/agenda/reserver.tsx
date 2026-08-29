import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRequireAuth } from "../../../src/hooks/useRequireAuth";
import { SignInPrompt } from "../../../src/components/SignInPrompt";
import {
  useCreateBooking,
  useMyBookings,
  useTrainerAvailability,
  useTrainers,
} from "../../../src/features/reservations/useReservations";
import { DAYS_AHEAD, toMondayIndex } from "../../../src/features/reservations/computeAvailableSlots";
import { useAppTheme } from "../../../src/theme/ThemeProvider";
import { Card } from "../../../src/components/Card";
import { Badge } from "../../../src/components/Badge";
import { EmptyState } from "../../../src/components/EmptyState";
import { SubmitButton } from "../../../src/components/form/SubmitButton";
import { ErrorText } from "../../../src/components/form/ErrorText";
import { IconCalendar } from "../../../src/components/Icon";

const WEEKDAY_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const WEEKDAY_LABELS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const MONTH_SHORT = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

const BOOKING_STATUS_LABELS: Record<string, string> = {
  demandee: "Demandée",
  confirmee: "Confirmée",
  annulee: "Annulée",
  terminee: "Terminée",
  absent: "Absent",
};

const BOOKING_STATUS_VARIANTS: Record<string, "neutral" | "success" | "warning" | "error"> = {
  demandee: "warning",
  confirmee: "success",
  annulee: "error",
  terminee: "success",
  absent: "error",
};

// Équivalent RN de apps/web/src/app/apprenant/reservations/page.tsx —
// même algorithme de disponibilité (computeAvailableSlots, lot 4.2), piloté
// par du state React local plutôt que des searchParams (RN n'a pas d'URL).
export default function ReserverScreen() {
  const { theme } = useAppTheme();
  const { isAuthenticated, session, loading: authLoading } = useRequireAuth();
  const userId = session?.user.id;

  const { data: trainers, isLoading: trainersLoading } = useTrainers();
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null);
  const { data: availability, isLoading: availabilityLoading } = useTrainerAvailability(
    selectedTrainerId ?? undefined,
  );
  const { data: myBookings } = useMyBookings(userId);
  const createBooking = useCreateBooking(userId);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedHeure, setSelectedHeure] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedTrainer = trainers?.find((t) => t.id === selectedTrainerId) ?? null;
  const calendarDays = availability?.calendarDays ?? [];
  const slotsByDate = availability?.slotsByDate ?? {};
  const firstAvailableDate = useMemo(() => calendarDays.find((d) => d.hasSlots)?.key, [calendarDays]);
  const effectiveDate = selectedDate && slotsByDate[selectedDate] ? selectedDate : firstAvailableDate;
  const daySlots = effectiveDate ? (slotsByDate[effectiveDate] ?? []) : [];
  const morningSlots = daySlots.filter((s) => s.start_time < "13:00");
  const afternoonSlots = daySlots.filter((s) => s.start_time >= "13:00");
  const chosenSlot = daySlots.find((s) => s.start_time === selectedHeure);

  function selectTrainer(id: string) {
    setSelectedTrainerId(id);
    setSelectedDate(null);
    setSelectedHeure(null);
    setSuccess(false);
    setFormError(null);
  }

  async function handleConfirm() {
    if (!selectedTrainer || !effectiveDate || !chosenSlot) return;
    if (!reason.trim()) {
      setFormError("Indique le motif du rendez-vous avant de confirmer.");
      return;
    }
    setFormError(null);
    try {
      await createBooking.mutateAsync({
        trainerId: selectedTrainer.id,
        bookingDate: effectiveDate,
        startTime: chosenSlot.start_time,
        endTime: chosenSlot.end_time,
        reason: reason.trim(),
      });
      setSuccess(true);
      setSelectedHeure(null);
      setReason("");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Une erreur est survenue.");
    }
  }

  if (authLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <SignInPrompt message="Connectez-vous pour réserver un rendez-vous." />;
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-6 px-gutter py-6">
      <Card>
        <Text className="mb-4 font-display text-lg font-semibold text-foreground">Réserver un rendez-vous</Text>
        {success && <Text className="mb-3 font-body text-sm text-success">Rendez-vous confirmé.</Text>}

        {trainersLoading ? (
          <ActivityIndicator />
        ) : !trainers || trainers.length === 0 ? (
          <Text className="font-body text-sm text-foreground-muted">Aucun formateur disponible.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            {trainers.map((t) => {
              const isSelected = t.id === selectedTrainerId;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => selectTrainer(t.id)}
                  className={[
                    "h-9 flex-row items-center gap-2 rounded-full border px-3",
                    isSelected ? "border-primary bg-primary" : "border-border",
                  ].join(" ")}
                >
                  <Text className={["font-body text-sm", isSelected ? "text-on-primary" : "text-foreground"].join(" ")}>
                    {t.first_name} {t.last_name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {selectedTrainer && (
          <View className="mt-4 gap-4 rounded-xl border border-border bg-surface p-4">
            {availabilityLoading ? (
              <ActivityIndicator />
            ) : (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
                  {calendarDays.map((d) => {
                    const isSelected = d.key === effectiveDate;
                    return (
                      <Pressable
                        key={d.key}
                        disabled={!d.hasSlots}
                        onPress={() => {
                          setSelectedDate(d.key);
                          setSelectedHeure(null);
                        }}
                        className={[
                          "w-14 items-center gap-0.5 rounded-lg border py-2",
                          !d.hasSlots
                            ? "border-transparent opacity-30"
                            : isSelected
                              ? "border-accent bg-accent"
                              : "border-border bg-surface-elevated",
                        ].join(" ")}
                      >
                        <Text
                          className={[
                            "font-mono-label text-[10px] uppercase tracking-wide",
                            isSelected ? "text-on-accent" : "text-foreground-muted",
                          ].join(" ")}
                        >
                          {WEEKDAY_SHORT[toMondayIndex(d.date)]}
                        </Text>
                        <Text
                          className={["text-lg font-semibold", isSelected ? "text-on-accent" : "text-foreground"].join(" ")}
                        >
                          {d.date.getDate()}
                        </Text>
                        <Text
                          className={[
                            "font-mono-label text-[9px] uppercase",
                            isSelected ? "text-on-accent" : "text-foreground-muted",
                          ].join(" ")}
                        >
                          {MONTH_SHORT[d.date.getMonth()]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {!effectiveDate ? (
                  <Text className="font-body text-sm text-foreground-muted">
                    Aucun créneau disponible dans les {DAYS_AHEAD} prochains jours.
                  </Text>
                ) : (
                  <View className="gap-4 border-t border-border pt-4">
                    <Text className="font-body text-sm font-semibold text-foreground">
                      {WEEKDAY_LABELS[toMondayIndex(new Date(effectiveDate + "T00:00:00"))]}{" "}
                      {new Date(effectiveDate + "T00:00:00").toLocaleDateString("fr-FR")}
                    </Text>
                    {morningSlots.length > 0 && (
                      <SlotGroup
                        label="Matin"
                        slots={morningSlots}
                        selectedHeure={selectedHeure}
                        onSelect={setSelectedHeure}
                      />
                    )}
                    {afternoonSlots.length > 0 && (
                      <SlotGroup
                        label="Après-midi"
                        slots={afternoonSlots}
                        selectedHeure={selectedHeure}
                        onSelect={setSelectedHeure}
                      />
                    )}
                  </View>
                )}

                {chosenSlot && effectiveDate && (
                  <View className="gap-3 rounded-DEFAULT border border-accent bg-surface-elevated p-4">
                    <Text className="font-body text-sm text-foreground">
                      Rendez-vous avec {selectedTrainer.first_name} {selectedTrainer.last_name} le{" "}
                      {new Date(effectiveDate + "T00:00:00").toLocaleDateString("fr-FR")} à {chosenSlot.start_time}
                    </Text>
                    <View className="gap-1.5">
                      <Text className="font-body text-sm font-medium text-foreground">Motif du rendez-vous</Text>
                      <TextInput
                        value={reason}
                        onChangeText={setReason}
                        multiline
                        numberOfLines={2}
                        accessibilityLabel="Motif du rendez-vous"
                        placeholder="Ex. point sur mon projet, difficulté sur le module 2…"
                        placeholderTextColor={theme.colors.foregroundMuted}
                        className="min-h-16 rounded border border-border bg-surface px-3 py-2 font-body text-sm text-foreground"
                      />
                      <Text className="font-body text-xs text-foreground-muted">
                        Le formateur verra ce motif avant votre rendez-vous.
                      </Text>
                    </View>
                    {formError && <ErrorText>{formError}</ErrorText>}
                    <SubmitButton onPress={handleConfirm} loading={createBooking.isPending}>
                      Confirmer la réservation
                    </SubmitButton>
                  </View>
                )}
              </>
            )}
          </View>
        )}
      </Card>

      <Card>
        <Text className="mb-3 font-display text-base font-semibold text-foreground">Mes réservations</Text>
        {!myBookings || myBookings.length === 0 ? (
          <EmptyState icon={<IconCalendar size={20} color={theme.colors.foregroundMuted} />} title="Aucune réservation pour le moment." />
        ) : (
          <View className="gap-3">
            {myBookings.map((booking) => {
              const trainer = booking.profiles;
              return (
                <View key={booking.id} className="gap-2 rounded-DEFAULT border border-border p-3">
                  <Text className="font-body text-sm font-semibold text-foreground">
                    {trainer ? `${trainer.first_name ?? ""} ${trainer.last_name ?? ""}`.trim() : "—"}
                  </Text>
                  <Text className="font-body text-xs text-foreground-muted">
                    {new Date(booking.booking_date).toLocaleDateString("fr-FR")} · {booking.start_time.slice(0, 5)} –{" "}
                    {booking.end_time.slice(0, 5)}
                  </Text>
                  {booking.reason && (
                    <Text className="font-body text-xs text-foreground-muted">Motif : {booking.reason}</Text>
                  )}
                  <Badge variant={BOOKING_STATUS_VARIANTS[booking.status] ?? "neutral"}>
                    {BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
                  </Badge>
                </View>
              );
            })}
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

function SlotGroup({
  label,
  slots,
  selectedHeure,
  onSelect,
}: {
  label: string;
  slots: { start_time: string; end_time: string }[];
  selectedHeure: string | null;
  onSelect: (time: string) => void;
}) {
  return (
    <View className="gap-2">
      <Text className="font-mono-label text-[11px] uppercase tracking-wide text-foreground-muted">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {slots.map((slot) => {
          const isSelected = selectedHeure === slot.start_time;
          return (
            <Pressable
              key={slot.start_time}
              onPress={() => onSelect(slot.start_time)}
              className={[
                "h-9 items-center justify-center rounded-DEFAULT border px-3",
                isSelected ? "border-accent bg-accent" : "border-border",
              ].join(" ")}
            >
              <Text className={["font-body text-sm", isSelected ? "text-on-accent" : "text-foreground"].join(" ")}>
                {slot.start_time}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
