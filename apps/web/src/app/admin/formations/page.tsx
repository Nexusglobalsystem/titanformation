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
import { AdminSectionTabs } from "../_components/AdminSectionTabs";

const STATUS_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  publiee: "Publiée",
  archivee: "Archivée",
};

const STATUS_VARIANTS: Record<string, "neutral" | "success" | "warning"> = {
  brouillon: "warning",
  publiee: "success",
  archivee: "neutral",
};

export default async function AdminFormationsPage() {
  const supabase = await createClient();
  const { data: trainings } = await supabase
    .from("trainings")
    .select("id, title, slug, status, category, price_ht, duration_hours")
    .order("created_at", { ascending: false });

  return (
    <SpaceShell title="Espace administration">
      <div className="flex flex-col gap-6">
        <AdminSectionTabs active="formations" />

        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl font-semibold text-foreground">Formations</h1>
          <Link href="/admin/formations/nouvelle">
            <Button variant="primary">Ajouter une formation</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Catalogue</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Prix HT</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!trainings || trainings.length === 0 ? (
                  <TableEmpty colSpan={6}>Aucune formation pour le moment.</TableEmpty>
                ) : (
                  trainings.map((training) => (
                    <TableRow key={training.id}>
                      <TableCell>{training.title}</TableCell>
                      <TableCell>{training.category ?? "—"}</TableCell>
                      <TableCell>{training.duration_hours}h</TableCell>
                      <TableCell>{training.price_ht} €</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[training.status] ?? "neutral"}>
                          {STATUS_LABELS[training.status] ?? training.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/formations/nouvelle?id=${training.id}`}
                          className="text-accent-text hover:underline"
                        >
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
