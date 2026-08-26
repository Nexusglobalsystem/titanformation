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

  let certificationRequirement: {
    id: string;
    min_attendance_pct: number | null;
    min_grade: number | null;
    requires_final_exam: boolean;
    final_exam_lesson_id: string | null;
    requires_pedagogical_signoff: boolean;
  } | null = null;
  let requiredModuleIds: string[] = [];
  let certificationEnrollments: {
    id: string;
    learnerName: string;
    signedAt: string | null;
    signedByName: string | null;
    comment: string | null;
  }[] = [];

  if (training.is_certifying) {
    const { data: req } = await supabase
      .from("certification_requirements")
      .select(
        "id, min_attendance_pct, min_grade, requires_final_exam, final_exam_lesson_id, requires_pedagogical_signoff",
      )
      .eq("training_id", id)
      .maybeSingle();
    certificationRequirement = req ?? null;

    if (certificationRequirement) {
      const { data: reqModules } = await supabase
        .from("certification_required_modules")
        .select("module_id")
        .eq("requirement_id", certificationRequirement.id);
      requiredModuleIds = (reqModules ?? []).map((m) => m.module_id);

      if (certificationRequirement.requires_pedagogical_signoff) {
        const { data: enrollments } = await supabase
          .from("enrollments")
          .select("id, profiles(first_name, last_name), sessions!inner(training_id)")
          .eq("sessions.training_id", id)
          .in("status", ["confirme", "termine"]);

        const enrollmentIds = (enrollments ?? []).map((e) => e.id);
        const { data: signoffs } = enrollmentIds.length
          ? await supabase
              .from("certification_signoffs")
              .select("enrollment_id, signed_at, comment, profiles(first_name, last_name)")
              .in("enrollment_id", enrollmentIds)
          : { data: [] };

        const signoffByEnrollment = new Map((signoffs ?? []).map((s) => [s.enrollment_id, s]));
        certificationEnrollments = (enrollments ?? []).map((e) => {
          const signoff = signoffByEnrollment.get(e.id);
          return {
            id: e.id,
            learnerName: `${e.profiles?.first_name ?? ""} ${e.profiles?.last_name ?? ""}`.trim() || "—",
            signedAt: signoff?.signed_at ?? null,
            signedByName: signoff?.profiles
              ? `${signoff.profiles.first_name ?? ""} ${signoff.profiles.last_name ?? ""}`.trim()
              : null,
            comment: signoff?.comment ?? null,
          };
        });
      }
    }
  }

  const quizLessons = (modules ?? [])
    .flatMap((m) => m.lessons ?? [])
    .filter((l) => l.type === "quiz")
    .map((l) => ({ id: l.id, title: l.title }));

  const { data: satisfactionForm } = await supabase
    .from("evaluation_forms")
    .select("id")
    .eq("training_id", id)
    .eq("kind", "satisfaction_chaud")
    .maybeSingle();

  let satisfactionResponseCount = 0;
  if (satisfactionForm) {
    const { count } = await supabase
      .from("evaluation_responses")
      .select("id", { count: "exact", head: true })
      .eq("form_id", satisfactionForm.id);
    satisfactionResponseCount = count ?? 0;
  }

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
        certificationRequirement={certificationRequirement}
        requiredModuleIds={requiredModuleIds}
        certificationEnrollments={certificationEnrollments}
        quizLessons={quizLessons}
        satisfactionFormId={satisfactionForm?.id ?? null}
        satisfactionResponseCount={satisfactionResponseCount}
      />
    </SpaceShell>
  );
}
