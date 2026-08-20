import { redirect } from "next/navigation";
import { homePathForRoles, type AppRole } from "@titan-kinetic/core";
import { createClient } from "@/lib/supabase/server";
import { HomeLanding } from "./_components/HomeLanding";
import { enrichTrainings } from "./formations/_lib/enrichTrainings";

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

  const { data: trainings } = await supabase
    .from("trainings")
    .select("*")
    .eq("status", "publiee")
    .order("published_at", { ascending: false });
  const enriched = await enrichTrainings(supabase, trainings ?? []);
  const popularTrainings = enriched.filter((t) => t.isPopular);
  const categories = Array.from(
    new Set(enriched.map((t) => t.category).filter((c): c is string => Boolean(c))),
  );

  return <HomeLanding popularTrainings={popularTrainings} categories={categories} />;
}
