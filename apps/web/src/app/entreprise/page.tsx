import { createClient } from "@/lib/supabase/server";
import { SpaceShell } from "@/components/SpaceShell";
import { Card, CardContent, CardHeader, CardTitle } from "@titan-kinetic/ui";

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

  return (
    <SpaceShell title="Espace entreprise">
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Bienvenue{profile?.first_name ? `, ${profile.first_name}` : ""}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-body text-sm text-foreground-muted">
            Espace réservé au responsable entreprise.
          </p>
        </CardContent>
      </Card>
    </SpaceShell>
  );
}
