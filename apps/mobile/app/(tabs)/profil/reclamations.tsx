import { useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { useRequireAuth } from "../../../src/hooks/useRequireAuth";
import { useClaims, useSubmitClaim } from "../../../src/features/claims/useClaims";
import { useAppTheme } from "../../../src/theme/ThemeProvider";
import { Card } from "../../../src/components/Card";
import { Badge } from "../../../src/components/Badge";
import { EmptyState } from "../../../src/components/EmptyState";
import { SubmitButton } from "../../../src/components/form/SubmitButton";
import { ErrorText } from "../../../src/components/form/ErrorText";
import { IconAlertTriangle } from "../../../src/components/Icon";

const STATUS_LABELS: Record<string, string> = {
  ouverte: "Ouverte",
  en_cours: "En cours",
  resolue: "Résolue",
  refusee: "Refusée",
};

const STATUS_VARIANTS: Record<string, "neutral" | "success" | "warning" | "error"> = {
  ouverte: "warning",
  en_cours: "warning",
  resolue: "success",
  refusee: "error",
};

// Équivalent RN de apps/web/src/app/apprenant/reclamations/page.tsx.
export default function ReclamationsScreen() {
  const { theme } = useAppTheme();
  const { session } = useRequireAuth();
  const userId = session?.user.id;
  const { data: claims, isLoading, refetch, isRefetching } = useClaims(userId);
  const submitClaim = useSubmitClaim(userId);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!subject.trim() || !body.trim()) {
      setFormError("Sujet et description sont requis.");
      return;
    }
    setFormError(null);
    try {
      await submitClaim.mutateAsync({ subject, body });
      setSubject("");
      setBody("");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Une erreur est survenue.");
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-6 px-gutter py-6"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <Card>
        <Text className="mb-3 font-display text-lg font-semibold text-foreground">Déposer une réclamation</Text>
        <View className="gap-3">
          <View className="gap-1.5">
            <Text className="font-body text-sm font-medium text-foreground">Sujet</Text>
            <TextInput
              value={subject}
              onChangeText={setSubject}
              className="h-10 rounded border border-border bg-surface px-3 font-body text-sm text-foreground"
            />
          </View>
          <View className="gap-1.5">
            <Text className="font-body text-sm font-medium text-foreground">Description</Text>
            <TextInput
              value={body}
              onChangeText={setBody}
              multiline
              numberOfLines={4}
              placeholderTextColor={theme.colors.foregroundMuted}
              className="min-h-28 rounded border border-border bg-surface px-3 py-2 font-body text-sm text-foreground"
            />
          </View>
          {formError && <ErrorText>{formError}</ErrorText>}
          <SubmitButton onPress={handleSubmit} loading={submitClaim.isPending}>
            Envoyer la réclamation
          </SubmitButton>
        </View>
      </Card>

      <Card>
        <Text className="mb-3 font-display text-lg font-semibold text-foreground">Mes réclamations</Text>
        {isLoading ? (
          <ActivityIndicator />
        ) : !claims || claims.length === 0 ? (
          <EmptyState
            icon={<IconAlertTriangle size={20} color={theme.colors.foregroundMuted} />}
            title="Aucune réclamation pour le moment."
          />
        ) : (
          <View className="gap-3">
            {claims.map((claim) => (
              <View key={claim.id} className="gap-2 rounded-DEFAULT border border-border p-4">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="font-body text-sm font-semibold text-foreground">{claim.subject}</Text>
                    <Text className="font-body text-xs text-foreground-muted">
                      {new Date(claim.submitted_at).toLocaleDateString("fr-FR")}
                    </Text>
                  </View>
                  <Badge variant={STATUS_VARIANTS[claim.status] ?? "neutral"}>
                    {STATUS_LABELS[claim.status] ?? claim.status}
                  </Badge>
                </View>
                <Text className="font-body text-sm text-foreground-muted">{claim.body}</Text>
                {claim.resolution && (
                  <Text className="font-body text-xs text-foreground-muted">
                    <Text className="font-semibold text-foreground">Réponse : </Text>
                    {claim.resolution}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </Card>
    </ScrollView>
  );
}
