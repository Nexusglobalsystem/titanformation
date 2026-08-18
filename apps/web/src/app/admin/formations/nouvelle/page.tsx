import Link from "next/link";
import { SpaceShell } from "@/components/SpaceShell";
import { Card, CardContent, CardHeader, CardTitle } from "@titan-kinetic/ui";
import { TrainingForm } from "../_components/TrainingForm";
import { createTrainingAction } from "../_actions/trainings";

export default function NouvelleFormationPage() {
  return (
    <SpaceShell title="Espace administration">
      <Link href="/admin/formations" className="mb-4 inline-block font-body text-sm text-accent-text hover:underline">
        ← Retour aux formations
      </Link>
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Nouvelle formation</CardTitle>
        </CardHeader>
        <CardContent>
          <TrainingForm action={createTrainingAction} submitLabel="Créer la formation" />
        </CardContent>
      </Card>
    </SpaceShell>
  );
}
