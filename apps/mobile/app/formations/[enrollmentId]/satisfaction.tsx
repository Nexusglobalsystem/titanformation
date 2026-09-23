import { useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSatisfaction, useSubmitSatisfaction } from "../../../src/features/satisfaction/useSatisfaction";
import { useSession } from "../../../src/hooks/useSession";
import { useAppTheme } from "../../../src/theme/ThemeProvider";
import { SubmitButton } from "../../../src/components/form/SubmitButton";
import { ErrorText } from "../../../src/components/form/ErrorText";

// Équivalent RN de apps/web/.../formations/[enrollmentId]/satisfaction/page.tsx.
export default function SatisfactionScreen() {
  const { enrollmentId } = useLocalSearchParams<{ enrollmentId: string }>();
  const { theme } = useAppTheme();
  const { session } = useSession();
  const { data, isLoading } = useSatisfaction(enrollmentId ?? "");
  const submit = useSubmitSatisfaction(enrollmentId ?? "");
  const [values, setValues] = useState<Record<string, string | number>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center gap-2 bg-background px-gutter">
        <Text className="font-body text-foreground-muted">Formulaire indisponible.</Text>
      </View>
    );
  }

  const { trainingTitle, form, questions, alreadyAnswered } = data;

  async function handleSubmit() {
    if (!session) return;
    const missingNote = questions.find((q) => q.type === "note" && values[q.id] === undefined);
    if (missingNote) {
      setSubmitError("Merci de répondre à toutes les questions notées.");
      return;
    }
    setSubmitError(null);
    try {
      await submit.mutateAsync({ formId: form.id, respondentId: session.user.id, questions, values });
      setDone(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Une erreur est survenue.");
    }
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-6 px-gutter py-6">
      <View className="rounded-DEFAULT border border-border bg-surface-elevated p-6">
        <Text className="font-display text-lg font-semibold text-foreground">{form.title}</Text>
        <Text className="mt-1 font-body text-sm text-foreground-muted">{trainingTitle}</Text>

        {alreadyAnswered || done ? (
          <Text className="mt-6 font-body text-sm text-success">Merci, votre réponse a déjà été enregistrée.</Text>
        ) : (
          <View className="mt-6 gap-6">
            {questions.map((q) => (
              <View key={q.id} className="gap-2">
                <Text className="font-body text-sm font-medium text-foreground">{q.label}</Text>
                {q.type === "note" ? (
                  <View className="flex-row gap-3">
                    {[1, 2, 3, 4, 5].map((n) => {
                      const isSelected = values[q.id] === n;
                      return (
                        <Pressable
                          key={n}
                          onPress={() => setValues((prev) => ({ ...prev, [q.id]: n }))}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: isSelected }}
                          accessibilityLabel={`Note ${n} sur 5`}
                          className={[
                            "h-10 w-10 items-center justify-center rounded-full border",
                            isSelected ? "border-accent bg-accent" : "border-border",
                          ].join(" ")}
                        >
                          <Text className={["font-body text-sm", isSelected ? "text-on-accent" : "text-foreground"].join(" ")}>
                            {n}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : (
                  <TextInput
                    value={typeof values[q.id] === "string" ? (values[q.id] as string) : ""}
                    onChangeText={(text) => setValues((prev) => ({ ...prev, [q.id]: text }))}
                    multiline
                    numberOfLines={3}
                    accessibilityLabel={q.label}
                    placeholderTextColor={theme.colors.foregroundMuted}
                    className="min-h-20 rounded border border-border bg-surface p-3 font-body text-sm text-foreground"
                  />
                )}
              </View>
            ))}
            {submitError && <ErrorText>{submitError}</ErrorText>}
            <SubmitButton onPress={handleSubmit} loading={submit.isPending}>
              Envoyer mes réponses
            </SubmitButton>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
