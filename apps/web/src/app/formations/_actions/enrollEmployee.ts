"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import { enrollmentConfirmationEmail } from "@/lib/email/templates";

export type EnrollEmployeeState = { error?: string; success?: string } | undefined;

export async function enrollEmployeeAction(
  _prev: EnrollEmployeeState,
  formData: FormData,
): Promise<EnrollEmployeeState> {
  const sessionId = formData.get("sessionId");
  const slug = formData.get("slug");
  const employeeId = formData.get("employeeId");

  if (typeof sessionId !== "string" || typeof slug !== "string" || typeof employeeId !== "string") {
    return { error: "Formulaire invalide." };
  }

  const supabase = await createClient();
  const { data: companyIds } = await supabase.rpc("managed_company_ids");
  const companyId = companyIds?.[0];
  if (!companyId) return { error: "Aucune entreprise associée à votre compte." };

  // Défense en profondeur : la policy RLS "responsable gere les
  // inscriptions de ses salaries" ne vérifie que company_id, pas que le
  // salarié sélectionné appartient réellement à cette entreprise.
  const { data: membership } = await supabase
    .from("company_members")
    .select("user_id")
    .eq("company_id", companyId)
    .eq("user_id", employeeId)
    .eq("role", "salarie")
    .maybeSingle();
  if (!membership) return { error: "Ce salarié n'appartient pas à votre entreprise." };

  const { error } = await supabase.from("enrollments").insert({
    session_id: sessionId,
    learner_id: employeeId,
    company_id: companyId,
    status: "preinscrit",
    funding: "entreprise_directe",
  });

  if (error) {
    if (error.code === "23505") {
      return { success: "Ce salarié est déjà préinscrit à cette session." };
    }
    return { error: "Impossible d'enregistrer l'inscription : " + error.message };
  }

  try {
    const [{ data: session }, { data: employeeProfile }] = await Promise.all([
      supabase
        .from("sessions")
        .select("reference, starts_on, ends_on, trainings(title)")
        .eq("id", sessionId)
        .single(),
      supabase.from("profiles").select("email, first_name").eq("id", employeeId).single(),
    ]);
    if (session?.trainings && employeeProfile?.email) {
      const { subject, html } = enrollmentConfirmationEmail({
        recipientName: employeeProfile.first_name || employeeProfile.email,
        trainingTitle: session.trainings.title,
        sessionReference: session.reference,
        startsOn: session.starts_on,
        endsOn: session.ends_on,
      });
      await sendEmail({ to: employeeProfile.email, subject, html });
    }
  } catch (err) {
    console.error("[email] confirmation d'inscription (salarié) :", err);
  }

  revalidatePath(`/formations/${slug}`);
  revalidatePath("/entreprise/salaries");
  return { success: "Préinscription enregistrée pour ce salarié." };
}
