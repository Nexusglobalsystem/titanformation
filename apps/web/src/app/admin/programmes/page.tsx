import Link from "next/link";
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

const STATUS_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  publiee: "Publié",
  archivee: "Archivé",
};

const STATUS_VARIANTS: Record<string, "neutral" | "success" | "warning"> = {
  brouillon: "warning",
  publiee: "success",
  archivee: "neutral",
};

export default async function AdminProgrammesPage() {
  const supabase = await createClient();
  const { data: programmes } = await supabase
    .from("programmes")
    .select("id, title, slug, status, programme_trainings(training_id)")
    .order("created_at", { ascending: false });

  return (
    <SpaceShell title="Espace administration">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl font-semibold text-foreground">Programmes</h1>
          <Link href="/admin/programmes/nouvelle">
            <Button variant="primary">Ajouter un programme</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Regroupements de formations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Formations</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!programmes || programmes.length === 0 ? (
                  <TableEmpty colSpan={4}>Aucun programme pour le moment.</TableEmpty>
                ) : (
                  programmes.map((programme) => (
                    <TableRow key={programme.id}>
                      <TableCell>{programme.title}</TableCell>
                      <TableCell>{programme.programme_trainings?.length ?? 0}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[programme.status] ?? "neutral"}>
                          {STATUS_LABELS[programme.status] ?? programme.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/admin/programmes/${programme.id}`} className="text-accent-text hover:underline">
                          Modifier
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </SpaceShell>
  );
}
