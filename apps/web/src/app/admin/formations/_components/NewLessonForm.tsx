"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@titan-kinetic/ui";
import { createLessonAction, type LessonFormState } from "../_actions/modules";

const TYPE_LABELS: Record<string, string> = {
  texte: "Texte",
  video: "Vidéo",
  audio: "Audio",
  document: "Document",
  quiz: "Quiz",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" loading={pending}>
      Ajouter la leçon
    </Button>
  );
}

export function NewLessonForm({ moduleId, trainingId }: { moduleId: string; trainingId: string }) {
  const [state, formAction] = useActionState<LessonFormState, FormData>(createLessonAction, undefined);
  const [type, setType] = useState<string>("texte");

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-DEFAULT border border-dashed border-border p-3">
      <input type="hidden" name="moduleId" value={moduleId} />
      <input type="hidden" name="trainingId" value={trainingId} />
      <input type="hidden" name="type" value={type} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input label="Titre de la leçon" name="title" required />
        <div className="flex flex-col gap-1.5">
          <label className="font-body text-sm font-medium text-foreground">Type</label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input label="Durée (minutes)" name="duration_minutes" type="number" min="0" defaultValue={0} />
      </div>

      {type === "texte" && <Textarea label="Contenu" name="body" rows={4} />}

      {type === "video" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Prestataire vidéo"
            name="video_provider"
            placeholder="mux, cloudflare_stream ou bunny"
            hint="Jamais Supabase Storage pour la vidéo."
          />
          <Input label="ID de l'asset vidéo" name="video_asset_id" />
        </div>
      )}

      {type === "audio" && (
        <Input
          label="Fichier audio"
          name="document_path"
          placeholder="lessons/audio/exemple.mp3"
          hint="Chemin dans le bucket privé Supabase Storage."
        />
      )}

      {type === "document" && (
        <Input
          label="Fichier"
          name="document_path"
          placeholder="lessons/documents/exemple.pdf"
          hint="Chemin dans le bucket privé Supabase Storage."
        />
      )}

      {type === "quiz" && (
        <p className="font-body text-xs text-foreground-muted">
          Les questions se configurent après la création, depuis le bouton « Gérer le QCM ».
        </p>
      )}

      {state?.error && (
        <p role="alert" className="font-body text-xs text-error">
          {state.error}
        </p>
      )}
      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
