import { Link, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useProgramme } from "../../../src/features/programme/useProgramme";
import { useAppTheme } from "../../../src/theme/ThemeProvider";
import { Card } from "../../../src/components/Card";
import { Badge } from "../../../src/components/Badge";
import { Progress } from "../../../src/components/Progress";
import { SubmitButton } from "../../../src/components/form/SubmitButton";
import { IconLock } from "../../../src/components/Icon";

const LESSON_TYPE_LABELS: Record<string, string> = {
  texte: "Texte",
  video: "Vidéo",
  audio: "Audio",
  document: "Document",
  quiz: "Quiz",
  live_slot: "Créneau live",
};

const STEP_TYPE_LABELS: Record<string, string> = {
  presentiel: "Présentiel",
  livekit: "Classe virtuelle",
  autoapprentissage: "Auto-apprentissage",
  evaluation: "Évaluation",
  certification: "Certification",
};

// Équivalent RN de apps/web/.../apprenant/formations/[enrollmentId]/page.tsx.
export default function ProgrammeScreen() {
  const { enrollmentId } = useLocalSearchParams<{ enrollmentId: string }>();
  const { theme } = useAppTheme();
  const { data, isLoading } = useProgramme(enrollmentId ?? "");

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
        <Text className="font-body text-foreground-muted">Programme indisponible.</Text>
      </View>
    );
  }

  const {
    training,
    modules,
    trainingSteps,
    completedLessonIds,
    totalLessons,
    completedLessons,
    certificationEligibility,
    moduleUnlock,
    satisfactionFormId,
    satisfactionAnswered,
  } = data;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-6 px-gutter py-6">
      {trainingSteps.length > 0 && (
        <Card>
          <Text className="mb-3 font-display text-base font-semibold text-foreground">Parcours</Text>
          <View className="gap-2">
            {trainingSteps.map((step, index) => (
              <View key={step.id} className="flex-row items-center justify-between gap-3 rounded-DEFAULT border border-border p-3">
                <View className="flex-row items-center gap-3">
                  <Text className="font-mono-label text-xs text-foreground-muted">{index + 1}</Text>
                  <Text className="font-body text-sm text-foreground">{step.title}</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  {step.duration_minutes && (
                    <Text className="font-body text-xs text-foreground-muted">{step.duration_minutes} min</Text>
                  )}
                  <Badge variant="neutral">{STEP_TYPE_LABELS[step.type] ?? step.type}</Badge>
                </View>
              </View>
            ))}
          </View>
        </Card>
      )}

      <Card>
        <Text className="font-display text-lg font-semibold text-foreground">{training.title}</Text>
        {totalLessons > 0 && (
          <View className="mt-3">
            <Progress value={completedLessons} max={totalLessons} label={`${completedLessons}/${totalLessons} leçons terminées`} />
          </View>
        )}
        {(certificationEligibility.eligible || (satisfactionFormId && !satisfactionAnswered)) && (
          <View className="mt-4 flex-row flex-wrap gap-3">
            {certificationEligibility.eligible && (
              <Link href={`/formations/${enrollmentId}/certificat`} asChild>
                <SubmitButton onPress={() => {}}>Voir mon certificat</SubmitButton>
              </Link>
            )}
            {satisfactionFormId && !satisfactionAnswered && (
              <Link href={`/formations/${enrollmentId}/satisfaction`} asChild>
                <SubmitButton onPress={() => {}}>Questionnaire de satisfaction</SubmitButton>
              </Link>
            )}
          </View>
        )}

        <View className="mt-6 gap-6">
          {modules.length === 0 ? (
            <Text className="font-body text-sm text-foreground-muted">
              Le programme de cette formation n&apos;est pas encore disponible.
            </Text>
          ) : (
            modules.map((module) => {
              const unlock = moduleUnlock.get(module.id) ?? { unlocked: true, lockReason: null };
              return (
                <View key={module.id} className="gap-3">
                  <View className="flex-row items-center gap-2">
                    <Text className="font-mono-label text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                      {module.title}
                    </Text>
                    {!unlock.unlocked && <IconLock size={14} color={theme.colors.foregroundMuted} />}
                  </View>
                  {!unlock.unlocked && unlock.lockReason && (
                    <Text className="-mt-2 font-body text-xs text-foreground-muted">{unlock.lockReason}</Text>
                  )}
                  <View className="gap-2 border-l-2 border-border pl-4">
                    {module.lessons.map((lesson) => {
                      const href =
                        lesson.type === "quiz"
                          ? `/formations/${enrollmentId}/quiz/${lesson.id}`
                          : `/formations/${enrollmentId}/lecons/${lesson.id}`;
                      if (!unlock.unlocked) {
                        return (
                          <View
                            key={lesson.id}
                            className="flex-row items-center justify-between rounded-DEFAULT border border-border bg-surface p-3 opacity-60"
                          >
                            <View>
                              <Text className="font-body text-sm text-foreground">{lesson.title}</Text>
                              <Text className="font-body text-xs text-foreground-muted">
                                {LESSON_TYPE_LABELS[lesson.type] ?? lesson.type} · {lesson.duration_minutes} min
                              </Text>
                            </View>
                            <IconLock size={16} color={theme.colors.foregroundMuted} />
                          </View>
                        );
                      }
                      return (
                        <Link key={lesson.id} href={href} className="flex-row items-center justify-between rounded-DEFAULT border border-border p-3">
                          <View>
                            <Text className="font-body text-sm text-foreground">{lesson.title}</Text>
                            <Text className="font-body text-xs text-foreground-muted">
                              {LESSON_TYPE_LABELS[lesson.type] ?? lesson.type} · {lesson.duration_minutes} min
                            </Text>
                          </View>
                          {completedLessonIds.has(lesson.id) && <Badge variant="success">Terminé</Badge>}
                        </Link>
                      );
                    })}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </Card>
    </ScrollView>
  );
}
