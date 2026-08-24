import { Badge, Button, EmptyState, Input } from "@titan-kinetic/ui";
import { IconUsers } from "@/components/icons";
import { addCertificationSignoffAction, removeCertificationSignoffAction } from "../_actions/certification";

export function CertificationSignoffPanel({
  trainingId,
  enrollments,
}: {
  trainingId: string;
  enrollments: {
    id: string;
    learnerName: string;
    signedAt: string | null;
    signedByName: string | null;
    comment: string | null;
  }[];
}) {
  if (enrollments.length === 0) {
    return <EmptyState icon={<IconUsers />} title="Aucun apprenant inscrit pour le moment." />;
  }

  return (
    <div className="flex flex-col gap-2">
      {enrollments.map((e) => (
        <div key={e.id} className="flex flex-col gap-2 rounded-DEFAULT border border-border p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="font-body text-sm text-foreground">{e.learnerName}</span>
            {e.signedAt ? (
              <Badge variant="success">
                Validé le {new Date(e.signedAt).toLocaleDateString("fr-FR")}
                {e.signedByName ? ` par ${e.signedByName}` : ""}
              </Badge>
            ) : (
              <Badge variant="warning">Non validé</Badge>
            )}
          </div>
          {e.signedAt ? (
            <form action={removeCertificationSignoffAction}>
              <input type="hidden" name="trainingId" value={trainingId} />
              <input type="hidden" name="enrollmentId" value={e.id} />
              <Button type="submit" variant="ghost" size="sm">
                Retirer la validation
              </Button>
            </form>
          ) : (
            <form action={addCertificationSignoffAction} className="flex items-center gap-2">
              <input type="hidden" name="trainingId" value={trainingId} />
              <input type="hidden" name="enrollmentId" value={e.id} />
              <Input name="comment" placeholder="Commentaire (facultatif)" className="h-8 flex-1 text-xs" />
              <Button type="submit" variant="primary" size="sm">
                Valider
              </Button>
            </form>
          )}
        </div>
      ))}
    </div>
  );
}
