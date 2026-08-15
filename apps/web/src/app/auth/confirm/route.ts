import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { homePathForRoles, type AppRole } from "@titan-kinetic/core";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next");

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

    if (!error) {
      if (next) {
        redirect(next);
      }

      const { data: roleRows } = await supabase.from("user_roles").select("role");
      const roles = (roleRows ?? []).map((r) => r.role as AppRole);
      redirect(homePathForRoles(roles));
    }
  }

  redirect("/connexion?erreur=lien_invalide");
}
