import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SpaceShell } from "@/components/SpaceShell";
import { FormationWizard } from "../_components/FormationWizard";

export default async function NouvelleFormationPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const supabase = await createClient();

  const { data: trainerRoles } = await supabase
    .from("user_roles")
    .select("user_id, profiles!user_roles_user_id_fkey(id, first_name, last_name)")
    .eq("role", "formateur");
  const trainers = (trainerRoles ?? [])
    .map((t) => t.profiles)
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  if (!id) {
    return (
      <SpaceShell title="Espace administration">
        <Link href="/admin/formations" className="mb-4 inline-block font-body text-sm text-accent-text hover:underline">
          ← Retour aux formations
        </Link>
        <FormationWizard
          training={null}
          trainingImageUrl={null}
          trainers={trainers}
          modules={[]}
          trainingSteps={[]}
          sessions={[]}
        />
      </SpaceShell>
    );
  }

  const { data: training } = await supabase.from("trainings").select("*").eq("id", id).maybeSingle();
  if (!training) notFound();

  const trainingImageUrl = training.image_path
    ? supabase.storage.from("training-images").getPublicUrl(training.image_path).data.publicUrl
    : null;

  const [{ data: modules }, { data: trainingStepsRaw }, { data: sessions }] = await Promise.all([
    supabase
      .from("modules")
      .select("id, title, position, lessons(id, title, type, duration_minutes, position, document_path)")
      .eq("training_id", id)
      .order("position", { ascending: true }),
    supabase
      .from("training_steps")
      .select("id, type, title, duration_minutes, modules(title)")
      .eq("training_id", id)
      .order("position", { ascending: true }),
    supabase
      .from("sessions")
      .select(
        "id, reference, status, starts_on, ends_on, max_seats, session_trainers(trainer_id, profiles(first_name, last_name)), session_slots(id, slot_date, half_day, modality)",
      )
      .eq("training_id", id)
      .order("starts_on", { ascending: true }),
  ]);

  return (
    <SpaceShell title="Espace administration">
      <Link href="/admin/formations" className="mb-4 inline-block font-body text-sm text-accent-text hover:underline">
        ← Retour aux formations
      </Link>
      <FormationWizard
        training={training}
        trainingImageUrl={trainingImageUrl}
        trainers={trainers}
        modules={modules ?? []}
        trainingSteps={trainingStepsRaw ?? []}
        sessions={sessions ?? []}
      />
    </SpaceShell>
  );
}
