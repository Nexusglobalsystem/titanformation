import { Fragment } from "react";
import { createClient } from "@/lib/supabase/server";
import { SpaceShell } from "@/components/SpaceShell";
import { Card, CardContent, CardHeader, CardTitle } from "@titan-kinetic/ui";
import { PermissionCheckbox } from "./_components/PermissionCheckbox";

const EDITABLE_ROLES = ["gestionnaire", "formateur", "responsable_entreprise"] as const;

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  gestionnaire: "Gestionnaire",
  formateur: "Formateur",
  responsable_entreprise: "Entreprise",
};

export default async function RolesPermissionsPage() {
  const supabase = await createClient();

  const [{ data: permissions }, { data: rolePermissions }] = await Promise.all([
    supabase.from("permissions").select("key, label, category").order("category").order("key"),
    supabase.from("role_permissions").select("role, permission_key"),
  ]);

  const granted = new Set((rolePermissions ?? []).map((rp) => `${rp.role}:${rp.permission_key}`));

  const categories = Array.from(new Set((permissions ?? []).map((p) => p.category)));

  return (
    <SpaceShell title="Espace administration">
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Rôles &amp; permissions</CardTitle>
          <p className="font-body text-sm text-foreground-muted">
            L&apos;admin a toujours accès à tout (garde-fou). Pour les 3 autres rôles, chaque
            case décide si ce rôle dispose de cette permission — indépendamment de ce qu&apos;autorise déjà
            la sécurité au niveau des données (RLS), qui reste le filet de sécurité en dernier ressort.
          </p>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto rounded-lg border border-border">
            <table className="w-full border-collapse font-body text-sm">
              <thead className="bg-surface-elevated">
                <tr>
                  <th className="px-4 py-3 text-left font-mono-label text-xs font-medium uppercase tracking-wide text-foreground-muted">
                    Permission
                  </th>
                  <th className="w-20 px-4 py-3 text-center font-mono-label text-xs font-medium uppercase tracking-wide text-foreground-muted">
                    Admin
                  </th>
                  {EDITABLE_ROLES.map((role) => (
                    <th
                      key={role}
                      className="w-24 px-4 py-3 text-center font-mono-label text-xs font-medium uppercase tracking-wide text-foreground-muted"
                    >
                      {ROLE_LABELS[role]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <Fragment key={category}>
                    <tr className="bg-surface-elevated">
                      <td colSpan={5} className="px-4 py-2 font-semibold text-foreground">
                        {category}
                      </td>
                    </tr>
                    {(permissions ?? [])
                      .filter((p) => p.category === category)
                      .map((p) => (
                        <tr
                          key={p.key}
                          className="border-b border-border last:border-0 transition-colors hover:bg-accent/10"
                        >
                          <td className="px-4 py-3 text-foreground-muted">{p.label}</td>
                          <td className="px-4 py-3 text-center">
                            <input type="checkbox" checked disabled className="h-4 w-4 accent-primary opacity-60" />
                          </td>
                          {EDITABLE_ROLES.map((role) => (
                            <td key={role} className="px-4 py-3 text-center">
                              <PermissionCheckbox
                                role={role}
                                permissionKey={p.key}
                                checked={granted.has(`${role}:${p.key}`)}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </SpaceShell>
  );
}
