import { useState, type ReactNode } from "react";
import { Link, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { useSession } from "../../../src/hooks/useSession";
import { useEnroll, useTrainingDetail } from "../../../src/features/catalogue/useTrainingDetail";
import { useAppTheme } from "../../../src/theme/ThemeProvider";
import { Card } from "../../../src/components/Card";
import { TrainingCoverArt } from "../../../src/components/TrainingCoverArt";
import { RichOrLegacyText } from "../../../src/components/RichOrLegacyText";
import { SubmitButton } from "../../../src/components/form/SubmitButton";
import { ErrorText } from "../../../src/components/form/ErrorText";
import { IconLayers, IconShieldCheck, IconTarget, IconUsers } from "../../../src/components/Icon";

function SectionHeading({ icon, children }: { icon: ReactNode; children: string }) {
  const { theme } = useAppTheme();
  return (
    <View className="mb-4 flex-row items-center gap-2">
      {icon}
      <Text className="font-display text-lg font-semibold" style={{ color: theme.colors.accent }}>
        {children}
      </Text>
    </View>
  );
}

// Équivalent RN de apps/web/src/app/formations/[slug]/page.tsx — même
// contenu/structure (hero, objectifs, programme, modalités, public visé,
// prérequis, évaluation, accessibilité, carte d'inscription), empilé en
// une seule colonne (pas de grille 8/4 desktop). "Inscrire un salarié"
// (responsable d'entreprise) hors périmètre v1 mobile.
export default function TrainingDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { theme } = useAppTheme();
  const { session: authSession } = useSession();
  const { data, isLoading } = useTrainingDetail(slug ?? "");
  const enroll = useEnroll(slug ?? "");
  const [enrollError, setEnrollError] = useState<string | null>(null);

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
        <Text className="font-body text-foreground-muted">Formation introuvable.</Text>
      </View>
    );
  }

  const { training, imageUrl, modules, session: openSession, existingEnrollment } = data;

  async function handleEnroll() {
    if (!authSession || !openSession) return;
    setEnrollError(null);
    try {
      await enroll.mutateAsync({ sessionId: openSession.id, learnerId: authSession.user.id });
    } catch (err) {
      setEnrollError(err instanceof Error ? err.message : "Une erreur est survenue.");
    }
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-6 px-gutter py-6">
      <View className="h-48 w-full overflow-hidden rounded-xl">
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
        ) : (
          <TrainingCoverArt seed={training.id} />
        )}
      </View>

      <View className="gap-3">
        <Text className="font-display text-2xl font-bold text-foreground">{training.title}</Text>
        <Text className="font-body text-sm text-foreground-muted">{training.summary}</Text>
      </View>

      <Card>
        <SectionHeading icon={<IconTarget size={20} color={theme.colors.accent} />}>
          Objectifs de la formation
        </SectionHeading>
        <RichOrLegacyText text={training.objectives} />
      </Card>

      {modules.length > 0 && (
        <Card>
          <SectionHeading icon={<IconLayers size={20} color={theme.colors.accent} />}>
            Programme détaillé
          </SectionHeading>
          <View className="gap-4">
            {modules.map((m, i) => (
              <View key={m.id} className="border-l-2 border-border pl-4">
                <Text className="font-mono-label text-[11px] uppercase tracking-wide text-foreground-muted">
                  Module {i + 1}
                </Text>
                <Text className="font-body text-sm font-semibold text-foreground">{m.title}</Text>
                {m.description && (
                  <Text className="font-body text-sm text-foreground-muted">{m.description}</Text>
                )}
              </View>
            ))}
          </View>
        </Card>
      )}

      <Card>
        <SectionHeading icon={<IconLayers size={20} color={theme.colors.accent} />}>
          Modalités pédagogiques
        </SectionHeading>
        <RichOrLegacyText text={training.pedagogical_means} />
      </Card>

      <Card>
        <SectionHeading icon={<IconUsers size={20} color={theme.colors.accent} />}>Public visé</SectionHeading>
        <RichOrLegacyText text={training.target_audience} muted />
      </Card>

      <Card>
        <SectionHeading icon={<IconShieldCheck size={20} color={theme.colors.accent} />}>
          Prérequis
        </SectionHeading>
        <RichOrLegacyText text={training.prerequisites} muted />
      </Card>

      <Card>
        <Text className="mb-3 font-display text-lg font-semibold" style={{ color: theme.colors.accent }}>
          Modalités d&apos;évaluation
        </Text>
        <RichOrLegacyText text={training.assessment_methods} muted />
      </Card>

      <Card>
        <Text className="mb-3 font-display text-lg font-semibold" style={{ color: theme.colors.accent }}>
          Accessibilité
        </Text>
        <RichOrLegacyText text={training.accessibility_info} muted />
      </Card>

      <Card>
        <View className="flex-row items-end justify-between border-b border-border pb-6">
          <Text className="font-display text-3xl font-bold" style={{ color: theme.colors.accent }}>
            {training.price_ht} €
          </Text>
          <Text className="pb-1 font-body text-sm text-foreground-muted">HT / participant</Text>
        </View>

        <View className="gap-3 py-6">
          <View className="flex-row items-center justify-between">
            <Text className="font-body text-sm text-foreground-muted">Durée</Text>
            <Text className="font-body text-sm font-semibold text-foreground">
              {training.duration_hours} heures
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="font-body text-sm text-foreground-muted">Format</Text>
            <Text className="font-body text-sm font-semibold text-foreground">{training.modalities}</Text>
          </View>
          {training.is_certifying && (
            <View className="flex-row items-center justify-between">
              <Text className="font-body text-sm text-foreground-muted">Certification</Text>
              <Text className="font-body text-sm font-semibold text-foreground">
                {training.certification_name || "Certificat de réalisation"}
              </Text>
            </View>
          )}
          {openSession && (
            <View className="flex-row items-center justify-between">
              <Text className="font-body text-sm text-foreground-muted">Prochaine session</Text>
              <Text className="font-body text-sm font-semibold text-foreground">
                {new Date(openSession.starts_on).toLocaleDateString("fr-FR")} · {openSession.reference}
              </Text>
            </View>
          )}
        </View>

        {enrollError && <ErrorText>{enrollError}</ErrorText>}

        {!openSession ? (
          <Text className="font-body text-sm text-foreground-muted">Aucune session ouverte pour le moment.</Text>
        ) : existingEnrollment ? (
          <View className="rounded-DEFAULT bg-success-bg px-3 py-2">
            <Text className="font-body text-sm text-success">
              Inscription enregistrée — statut : {existingEnrollment.status}. Un gestionnaire te
              contactera pour la suite.
            </Text>
          </View>
        ) : authSession ? (
          <SubmitButton onPress={handleEnroll} loading={enroll.isPending}>
            S&apos;inscrire
          </SubmitButton>
        ) : (
          <Link href="/(auth)/connexion" asChild>
            <SubmitButton onPress={() => {}}>Se connecter pour s&apos;inscrire</SubmitButton>
          </Link>
        )}
      </Card>
    </ScrollView>
  );
}
