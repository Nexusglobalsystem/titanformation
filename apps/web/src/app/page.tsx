import { redirect } from "next/navigation";
import { homePathForRoles, type AppRole } from "@titan-kinetic/core";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: roleRows } = await supabase.from("user_roles").select("role");
    const roles = (roleRows ?? []).map((r) => r.role as AppRole);
    redirect(homePathForRoles(roles));
  }

  redirect("/formations");
}
