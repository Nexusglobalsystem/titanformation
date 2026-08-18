import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SpaceShell } from "@/components/SpaceShell";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@titan-kinetic/ui";
import { MarkCompleteButton } from "../../../_components/MarkCompleteButton";

const VIDEO_PROVIDER_LABELS: Record<string, string> = {
  mux: "Mux",
  cloudflare_stream: "Cloudflare Stream",
  bunny: "Bunny",
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
    .select("id, status, sessions(trainings(title))")
    .eq("id", enrollmentId)
    .maybeSingle();

  if (!enrollment || !["confirme", "termine"].includes(enrollment.status)) notFound();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, title, type, body, video_provider, video_asset_id, document_path, duration_minutes")
    .eq("id", lessonId)
    .maybeSingle();

  if (!lesson) notFound();

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
      <div className="flex flex-col gap-6">
        <Link
          href={`/apprenant/formations/${enrollmentId}`}
          className="inline-block font-body text-sm text-accent-text hover:underline"
        >
          ← Retour au programme
        </Link>
        <Card className="max-w-3xl">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>{lesson.title}</CardTitle>
              <p className="mt-1 font-body text-xs text-foreground-muted">
                {enrollment.sessions?.trainings?.title} · {lesson.duration_minutes} min
              </p>
            </div>
            {progress?.completed_at && <Badge variant="success">Terminé</Badge>}
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
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

            <div>
              <MarkCompleteButton
                enrollmentId={enrollmentId}
                lessonId={lessonId}
                alreadyDone={Boolean(progress?.completed_at)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </SpaceShell>
  );
}
