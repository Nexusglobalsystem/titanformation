import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SpaceShell } from "@/components/SpaceShell";
import { Button, Card, CardContent, CardHeader, CardTitle, EmptyState } from "@titan-kinetic/ui";
import { IconUsers } from "@/components/icons";
import { AddEmployeeForm } from "./_components/AddEmployeeForm";
import { removeEmployeeAction } from "./_actions/employees";

export default async function SalariesPage() {
  const supabase = await createClient();
  const { data: companyIds } = await supabase.rpc("managed_company_ids");
  const companyId = companyIds?.[0] ?? null;

  const employees = companyId
    ? (
        await supabase
          .from("company_members")
          .select("user_id, profiles(id, first_name, last_name, email)")
          .eq("company_id", companyId)
          .eq("role", "salarie")
      ).data ?? []
    : [];

  return (
    <SpaceShell title="Espace entreprise">
      <div className="flex max-w-3xl flex-col gap-6">
        <div>
          <h1 className="font-display text-xl font-semibold text-foreground">Mes salariés</h1>
          <p className="mt-1 font-body text-sm text-foreground-muted">
            Rattachez vos salariés à votre entreprise pour suivre leurs formations.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ajouter un salarié</CardTitle>
          </CardHeader>
          <CardContent>
            <AddEmployeeForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Salariés rattachés</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {employees.length === 0 ? (
              <EmptyState icon={<IconUsers />} title="Aucun salarié rattaché pour le moment." />
            ) : (
              employees.map((member) => {
                const p = member.profiles;
                if (!p) return null;
                return (
                  <div
                    key={member.user_id}
                    className="flex flex-col gap-2 rounded-DEFAULT border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-body text-sm font-semibold text-foreground">
                        {`${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "—"}
                      </p>
                      <p className="font-body text-xs text-foreground-muted">{p.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/entreprise/salaries/${p.id}`}
                        className="font-body text-sm text-accent-text hover:underline"
                      >
                        Voir la progression
                      </Link>
                      <form action={removeEmployeeAction}>
                        <input type="hidden" name="userId" value={p.id} />
                        <input type="hidden" name="companyId" value={companyId ?? ""} />
                        <Button type="submit" variant="ghost" size="sm">
                          Retirer
                        </Button>
                      </form>
                    </div>
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
