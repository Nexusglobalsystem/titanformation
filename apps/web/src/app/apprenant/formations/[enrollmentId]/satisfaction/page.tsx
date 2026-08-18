import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SpaceShell } from "@/components/SpaceShell";
import { Button } from "@titan-kinetic/ui";
import { submitSatisfactionAction } from "../../../_actions/satisfaction";

type Question = { id: string; type: "note" | "texte"; label: string };

export default async function SatisfactionPage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const { enrollmentId } = await params;
  const supabase = await createClient();

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, status, sessions(trainings(id, title))")
    .eq("id", enrollmentId)
    .maybeSingle();

  if (!enrollment || !["confirme", "termine"].includes(enrollment.status)) notFound();
  const training = enrollment.sessions?.trainings;
  if (!training) notFound();

  const { data: form } = await supabase
    .from("evaluation_forms")
    .select("id, title, schema")
    .eq("training_id", training.id)
    .eq("kind", "satisfaction_chaud")
    .eq("is_active", true)
    .maybeSingle();

  if (!form) notFound();

  const { data: existingResponse } = await supabase
    .from("evaluation_responses")
    .select("id")
    .eq("form_id", form.id)
    .eq("enrollment_id", enrollmentId)
    .maybeSingle();

  const schema = form.schema as { questions?: Question[] } | null;
  const questions = schema?.questions ?? [];

  return (
    <SpaceShell title="Espace apprenant">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <Link
          href={`/apprenant/formations/${enrollmentId}`}
          className="inline-block font-body text-sm text-accent-text hover:underline"
        >
          ← Retour au programme
        </Link>

        <div className="rounded-DEFAULT border border-border bg-surface-elevated p-6">
          <h1 className="font-display text-lg font-semibold text-foreground">{form.title}</h1>
          <p className="mt-1 font-body text-sm text-foreground-muted">{training.title}</p>

          {existingResponse ? (
            <p className="mt-6 font-body text-sm text-success">
              Merci, votre réponse a déjà été enregistrée.
            </p>
          ) : (
            <form action={submitSatisfactionAction} className="mt-6 flex flex-col gap-6">
              <input type="hidden" name="formId" value={form.id} />
              <input type="hidden" name="enrollmentId" value={enrollmentId} />
              {questions.map((q) => (
                <div key={q.id} className="flex flex-col gap-2">
                  <input type="hidden" name="questionIds" value={q.id} />
                  <input type="hidden" name={`kind_${q.id}`} value={q.type} />
                  <label className="font-body text-sm font-medium text-foreground">{q.label}</label>
                  {q.type === "note" ? (
                    <div className="flex gap-3">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <label
                          key={n}
                          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border font-body text-sm text-foreground has-checked:border-accent has-checked:bg-accent has-checked:text-on-accent"
                        >
                          <input
                            type="radio"
                            name={`answer_${q.id}`}
                            value={n}
                            required
                            className="sr-only"
                          />
                          {n}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      name={`answer_${q.id}`}
                      rows={3}
                      className="w-full rounded border border-border bg-surface p-3 font-body text-sm text-foreground"
                    />
                  )}
                </div>
              ))}
              <div>
                <Button type="submit" variant="primary">
                  Envoyer mes réponses
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </SpaceShell>
  );
}
