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
import { GrantAccessForm } from "./_components/GrantAccessForm";
import { revokeAccessGrantAction } from "./_actions/accessGrants";

export default async function AdminAccesPage() {
  const supabase = await createClient();

  const [
    { data: grantsRaw },
    { data: profiles },
    { data: companies },
    { data: programmes },
    { data: trainings },
    { data: modulesRaw },
    { data: sessionsRaw },
  ] = await Promise.all([
    supabase
      .from("access_grants")
      .select(
        "id, expires_at, note, granted_at, profiles!access_grants_user_id_fkey(first_name, last_name), companies(name), programmes(title), trainings(title), modules(title), sessions(reference)",
      )
      .order("granted_at", { ascending: false }),
    supabase.from("profiles").select("id, first_name, last_name").order("last_name"),
    supabase.from("companies").select("id, name").order("name"),
    supabase.from("programmes").select("id, title").order("title"),
    supabase.from("trainings").select("id, title").order("title"),
    supabase.from("modules").select("id, title, trainings(title)").order("title"),
    supabase.from("sessions").select("id, reference, trainings(title)").order("reference"),
  ]);

  const users = (profiles ?? []).map((p) => ({
    id: p.id,
    name: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.id,
  }));
  const modules = (modulesRaw ?? []).map((m) => ({
    id: m.id,
    label: `${m.trainings?.title ?? "Formation"} — ${m.title}`,
  }));
  const sessions = (sessionsRaw ?? []).map((s) => ({
    id: s.id,
    label: `${s.trainings?.title ?? "Formation"} — ${s.reference}`,
  }));

  return (
    <SpaceShell title="Espace administration">
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-xl font-semibold text-foreground">Accès accordés</h1>
        <p className="font-body text-sm text-foreground-muted">
          Droits d&apos;accès explicites à un programme, une formation, un module ou une session,
          indépendants du rôle et de l&apos;inscription. Ils donnent uniquement une lecture du
          contenu — jamais la capacité de suivre une progression, tenter un quiz, signer une
          présence ou obtenir un certificat, qui restent conditionnés à une inscription réelle.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Accorder un accès</CardTitle>
          </CardHeader>
          <CardContent>
            <GrantAccessForm
              users={users}
              companies={companies ?? []}
              programmes={programmes ?? []}
              trainings={trainings ?? []}
              modules={modules}
              sessions={sessions}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accès en cours</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Accès</TableHead>
                  <TableHead className="hidden sm:table-cell">Accordé le</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!grantsRaw || grantsRaw.length === 0 ? (
                  <TableEmpty colSpan={4}>Aucun accès accordé pour le moment.</TableEmpty>
                ) : (
                  grantsRaw.map((g) => {
                    const who = g.profiles
                      ? `${g.profiles.first_name ?? ""} ${g.profiles.last_name ?? ""}`.trim()
                      : g.companies?.name
                        ? `Entreprise : ${g.companies.name}`
                        : "—";
                    const what =
                      g.programmes?.title ?? g.trainings?.title ?? g.modules?.title ?? g.sessions?.reference ?? "—";
                    const expired = g.expires_at ? new Date(g.expires_at) < new Date() : false;
                    return (
                      <TableRow key={g.id}>
                        <TableCell>
                          <p className="font-body text-sm text-foreground">
                            {who} → {what}
                          </p>
                          {g.note && (
                            <p className="font-body text-xs text-foreground-muted">{g.note}</p>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {new Date(g.granted_at).toLocaleDateString("fr-FR")}
                          {g.expires_at ? ` · Expire le ${new Date(g.expires_at).toLocaleDateString("fr-FR")}` : ""}
                        </TableCell>
                        <TableCell>
                          {expired ? (
                            <Badge variant="warning">Expiré</Badge>
                          ) : (
                            <Badge variant="success">Actif</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <form action={revokeAccessGrantAction}>
                            <input type="hidden" name="grantId" value={g.id} />
                            <Button type="submit" variant="ghost" size="sm">
                              Révoquer
                            </Button>
                          </form>
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
