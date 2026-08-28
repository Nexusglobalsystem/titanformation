import { createClient } from "@/lib/supabase/server";
import { SpaceShell } from "@/components/SpaceShell";
import { DevisRowActions } from "./_components/DevisRowActions";
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
  devis: "Devis demandé",
  en_attente_paiement: "En attente de paiement",
  payee: "Payée",
  facturee: "Facturée",
  annulee: "Annulée",
  remboursee: "Remboursée",
};

const STATUS_VARIANTS: Record<string, "neutral" | "success" | "warning" | "error"> = {
  devis: "warning",
  en_attente_paiement: "warning",
  payee: "success",
  facturee: "success",
  annulee: "error",
  remboursee: "error",
};

export default async function AdminDevisPage() {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, reference, status, total_ht, created_at, companies(name), order_items(label, quantity), invoices(number)",
    )
    .order("created_at", { ascending: false });

  return (
    <SpaceShell title="Espace administration">
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-xl font-semibold text-foreground">Demandes de devis</h1>

        <Card>
          <CardHeader>
            <CardTitle>Toutes les demandes</CardTitle>
            <p className="font-body text-sm text-foreground-muted">
              Négociation et relance réalisées en dehors de l&apos;application — acceptez ou refusez
              une demande, puis générez et suivez la facture directement ici.
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden sm:table-cell">Référence</TableHead>
                  <TableHead>Entreprise</TableHead>
                  <TableHead className="hidden sm:table-cell">Contenu</TableHead>
                  <TableHead className="hidden sm:table-cell">Montant HT</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {!orders || orders.length === 0 ? (
                  <TableEmpty colSpan={7}>Aucune demande de devis pour le moment.</TableEmpty>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="hidden sm:table-cell">{order.reference}</TableCell>
                      <TableCell>
                        {order.companies?.name ?? "—"}
                        <div className="font-body text-xs text-foreground-muted sm:hidden">
                          {order.reference} · {order.total_ht.toLocaleString("fr-FR")} €
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{(order.order_items ?? []).map((i) => i.label).join(", ") || "—"}</TableCell>
                      <TableCell className="hidden sm:table-cell">{order.total_ht.toLocaleString("fr-FR")} €</TableCell>
                      <TableCell className="hidden sm:table-cell">{new Date(order.created_at).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[order.status] ?? "neutral"}>
                          {STATUS_LABELS[order.status] ?? order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DevisRowActions
                          orderId={order.id}
                          status={order.status}
                          invoiceNumber={order.invoices?.[0]?.number ?? null}
                        />
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
