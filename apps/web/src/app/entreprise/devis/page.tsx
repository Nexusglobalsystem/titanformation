import { createClient } from "@/lib/supabase/server";
import { SpaceShell } from "@/components/SpaceShell";
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState } from "@titan-kinetic/ui";
import { IconFileText } from "@/components/icons";
import { RequestQuoteForm } from "./_components/RequestQuoteForm";

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

export default async function DevisPage() {
  const supabase = await createClient();

  const { data: trainings } = await supabase
    .from("trainings")
    .select("id, title")
    .eq("status", "publiee")
    .order("title", { ascending: true });

  const { data: orders } = await supabase
    .from("orders")
    .select("id, reference, status, total_ht, created_at, order_items(label, quantity)")
    .order("created_at", { ascending: false });

  return (
    <SpaceShell title="Espace entreprise">
      <div className="flex max-w-2xl flex-col gap-6">
        <div>
          <h1 className="font-display text-xl font-semibold text-foreground">Demander un devis</h1>
          <p className="mt-1 font-body text-sm text-foreground-muted">
            Notre équipe vous recontactera pour finaliser les modalités.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nouvelle demande</CardTitle>
          </CardHeader>
          <CardContent>
            <RequestQuoteForm trainings={trainings ?? []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mes demandes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {!orders || orders.length === 0 ? (
              <EmptyState icon={<IconFileText />} title="Aucune demande de devis pour le moment." />
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col gap-2 rounded-DEFAULT border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-body text-sm font-semibold text-foreground">{order.reference}</p>
                    <p className="font-body text-xs text-foreground-muted">
                      {(order.order_items ?? []).map((i) => i.label).join(", ") || "—"} ·{" "}
                      {new Date(order.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <Badge variant={STATUS_VARIANTS[order.status] ?? "neutral"}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </SpaceShell>
  );
}
