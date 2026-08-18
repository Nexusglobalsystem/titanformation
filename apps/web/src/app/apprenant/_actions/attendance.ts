"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SignAttendanceState = { error?: string } | undefined;

export async function signAttendanceAction(
  _prev: SignAttendanceState,
  formData: FormData,
): Promise<SignAttendanceState> {
  const attendanceId = formData.get("attendanceId");
  if (typeof attendanceId !== "string") {
    return { error: "Émargement invalide." };
  }

  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  const signatureIp = forwardedFor ? forwardedFor.split(",")[0]!.trim() : null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("attendances")
    .update({ signed_at: new Date().toISOString(), present: true, signature_ip: signatureIp })
    .eq("id", attendanceId);

  if (error) {
    return { error: "Impossible de signer : " + error.message };
  }

  revalidatePath("/apprenant");
}
