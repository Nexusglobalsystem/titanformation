import { createClient } from "@/lib/supabase/server";
import { SpaceShell } from "@/components/SpaceShell";
import { SettingsForm } from "./_components/SettingsForm";

export default async function ParametresPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("organization_settings").select("*").eq("id", 1).maybeSingle();

  return (
    <SpaceShell title="Espace administration">
      <div className="flex max-w-3xl flex-col gap-6">
        <div>
          <h1 className="font-display text-xl font-semibold text-foreground">Paramètres</h1>
          <p className="mt-1 font-body text-sm text-foreground-muted">
            Informations légales de l&apos;organisme, utilisées sur les pages mentions légales,
            confidentialité et CGV.
          </p>
        </div>
        <SettingsForm settings={settings} />
      </div>
    </SpaceShell>
  );
}
