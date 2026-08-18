"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SubmitClaimState = { error?: string } | undefined;

export async function submitClaimAction(
  _prev: SubmitClaimState,
  formData: FormData,
): Promise<SubmitClaimState> {
  const subject = formData.get("subject");
  const body = formData.get("body");

  if (typeof subject !== "string" || !subject.trim() || typeof body !== "string" || !body.trim()) {
    return { error: "Sujet et description sont requis." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("claims").insert({
    submitted_by: user!.id,
    subject: subject.trim(),
    body: body.trim(),
  });

  if (error) {
    return { error: "Impossible d'envoyer la réclamation : " + error.message };
  }

  revalidatePath("/apprenant/reclamations");
}
