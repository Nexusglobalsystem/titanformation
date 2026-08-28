import { createClient } from "@/lib/supabase/server";
import { SpaceShell } from "@/components/SpaceShell";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@titan-kinetic/ui";
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
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Apprenant</TableHead>
                  <TableHead className="hidden sm:table-cell">Formation</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentsWithUrls.length === 0 ? (
                  <TableEmpty colSpan={5}>Aucun document pour le moment.</TableEmpty>
                ) : (
                  documentsWithUrls.map((doc) => {
                    const enrollment = doc.enrollments;
                    const learner = enrollment?.profiles;
                    const training = enrollment?.sessions?.trainings;
                    const learnerName = learner
                      ? `${learner.first_name ?? ""} ${learner.last_name ?? ""}`.trim()
                      : "—";
                    return (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <Badge variant="neutral">{DOCUMENT_TYPE_LABELS[doc.type] ?? doc.type}</Badge>
                        </TableCell>
                        <TableCell>{learnerName}</TableCell>
                        <TableCell className="hidden sm:table-cell">{training?.title ?? "—"}</TableCell>
                        <TableCell className="hidden sm:table-cell">{new Date(doc.generated_at).toLocaleString("fr-FR")}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
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
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </SpaceShell>
  );
}
