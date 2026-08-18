"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function markNotificationReadAction(formData: FormData) {
  const id = formData.get("id");
  const redirectTo = formData.get("redirectTo");
  if (typeof id !== "string") return;

  const supabase = await createClient();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);

  if (typeof redirectTo === "string") revalidatePath(redirectTo);
}

export async function markAllNotificationsReadAction(formData: FormData) {
  const redirectTo = formData.get("redirectTo");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);

  if (typeof redirectTo === "string") revalidatePath(redirectTo);
}
