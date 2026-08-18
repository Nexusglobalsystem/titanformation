import { createClient } from "@/lib/supabase/server";
import { SpaceShell } from "@/components/SpaceShell";
import {
  Badge,
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

const STATUS_LABELS: Record<string, string> = {
  preinscrit: "Préinscrit",
  en_attente_paiement: "En attente de paiement",
  confirme: "Confirmé",
  annule: "Annulé",
  termine: "Terminé",
  abandonne: "Abandonné",
};

const STATUS_VARIANTS: Record<string, "neutral" | "success" | "warning" | "error"> = {
  preinscrit: "warning",
  en_attente_paiement: "warning",
  confirme: "success",
  annule: "error",
  termine: "success",
  abandonne: "error",
};

export default async function EntreprisePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name")
    .eq("id", user!.id)
    .single();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(
      "id, status, created_at, profiles(first_name, last_name, email), sessions(reference, starts_on, trainings(title))",
    )
    .order("created_at", { ascending: false });

  return (
    <SpaceShell title="Espace entreprise">
      <div className="flex flex-col gap-6">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Bienvenue{profile?.first_name ? `, ${profile.first_name}` : ""}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inscriptions de mes salariés</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Salarié</TableHead>
                  <TableHead>Formation</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!enrollments || enrollments.length === 0 ? (
                  <TableEmpty colSpan={4}>Aucune inscription pour le moment.</TableEmpty>
                ) : (
                  enrollments.map((enrollment) => {
                    const learner = enrollment.profiles;
                    const session = enrollment.sessions;
                    return (
                      <TableRow key={enrollment.id}>
                        <TableCell>
                          {learner ? `${learner.first_name ?? ""} ${learner.last_name ?? ""}`.trim() : "—"}
                          <div className="font-body text-xs text-foreground-muted">{learner?.email}</div>
                        </TableCell>
                        <TableCell>{session?.trainings?.title ?? "—"}</TableCell>
                        <TableCell>{session?.reference ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANTS[enrollment.status] ?? "neutral"}>
                            {STATUS_LABELS[enrollment.status] ?? enrollment.status}
                          </Badge>
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
