import { createClient } from "@/lib/supabase/server";
import { SpaceShell } from "@/components/SpaceShell";
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState } from "@titan-kinetic/ui";
import { IconAlertTriangle } from "@/components/icons";
import { UpdateClaimForm } from "./_components/UpdateClaimForm";

const STATUS_LABELS: Record<string, string> = {
  ouverte: "Ouverte",
  en_cours: "En cours",
  resolue: "Résolue",
  refusee: "Refusée",
};

const STATUS_VARIANTS: Record<string, "neutral" | "success" | "warning" | "error"> = {
  ouverte: "warning",
  en_cours: "warning",
  resolue: "success",
  refusee: "error",
};

export default async function AdminReclamationsPage() {
  const supabase = await createClient();

  const { data: claims } = await supabase
    .from("claims")
    .select(
      "id, subject, body, status, resolution, corrective_action, submitted_at, profiles!claims_submitted_by_fkey(first_name, last_name, email)",
    )
    .order("submitted_at", { ascending: false });

  return (
    <SpaceShell title="Espace administration">
      <div className="flex flex-col gap-6">
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Réclamations</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {!claims || claims.length === 0 ? (
              <EmptyState icon={<IconAlertTriangle />} title="Aucune réclamation." />
            ) : (
              claims.map((claim) => {
                const author = claim.profiles;
                return (
                  <div key={claim.id} className="flex flex-col gap-3 rounded-DEFAULT border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-body text-sm font-semibold text-foreground">{claim.subject}</p>
                        <p className="font-body text-xs text-foreground-muted">
                          {author ? `${author.first_name ?? ""} ${author.last_name ?? ""}`.trim() : "—"} ·{" "}
                          {new Date(claim.submitted_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <Badge variant={STATUS_VARIANTS[claim.status] ?? "neutral"}>
                        {STATUS_LABELS[claim.status] ?? claim.status}
                      </Badge>
                    </div>
                    <p className="font-body text-sm text-foreground-muted">{claim.body}</p>
                    <UpdateClaimForm
                      claimId={claim.id}
                      currentStatus={claim.status}
                      currentResolution={claim.resolution}
                      currentCorrectiveAction={claim.corrective_action}
                    />
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
