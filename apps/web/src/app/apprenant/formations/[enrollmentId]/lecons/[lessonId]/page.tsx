import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SpaceShell } from "@/components/SpaceShell";
import { Badge, Progress } from "@titan-kinetic/ui";
import { IconArrowRight, IconCheckCircle, IconClock, IconPlayCircle } from "@/components/icons";
import { MarkCompleteButton } from "../../../_components/MarkCompleteButton";

const VIDEO_PROVIDER_LABELS: Record<string, string> = {
  mux: "Mux",
  cloudflare_stream: "Cloudflare Stream",
  bunny: "Bunny",
};

const TYPE_LABELS: Record<string, string> = {
  texte: "Lecture",
  audio: "Audio",
  document: "Document",
  video: "Vidéo",
  quiz: "Quiz",
  live_slot: "Session en direct",
};

export default async function LeconPage({
  params,
}: {
  params: Promise<{ enrollmentId: string; lessonId: string }>;
}) {
  const { enrollmentId, lessonId } = await params;
  const supabase = await createClient();

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, status, sessions(trainings(id, title))")
    .eq("id", enrollmentId)
    .maybeSingle();

  if (!enrollment || !["confirme", "termine"].includes(enrollment.status)) notFound();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, title, type, body, video_provider, video_asset_id, document_path, duration_minutes, module_id")
    .eq("id", lessonId)
    .maybeSingle();

  if (!lesson) notFound();

  const trainingId = enrollment.sessions?.trainings?.id;
  const { data: modules } = trainingId
    ? await supabase
        .from("modules")
        .select("id, title, position, lessons(id, title, type, position, duration_minutes)")
        .eq("training_id", trainingId)
        .order("position", { ascending: true })
    : { data: [] };

  const { data: progressRows } = await supabase
    .from("learner_progress")
    .select("lesson_id, completed_at")
    .eq("enrollment_id", enrollmentId)
    .not("completed_at", "is", null);
  const completedLessonIds = new Set((progressRows ?? []).map((p) => p.lesson_id));

  const flatLessons = (modules ?? [])
    .sort((a, b) => a.position - b.position)
    .flatMap((m) => [...(m.lessons ?? [])].sort((a, b) => a.position - b.position));
  const currentIndex = flatLessons.findIndex((l) => l.id === lessonId);
  const previousLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < flatLessons.length - 1 ? flatLessons[currentIndex + 1] : null;
  const totalLessons = flatLessons.length;
  const completedCount = flatLessons.filter((l) => completedLessonIds.has(l.id)).length;

  const { data: progress } = await supabase
    .from("learner_progress")
    .select("completed_at")
    .eq("enrollment_id", enrollmentId)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  let fileUrl: string | null = null;
  if ((lesson.type === "audio" || lesson.type === "document") && lesson.document_path) {
    const { data: signed } = await supabase.storage
      .from("lesson-files")
      .createSignedUrl(lesson.document_path, 3600);
    fileUrl = signed?.signedUrl ?? null;
  }

  return (
    <SpaceShell title="Espace apprenant">
      <div className="flex flex-col gap-4">
        <Link
          href={`/apprenant/formations/${enrollmentId}`}
          className="inline-block w-fit font-body text-sm text-accent-text hover:underline"
        >
          ← Retour au programme
        </Link>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* Contenu de la leçon */}
          <div className="flex flex-col gap-4 xl:col-span-8">
            <div className="rounded-xl border border-border bg-surface-elevated p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="neutral">{TYPE_LABELS[lesson.type] ?? lesson.type}</Badge>
                  <span className="inline-flex items-center gap-1 font-body text-xs text-foreground-muted">
                    <IconClock size={14} />
                    {lesson.duration_minutes} min
                  </span>
                </div>
                {progress?.completed_at && <Badge variant="success">Terminé</Badge>}
              </div>

              <h1 className="mb-1 font-display text-xl font-bold text-foreground md:text-2xl">{lesson.title}</h1>
              <p className="mb-6 font-body text-xs text-foreground-muted">
                {enrollment.sessions?.trainings?.title}
              </p>

              {lesson.type === "texte" && (
                <p className="whitespace-pre-wrap font-body text-sm text-foreground">
                  {lesson.body || "Aucun contenu."}
                </p>
              )}

              {lesson.type === "audio" &&
                (fileUrl ? (
                  <audio controls src={fileUrl} className="w-full">
                    Votre navigateur ne prend pas en charge la lecture audio.
                  </audio>
                ) : (
                  <p className="font-body text-sm text-foreground-muted">Aucun fichier audio n'a encore été mis en ligne.</p>
                ))}

              {lesson.type === "document" &&
                (fileUrl ? (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block w-fit rounded-DEFAULT border border-border bg-surface px-4 py-2 font-body text-sm text-accent-text hover:underline"
                  >
                    Ouvrir le document
                  </a>
                ) : (
                  <p className="font-body text-sm text-foreground-muted">Aucun document n'a encore été mis en ligne.</p>
                ))}

              {lesson.type === "video" &&
                (lesson.video_provider && lesson.video_asset_id ? (
                  <div className="flex flex-col gap-2 rounded-DEFAULT border border-dashed border-border p-6 text-center">
                    <p className="font-body text-sm text-foreground">
                      Vidéo hébergée chez {VIDEO_PROVIDER_LABELS[lesson.video_provider] ?? lesson.video_provider}
                    </p>
                    <p className="font-body text-xs text-foreground-muted">
                      Asset : {lesson.video_asset_id} — lecteur en attente de la configuration du compte prestataire.
                    </p>
                  </div>
                ) : (
                  <p className="font-body text-sm text-foreground-muted">Aucune vidéo n'a encore été configurée.</p>
                ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-elevated p-4">
              <div className="flex gap-2">
                {previousLesson && (
                  <Link
                    href={`/apprenant/formations/${enrollmentId}/lecons/${previousLesson.id}`}
                    className="inline-flex h-9 items-center rounded-DEFAULT border border-border px-3 font-body text-sm text-foreground hover:bg-surface"
                  >
                    ← Précédent
                  </Link>
                )}
                {nextLesson && (
                  <Link
                    href={`/apprenant/formations/${enrollmentId}/lecons/${nextLesson.id}`}
                    className="inline-flex h-9 items-center gap-1 rounded-DEFAULT border border-border px-3 font-body text-sm text-foreground hover:bg-surface"
                  >
                    Suivant
                    <IconArrowRight />
                  </Link>
                )}
              </div>
              <MarkCompleteButton
                enrollmentId={enrollmentId}
                lessonId={lessonId}
                alreadyDone={Boolean(progress?.completed_at)}
              />
            </div>
          </div>

          {/* Sommaire du programme */}
          <aside className="flex flex-col gap-3 xl:col-span-4">
            <div className="rounded-xl border border-border bg-surface-elevated p-4">
              <div className="mb-2 flex items-center justify-between font-body text-xs text-foreground-muted">
                <span className="font-mono-label uppercase tracking-wide">Progression du programme</span>
                <span className="font-semibold text-accent-text">
                  {totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0}%
                </span>
              </div>
              <Progress value={completedCount} max={totalLessons || 1} />
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-elevated p-2">
              {(modules ?? [])
                .sort((a, b) => a.position - b.position)
                .map((m) => (
                  <div key={m.id} className="flex flex-col gap-1 p-2">
                    <p className="px-1 font-body text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                      {m.title}
                    </p>
                    {[...(m.lessons ?? [])]
                      .sort((a, b) => a.position - b.position)
                      .map((l) => {
                        const isCurrent = l.id === lessonId;
                        const isDone = completedLessonIds.has(l.id);
                        return (
                          <Link
                            key={l.id}
                            href={`/apprenant/formations/${enrollmentId}/lecons/${l.id}`}
                            className={`flex items-center gap-2 rounded-DEFAULT px-2 py-2 font-body text-sm transition-colors ${
                              isCurrent
                                ? "bg-accent/15 font-semibold text-accent-text"
                                : "text-foreground hover:bg-surface"
                            }`}
                          >
                            {isDone ? (
                              <IconCheckCircle size={16} />
                            ) : isCurrent ? (
                              <IconPlayCircle size={16} />
                            ) : (
                              <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-border" />
                            )}
                            <span className="line-clamp-1">{l.title}</span>
                          </Link>
                        );
                      })}
                  </div>
                ))}
              {flatLessons.length === 0 && (
                <p className="p-3 font-body text-sm text-foreground-muted">Programme vide.</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </SpaceShell>
  );
}
