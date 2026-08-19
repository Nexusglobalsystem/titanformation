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
        <CardContent className="overflow-x-auto">
          <table className="w-full border-collapse font-body text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground-muted">
                <th className="py-2 pr-4">Permission</th>
                <th className="w-20 py-2 text-center">Admin</th>
                {EDITABLE_ROLES.map((role) => (
                  <th key={role} className="w-24 py-2 text-center">
                    {ROLE_LABELS[role]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <Fragment key={category}>
                  <tr className="bg-surface-elevated">
                    <td colSpan={5} className="py-1.5 pr-4 font-semibold text-foreground">
                      {category}
                    </td>
                  </tr>
                  {(permissions ?? [])
                    .filter((p) => p.category === category)
                    .map((p) => (
                      <tr key={p.key} className="border-b border-border/60">
                        <td className="py-2 pr-4 text-foreground-muted">{p.label}</td>
                        <td className="py-2 text-center">
                          <input type="checkbox" checked disabled className="h-4 w-4 accent-primary opacity-60" />
                        </td>
                        {EDITABLE_ROLES.map((role) => (
                          <td key={role} className="py-2 text-center">
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
        </CardContent>
      </Card>
    </SpaceShell>
  );
}
