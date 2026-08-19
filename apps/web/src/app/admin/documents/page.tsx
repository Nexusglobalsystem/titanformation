import { createClient } from "@/lib/supabase/server";
import { SpaceShell } from "@/components/SpaceShell";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@titan-kinetic/ui";
import { deleteDocumentAction } from "./_actions/documents";
import { DOCUMENT_TYPE_LABELS } from "./_lib/document-types";
import { GenerateDocumentForm } from "./_components/GenerateDocumentForm";
import { UploadDocumentForm } from "./_components/UploadDocumentForm";

export default async function AdminDocumentsPage() {
  const supabase = await createClient();

  const { data: enrollmentsRaw } = await supabase
    .from("enrollments")
    .select("id, profiles(first_name, last_name), sessions(trainings(title))")
    .order("created_at", { ascending: false });

  const enrollments = (enrollmentsRaw ?? []).map((e) => {
    const learner = e.profiles;
    const training = e.sessions?.trainings;
    const learnerName = learner ? `${learner.first_name ?? ""} ${learner.last_name ?? ""}`.trim() : "—";
    return { id: e.id, label: `${learnerName} — ${training?.title ?? "formation inconnue"}` };
  });

  const { data: documents } = await supabase
    .from("documents")
    .select(
      "id, type, storage_path, generated_at, enrollment_id, enrollments(profiles(first_name, last_name), sessions(trainings(title)))",
    )
    .order("generated_at", { ascending: false });

  const documentsWithUrls = await Promise.all(
    (documents ?? []).map(async (doc) => {
      const { data: signed } = await supabase.storage
        .from("documents")
        .createSignedUrl(doc.storage_path, 3600);
      return { ...doc, signedUrl: signed?.signedUrl ?? null };
    }),
  );

  return (
    <SpaceShell title="Espace administration">
      <div className="flex flex-col gap-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Générer un document</CardTitle>
            </CardHeader>
            <CardContent>
              <GenerateDocumentForm enrollments={enrollments} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Envoyer un fichier</CardTitle>
            </CardHeader>
            <CardContent>
              <UploadDocumentForm enrollments={enrollments} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {documentsWithUrls.length === 0 ? (
              <p className="font-body text-sm text-foreground-muted">Aucun document pour le moment.</p>
            ) : (
              documentsWithUrls.map((doc) => {
                const enrollment = doc.enrollments;
                const learner = enrollment?.profiles;
                const training = enrollment?.sessions?.trainings;
                const learnerName = learner
                  ? `${learner.first_name ?? ""} ${learner.last_name ?? ""}`.trim()
                  : "—";
                return (
                  <div
                    key={doc.id}
                    className="flex flex-col gap-2 rounded-DEFAULT border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="neutral">{DOCUMENT_TYPE_LABELS[doc.type] ?? doc.type}</Badge>
                        <p className="font-body text-sm font-semibold text-foreground">{learnerName}</p>
                      </div>
                      <p className="font-body text-xs text-foreground-muted">
                        {training?.title ?? "—"} · {new Date(doc.generated_at).toLocaleString("fr-FR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.signedUrl && (
                        <a
                          href={doc.signedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-body text-xs text-primary underline"
                        >
                          Ouvrir
                        </a>
                      )}
                      <form action={deleteDocumentAction}>
                        <input type="hidden" name="id" value={doc.id} />
                        <input type="hidden" name="storagePath" value={doc.storage_path} />
                        <Button type="submit" variant="ghost" size="sm">
                          Supprimer
                        </Button>
                      </form>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </SpaceShell>
  );
}
