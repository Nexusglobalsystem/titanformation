import { getVideoEmbedUrl } from "@titan-kinetic/core";
import { useEffect } from "react";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import {
  useLesson,
  useMarkLessonComplete,
} from "../../../../src/features/lessons/useLesson";
import { useAppTheme } from "../../../../src/theme/ThemeProvider";
import { Badge } from "../../../../src/components/Badge";
import { Progress } from "../../../../src/components/Progress";
import { SubmitButton } from "../../../../src/components/form/SubmitButton";
import {
  IconCheckCircle,
  IconClock,
  IconLock,
  IconPlayCircle,
} from "../../../../src/components/Icon";

const TYPE_LABELS: Record<string, string> = {
  texte: "Lecture",
  audio: "Audio",
  document: "Document",
  video: "Vidéo",
  quiz: "Quiz",
  live_slot: "Session en direct",
};

// Équivalent RN de apps/web/.../formations/[enrollmentId]/lecons/[lessonId]/page.tsx.
export default function LeconScreen() {
  const { enrollmentId, lessonId } = useLocalSearchParams<{
    enrollmentId: string;
    lessonId: string;
  }>();
  const router = useRouter();
  const { theme } = useAppTheme();
  const { data, isLoading } = useLesson(enrollmentId ?? "", lessonId ?? "");
  const markComplete = useMarkLessonComplete(enrollmentId ?? "");

  useEffect(() => {
    if (data?.isLocked) {
      router.replace(`/formations/${enrollmentId}`);
    }
  }, [data?.isLocked, enrollmentId, router]);

  if (isLoading || data?.isLocked) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center gap-2 bg-background px-gutter">
        <Text className="font-body text-foreground-muted">
          Leçon indisponible.
        </Text>
      </View>
    );
  }

  const {
    trainingTitle,
    lesson,
    modules,
    moduleUnlock,
    completedLessonIds,
    previousLesson,
    nextLesson,
    totalLessons,
    completedCount,
    alreadyDone,
    fileUrl,
  } = data;
  const videoUrl = getVideoEmbedUrl(
    lesson.video_provider,
    lesson.video_asset_id,
  );

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-4 px-gutter py-6"
    >
      <View className="rounded-xl border border-border bg-surface-elevated p-6">
        <View className="mb-4 flex-row flex-wrap items-center justify-between gap-2">
          <View className="flex-row items-center gap-2">
            <Badge variant="neutral">
              {TYPE_LABELS[lesson.type] ?? lesson.type}
            </Badge>
            <View className="flex-row items-center gap-1">
              <IconClock size={14} color={theme.colors.foregroundMuted} />
              <Text className="font-body text-xs text-foreground-muted">
                {lesson.duration_minutes} min
              </Text>
            </View>
          </View>
          {alreadyDone && <Badge variant="success">Terminé</Badge>}
        </View>

        <Text className="mb-1 font-display text-xl font-bold text-foreground">
          {lesson.title}
        </Text>
        <Text className="mb-6 font-body text-xs text-foreground-muted">
          {trainingTitle}
        </Text>

        {lesson.type === "texte" && (
          <Text className="font-body text-sm text-foreground">
            {lesson.body || "Aucun contenu."}
          </Text>
        )}

        {lesson.type === "audio" &&
          (fileUrl ? (
            <AudioPlayer uri={fileUrl} />
          ) : (
            <Text className="font-body text-sm text-foreground-muted">
              Aucun fichier audio n&apos;a encore été mis en ligne.
            </Text>
          ))}

        {lesson.type === "document" &&
          (fileUrl ? (
            <SubmitButton onPress={() => Linking.openURL(fileUrl)}>
              Ouvrir le document
            </SubmitButton>
          ) : (
            <Text className="font-body text-sm text-foreground-muted">
              Aucun document n&apos;a encore été mis en ligne.
            </Text>
          ))}

        {lesson.type === "video" &&
          (videoUrl ? (
            <Pressable
              accessibilityRole="link"
              onPress={() => Linking.openURL(videoUrl)}
              className="rounded-xl bg-primary p-6"
            >
              <Text className="font-body font-semibold text-on-primary">
                Lire la vidéo ↗
              </Text>
              <Text className="mt-2 font-body text-xs text-on-primary">
                Le lecteur s’ouvre dans votre navigateur.
              </Text>
            </Pressable>
          ) : (
            <Text className="font-body text-sm text-foreground-muted">
              La vidéo sera disponible dès sa publication.
            </Text>
          ))}
      </View>

      <View className="flex-row flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-elevated p-4">
        <View className="flex-row gap-2">
          {previousLesson && (
            <Link
              href={`/formations/${enrollmentId}/lecons/${previousLesson.id}`}
              className="h-9 items-center rounded-DEFAULT border border-border px-3 font-body text-sm text-foreground"
            >
              ← Précédent
            </Link>
          )}
          {nextLesson && (
            <Link
              href={`/formations/${enrollmentId}/lecons/${nextLesson.id}`}
              className="h-9 items-center rounded-DEFAULT border border-border px-3 font-body text-sm text-foreground"
            >
              Suivant →
            </Link>
          )}
        </View>
        <SubmitButton
          onPress={() => markComplete.mutate(lessonId ?? "")}
          loading={markComplete.isPending}
        >
          {alreadyDone
            ? "Marquer à nouveau comme terminé"
            : "Marquer comme terminé"}
        </SubmitButton>
      </View>

      <View className="rounded-xl border border-border bg-surface-elevated p-4">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="font-mono-label text-xs uppercase tracking-wide text-foreground-muted">
            Progression du programme
          </Text>
          <Text className="font-body text-xs font-semibold text-accent-text">
            {totalLessons > 0
              ? Math.round((completedCount / totalLessons) * 100)
              : 0}
            %
          </Text>
        </View>
        <Progress value={completedCount} max={totalLessons || 1} />
      </View>

      <View className="gap-3 rounded-xl border border-border bg-surface-elevated p-2">
        {modules.length === 0 ? (
          <Text className="p-3 font-body text-sm text-foreground-muted">
            Programme vide.
          </Text>
        ) : (
          modules.map((m) => (
            <View key={m.id} className="gap-1 p-2">
              <Text className="px-1 font-body text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                {m.title}
              </Text>
              {[...(m.lessons ?? [])]
                .sort((a, b) => a.position - b.position)
                .map((l) => {
                  const isCurrent = l.id === lessonId;
                  const isDone = completedLessonIds.has(l.id);
                  const isLockedModule =
                    moduleUnlock.get(m.id)?.unlocked === false;
                  if (isLockedModule) {
                    return (
                      <View
                        key={l.id}
                        className="flex-row items-center gap-2 rounded-DEFAULT px-2 py-2 opacity-60"
                      >
                        <IconLock
                          size={16}
                          color={theme.colors.foregroundMuted}
                        />
                        <Text
                          numberOfLines={1}
                          className="font-body text-sm text-foreground-muted"
                        >
                          {l.title}
                        </Text>
                      </View>
                    );
                  }
                  return (
                    <Link
                      key={l.id}
                      href={`/formations/${enrollmentId}/lecons/${l.id}`}
                      asChild
                    >
                      <Pressable
                        className={[
                          "flex-row items-center gap-2 rounded-DEFAULT px-2 py-2",
                          isCurrent ? "bg-accent/15" : "",
                        ].join(" ")}
                      >
                        {isDone ? (
                          <IconCheckCircle
                            size={16}
                            color={theme.colors.success.fg}
                          />
                        ) : isCurrent ? (
                          <IconPlayCircle
                            size={16}
                            color={theme.colors.accentText}
                          />
                        ) : (
                          <View className="h-4 w-4 rounded-full border border-border" />
                        )}
                        <Text
                          numberOfLines={1}
                          className={[
                            "font-body text-sm",
                            isCurrent
                              ? "font-semibold text-accent-text"
                              : "text-foreground",
                          ].join(" ")}
                        >
                          {l.title}
                        </Text>
                      </Pressable>
                    </Link>
                  );
                })}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function AudioPlayer({ uri }: { uri: string }) {
  const { theme } = useAppTheme();
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  return (
    <View className="flex-row items-center gap-3 rounded-DEFAULT border border-border p-3">
      <Pressable
        onPress={() => (status.playing ? player.pause() : player.play())}
        className="h-10 w-10 items-center justify-center rounded-full bg-primary"
      >
        <IconPlayCircle size={20} color={theme.colors.onPrimary} />
      </Pressable>
      <Text className="font-body text-sm text-foreground">
        {status.playing ? "Lecture en cours…" : "Lire l'audio"}
      </Text>
    </View>
  );
}
