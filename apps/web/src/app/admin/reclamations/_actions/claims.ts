"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const CLAIM_STATUSES = ["ouverte", "en_cours", "resolue", "refusee"] as const;

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
  const isResolved = status === "resolue" || status === "refusee";

  const { error } = await supabase
    .from("claims")
    .update({
      status: status as (typeof CLAIM_STATUSES)[number],
      resolution: typeof resolution === "string" && resolution.trim() ? resolution.trim() : null,
      corrective_action:
        typeof correctiveAction === "string" && correctiveAction.trim() ? correctiveAction.trim() : null,
      resolved_at: isResolved ? new Date().toISOString() : null,
    })
    .eq("id", claimId);

  if (error) {
    return { error: "Impossible de mettre à jour la réclamation : " + error.message };
  }

  revalidatePath("/admin/reclamations");
}
