import { createClient } from "@/lib/supabase/server";
import { SpaceShell } from "@/components/SpaceShell";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@titan-kinetic/ui";

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  programme: "Programme de formation",
  convention: "Convention de formation",
  contrat: "Contrat de formation",
  convocation: "Convocation",
  feuille_emargement: "Feuille d'émargement",
  certificat_realisation: "Certificat de réalisation",
  attestation_fin_formation: "Attestation de fin de formation",
  evaluation_synthese: "Synthèse d'évaluation",
  autre: "Autre document",
};

export default async function ApprenantDocumentsPage() {
  const supabase = await createClient();

  const { data: documents } = await supabase
    .from("documents")
    .select("id, type, storage_path, generated_at, enrollments(sessions(trainings(title)))")
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
    <SpaceShell title="Espace apprenant">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Mes documents</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {documentsWithUrls.length === 0 ? (
            <p className="font-body text-sm text-foreground-muted">
              Aucun document disponible pour le moment.
            </p>
          ) : (
            documentsWithUrls.map((doc) => {
              const training = doc.enrollments?.sessions?.trainings;
              return (
                <div
                  key={doc.id}
                  className="flex flex-col gap-2 rounded-DEFAULT border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="neutral">{DOCUMENT_TYPE_LABELS[doc.type] ?? doc.type}</Badge>
                    </div>
                    <p className="font-body text-sm text-foreground-muted">
                      {training?.title ?? "—"} ·{" "}
                      {new Date(doc.generated_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  {doc.signedUrl && (
                    <a
                      href={doc.signedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-body text-sm font-medium text-primary underline"
                    >
                      Télécharger
                    </a>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </SpaceShell>
  );
}
