import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SpaceShell } from "@/components/SpaceShell";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@titan-kinetic/ui";
import { NewClaimForm } from "../_components/NewClaimForm";

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

export default async function ReclamationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: claims } = await supabase
    .from("claims")
    .select("id, subject, body, status, resolution, submitted_at")
    .eq("submitted_by", user!.id)
    .order("submitted_at", { ascending: false });

  return (
    <SpaceShell title="Espace apprenant">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <Link href="/apprenant" className="inline-block font-body text-sm text-accent-text hover:underline">
          ← Retour à mon espace
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Déposer une réclamation</CardTitle>
          </CardHeader>
          <CardContent>
            <NewClaimForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mes réclamations</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {!claims || claims.length === 0 ? (
              <p className="font-body text-sm text-foreground-muted">Aucune réclamation pour le moment.</p>
            ) : (
              claims.map((claim) => (
                <div key={claim.id} className="flex flex-col gap-2 rounded-DEFAULT border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-body text-sm font-semibold text-foreground">{claim.subject}</p>
                      <p className="font-body text-xs text-foreground-muted">
                        {new Date(claim.submitted_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <Badge variant={STATUS_VARIANTS[claim.status] ?? "neutral"}>
                      {STATUS_LABELS[claim.status] ?? claim.status}
                    </Badge>
                  </div>
                  <p className="font-body text-sm text-foreground-muted">{claim.body}</p>
                  {claim.resolution && (
                    <p className="font-body text-xs text-foreground-muted">
                      <span className="font-semibold text-foreground">Réponse : </span>
                      {claim.resolution}
                    </p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </SpaceShell>
  );
}
