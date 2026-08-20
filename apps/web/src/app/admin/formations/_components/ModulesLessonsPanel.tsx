import Link from "next/link";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@titan-kinetic/ui";
import { AttachLessonFileForm } from "./AttachLessonFileForm";
import { NewLessonForm } from "./NewLessonForm";
import { NewModuleForm } from "./NewModuleForm";

const LESSON_TYPE_LABELS: Record<string, string> = {
  texte: "Texte",
  video: "Vidéo",
  audio: "Audio",
  document: "Document",
  quiz: "Quiz",
  live_slot: "Créneau live",
};

const LESSON_TYPE_VARIANTS: Record<string, "neutral" | "success" | "warning" | "featured"> = {
  texte: "neutral",
  video: "featured",
  audio: "success",
  document: "warning",
  quiz: "featured",
  live_slot: "warning",
};

type ModuleWithLessons = {
  id: string;
  title: string;
  position: number;
  lessons:
    | {
        id: string;
        title: string;
        type: string;
        duration_minutes: number | null;
        position: number;
        document_path: string | null;
      }[]
    | null;
};

// Extrait de admin/formations/[id]/page.tsx pour être réutilisable dans
// l'assistant de création (étape Composer) — arbre modules/leçons identique,
// aucun comportement changé.
export function ModulesLessonsPanel({
  trainingId,
  modules,
}: {
  trainingId: string;
  modules: ModuleWithLessons[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Programme (modules et leçons)</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {modules.length > 0 && (
          <div className="flex flex-col gap-6">
            {modules.map((module) => {
              const lessons = [...(module.lessons ?? [])].sort((a, b) => a.position - b.position);
              return (
                <div key={module.id} className="flex flex-col gap-3">
                  <h3 className="font-mono-label text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                    {module.title}
                  </h3>
                  <div className="flex flex-col gap-2 border-l-2 border-border pl-4">
                    {lessons.map((lesson) => (
                      <div key={lesson.id} className="flex flex-col gap-3 rounded-DEFAULT border border-border p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-body text-sm text-foreground">{lesson.title}</p>
                            <p className="font-body text-xs text-foreground-muted">{lesson.duration_minutes} min</p>
                          </div>
                          <Badge variant={LESSON_TYPE_VARIANTS[lesson.type] ?? "neutral"}>
                            {LESSON_TYPE_LABELS[lesson.type] ?? lesson.type}
                          </Badge>
                        </div>
                        {(lesson.type === "audio" || lesson.type === "document") && (
                          <AttachLessonFileForm
                            lessonId={lesson.id}
                            trainingId={trainingId}
                            currentPath={lesson.document_path}
                          />
                        )}
                        {lesson.type === "quiz" && (
                          <Link
                            href={`/admin/formations/${trainingId}/lecons/${lesson.id}/quiz`}
                            className="font-body text-xs text-accent-text hover:underline"
                          >
                            Gérer le QCM →
                          </Link>
                        )}
                      </div>
                    ))}
                    <NewLessonForm moduleId={module.id} trainingId={trainingId} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <NewModuleForm trainingId={trainingId} nextPosition={modules.length} />
      </CardContent>
    </Card>
  );
}
