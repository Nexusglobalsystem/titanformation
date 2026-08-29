import { ActivityIndicator, Linking, RefreshControl, ScrollView, Text, View } from "react-native";
import { useRequireAuth } from "../../../src/hooks/useRequireAuth";
import { useDocuments } from "../../../src/features/documents/useDocuments";
import { useAppTheme } from "../../../src/theme/ThemeProvider";
import { Card } from "../../../src/components/Card";
import { Badge } from "../../../src/components/Badge";
import { EmptyState } from "../../../src/components/EmptyState";
import { SubmitButton } from "../../../src/components/form/SubmitButton";
import { IconFileText } from "../../../src/components/Icon";

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  programme: "Programme de formation",
  convention: "Convention de formation",
  contrat: "Contrat de formation",
  convocation: "Convocation",
  feuille_emargement: "Feuille d'émargement",
  certificat_realisation: "Certificat de réalisation",
  attestation_fin_formation: "Attestation de fin de formation",
  evaluation_synthese: "Synthèse d'évaluation",
  autre: "Autre document",
};

// Équivalent RN de apps/web/src/app/apprenant/documents/page.tsx.
export default function DocumentsScreen() {
  const { theme } = useAppTheme();
  const { session } = useRequireAuth();
  const { data: documents, isLoading, refetch, isRefetching } = useDocuments(session?.user.id);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-gutter py-6"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <Card>
        <Text className="mb-3 font-display text-lg font-semibold text-foreground">Mes documents</Text>
        {!documents || documents.length === 0 ? (
          <EmptyState
            icon={<IconFileText size={20} color={theme.colors.foregroundMuted} />}
            title="Aucun document disponible pour le moment."
          />
        ) : (
          <View className="gap-3">
            {documents.map((doc) => {
              const training = doc.enrollments?.sessions?.trainings;
              return (
                <View key={doc.id} className="gap-2 rounded-DEFAULT border border-border p-4">
                  <Badge variant="neutral">{DOCUMENT_TYPE_LABELS[doc.type] ?? doc.type}</Badge>
                  <Text className="font-body text-sm text-foreground-muted">
                    {training?.title ?? "—"} · {new Date(doc.generated_at).toLocaleDateString("fr-FR")}
                  </Text>
                  {doc.signedUrl && (
                    <SubmitButton onPress={() => Linking.openURL(doc.signedUrl!)}>Télécharger</SubmitButton>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </Card>
    </ScrollView>
  );
}
