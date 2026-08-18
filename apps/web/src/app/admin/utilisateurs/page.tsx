import { createClient } from "@/lib/supabase/server";
import { SpaceShell } from "@/components/SpaceShell";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@titan-kinetic/ui";
import { AddRoleForm } from "./_components/AddRoleForm";
import { revokeRoleAction } from "./_actions/roles";

const ALL_ROLES = ["admin", "gestionnaire", "formateur", "responsable_entreprise", "apprenant"] as const;

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  gestionnaire: "Gestionnaire",
  formateur: "Formateur",
  responsable_entreprise: "Responsable entreprise",
  apprenant: "Apprenant",
};

const ROLE_VARIANTS: Record<string, "featured" | "success" | "warning" | "neutral"> = {
  admin: "featured",
  gestionnaire: "featured",
  formateur: "success",
  responsable_entreprise: "warning",
  apprenant: "neutral",
};

export default async function UtilisateursPage() {
  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, created_at, user_roles!user_roles_user_id_fkey(role)")
    .order("created_at", { ascending: false });

  return (
    <SpaceShell title="Espace administration">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Utilisateurs et rôles</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {!profiles || profiles.length === 0 ? (
              <p className="font-body text-sm text-foreground-muted">Aucun utilisateur.</p>
            ) : (
              profiles.map((profile) => {
                const roles = (profile.user_roles ?? []).map((r) => r.role);
                const availableRoles = ALL_ROLES.filter((r) => !roles.includes(r));
                return (
                  <div
                    key={profile.id}
                    className="flex flex-col gap-3 rounded-DEFAULT border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-body text-sm font-semibold text-foreground">
                        {profile.first_name} {profile.last_name}
                      </p>
                      <p className="font-body text-xs text-foreground-muted">{profile.email}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {roles.map((role) => {
                        const canRevoke = !(role === "admin" && profile.id === currentUser?.id);
                        return (
                          <div
                            key={role}
                            className="flex items-center gap-1 rounded-full border border-border py-0.5 pl-1"
                          >
                            <Badge variant={ROLE_VARIANTS[role] ?? "neutral"}>{ROLE_LABELS[role] ?? role}</Badge>
                            {canRevoke && (
                              <form action={revokeRoleAction}>
                                <input type="hidden" name="userId" value={profile.id} />
                                <input type="hidden" name="role" value={role} />
                                <Button
                                  type="submit"
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 rounded-full p-0 text-xs"
                                  aria-label={`Retirer le rôle ${ROLE_LABELS[role] ?? role}`}
                                >
                                  ×
                                </Button>
                              </form>
                            )}
                          </div>
                        );
                      })}
                      <AddRoleForm userId={profile.id} availableRoles={availableRoles} />
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
