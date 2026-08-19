"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const CLAIM_STATUSES = ["ouverte", "en_cours", "resolue", "refusee"] as const;

const STATUS_LABELS: Record<string, string> = {
  ouverte: "Ouverte",
  en_cours: "En cours",
  resolue: "Résolue",
  refusee: "Refusée",
};

export type UpdateClaimState = { error?: string } | undefined;

export async function updateClaimAction(
  _prev: UpdateClaimState,
  formData: FormData,
): Promise<UpdateClaimState> {
  const claimId = formData.get("claimId");
  const status = formData.get("status");
  const resolution = formData.get("resolution");
  const correctiveAction = formData.get("corrective_action");

  if (
    typeof claimId !== "string" ||
    typeof status !== "string" ||
    !CLAIM_STATUSES.includes(status as (typeof CLAIM_STATUSES)[number])
  ) {
    return { error: "Formulaire invalide." };
  }

  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc("has_permission", { p_key: "claims.manage" });
  if (!allowed) {
    return { error: "Vous n'avez pas la permission de traiter les réclamations." };
  }

  const isResolved = status === "resolue" || status === "refusee";

  const { data: claim, error } = await supabase
    .from("claims")
    .update({
      status: status as (typeof CLAIM_STATUSES)[number],
      resolution: typeof resolution === "string" && resolution.trim() ? resolution.trim() : null,
      corrective_action:
        typeof correctiveAction === "string" && correctiveAction.trim() ? correctiveAction.trim() : null,
      resolved_at: isResolved ? new Date().toISOString() : null,
    })
    .eq("id", claimId)
    .select("subject, submitted_by")
    .single();

  if (error) {
    return { error: "Impossible de mettre à jour la réclamation : " + error.message };
  }

  if (claim.submitted_by) {
    await supabase.from("notifications").insert({
      user_id: claim.submitted_by,
      title: "Réclamation mise à jour",
      body: `Votre réclamation « ${claim.subject} » est maintenant : ${STATUS_LABELS[status] ?? status}.`,
      link: "/apprenant/reclamations",
    });
  }

  revalidatePath("/admin/reclamations");
}
