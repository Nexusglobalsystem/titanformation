import Link from "next/link";
import { SpaceShell } from "@/components/SpaceShell";
import { Card, CardContent, CardHeader, CardTitle } from "@titan-kinetic/ui";
import { ProgrammeForm } from "../_components/ProgrammeForm";
import { createProgrammeAction } from "../_actions/programmes";

export default function NouveauProgrammePage() {
  return (
    <SpaceShell title="Espace administration">
      <Link href="/admin/programmes" className="mb-4 inline-block font-body text-sm text-accent-text hover:underline">
        ← Retour aux programmes
      </Link>
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Nouveau programme</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgrammeForm action={createProgrammeAction} submitLabel="Créer le programme" />
        </CardContent>
      </Card>
    </SpaceShell>
  );
}
