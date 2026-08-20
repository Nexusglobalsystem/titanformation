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

  // Chiffres clés de l'accueil : uniquement des données réelles, jamais de
  // logo client ou de note inventée. apprenants formés passe par une RPC
  // (public_learner_count) car enrollments n'est pas lisible publiquement.
  const today = new Date().toISOString().slice(0, 10);
  const [{ count: upcomingSessionsCount }, { data: learnerCount }] = await Promise.all([
    supabase
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .in("status", ["ouverte", "complete"])
      .gte("starts_on", today),
    supabase.rpc("public_learner_count"),
  ]);
  const satisfactionRates = (trainings ?? [])
    .map((t) => t.satisfaction_rate)
    .filter((r): r is number => typeof r === "number");
  const avgSatisfaction =
    satisfactionRates.length > 0
      ? Math.round(satisfactionRates.reduce((a, b) => a + b, 0) / satisfactionRates.length)
      : null;

  const stats = {
    publishedTrainings: trainings?.length ?? 0,
    learnerCount: learnerCount ?? 0,
    upcomingSessions: upcomingSessionsCount ?? 0,
    avgSatisfaction,
  };

  return <HomeLanding popularTrainings={popularTrainings} categories={categories} stats={stats} />;
}
