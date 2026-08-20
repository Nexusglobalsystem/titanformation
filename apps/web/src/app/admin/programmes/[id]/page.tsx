import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SpaceShell } from "@/components/SpaceShell";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@titan-kinetic/ui";
import { ProgrammeForm } from "../_components/ProgrammeForm";
import { AddTrainingForm } from "../_components/AddTrainingForm";
import {
  updateProgrammeAction,
  removeTrainingFromProgrammeAction,
  moveTrainingInProgrammeAction,
} from "../_actions/programmes";

export default async function ProgrammeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: programme } = await supabase.from("programmes").select("*").eq("id", id).maybeSingle();
  if (!programme) notFound();

  const { data: programmeTrainingsRaw } = await supabase
    .from("programme_trainings")
    .select("training_id, position, trainings(id, title, status)")
    .eq("programme_id", id)
    .order("position", { ascending: true });
  const programmeTrainings = programmeTrainingsRaw ?? [];

  const assignedIds = new Set(programmeTrainings.map((pt) => pt.training_id));
  const { data: allTrainings } = await supabase
    .from("trainings")
    .select("id, title")
    .order("title", { ascending: true });
  const availableTrainings = (allTrainings ?? []).filter((t) => !assignedIds.has(t.id));

  return (
    <SpaceShell title="Espace administration">
      <Link href="/admin/programmes" className="mb-4 inline-block font-body text-sm text-accent-text hover:underline">
        ← Retour aux programmes
      </Link>

      <div className="flex flex-col gap-6">
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Modifier le programme</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgrammeForm programme={programme} action={updateProgrammeAction} submitLabel="Enregistrer" />
          </CardContent>
        </Card>

        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Formations du programme</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {programmeTrainings.length === 0 ? (
              <p className="font-body text-sm text-foreground-muted">Aucune formation dans ce programme.</p>
            ) : (
              <ol className="flex flex-col gap-2">
                {programmeTrainings.map((pt, index) => {
                  const training = pt.trainings;
                  if (!training) return null;
                  return (
                    <li
                      key={pt.training_id}
                      className="flex items-center justify-between gap-3 rounded-DEFAULT border border-border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono-label text-xs text-foreground-muted">{index + 1}</span>
                        <span className="font-body text-sm text-foreground">{training.title}</span>
                        <Badge variant={training.status === "publiee" ? "success" : "neutral"}>
                          {training.status === "publiee" ? "Publiée" : training.status === "archivee" ? "Archivée" : "Brouillon"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <form action={moveTrainingInProgrammeAction}>
                          <input type="hidden" name="programmeId" value={id} />
                          <input type="hidden" name="trainingId" value={pt.training_id} />
                          <input type="hidden" name="direction" value="up" />
                          <button
                            type="submit"
                            disabled={index === 0}
                            className="rounded px-2 py-1 font-body text-xs text-foreground-muted hover:text-foreground disabled:opacity-30"
                            aria-label="Monter"
                          >
                            ↑
                          </button>
                        </form>
                        <form action={moveTrainingInProgrammeAction}>
                          <input type="hidden" name="programmeId" value={id} />
                          <input type="hidden" name="trainingId" value={pt.training_id} />
                          <input type="hidden" name="direction" value="down" />
                          <button
                            type="submit"
                            disabled={index === programmeTrainings.length - 1}
                            className="rounded px-2 py-1 font-body text-xs text-foreground-muted hover:text-foreground disabled:opacity-30"
                            aria-label="Descendre"
                          >
                            ↓
                          </button>
                        </form>
                        <form action={removeTrainingFromProgrammeAction}>
                          <input type="hidden" name="programmeId" value={id} />
                          <input type="hidden" name="trainingId" value={pt.training_id} />
                          <button type="submit" className="rounded px-2 py-1 font-body text-xs text-error hover:underline">
                            Retirer
                          </button>
                        </form>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            <AddTrainingForm programmeId={id} availableTrainings={availableTrainings} />
          </CardContent>
        </Card>
      </div>
    </SpaceShell>
  );
}
