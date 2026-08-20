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
  const [{ count: upcomingSessionsCount }, { data: learnerCount }, { data: upcomingSessionsRaw }] = await Promise.all([
    supabase
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .in("status", ["ouverte", "complete"])
      .gte("starts_on", today),
    supabase.rpc("public_learner_count"),
    supabase
      .from("sessions")
      .select("id, starts_on, ends_on, trainings!inner(slug, title, status)")
      .eq("trainings.status", "publiee")
      .in("status", ["ouverte", "complete"])
      .gte("starts_on", today)
      .order("starts_on", { ascending: true })
      .limit(6),
  ]);
  const upcomingSessions = (upcomingSessionsRaw ?? [])
    .filter((s) => s.trainings)
    .map((s) => ({
      id: s.id,
      startsOn: s.starts_on,
      endsOn: s.ends_on,
      trainingTitle: s.trainings!.title,
      trainingSlug: s.trainings!.slug,
    }));
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

  return (
    <HomeLanding
      popularTrainings={popularTrainings}
      categories={categories}
      stats={stats}
      upcomingSessions={upcomingSessions}
    />
  );
}
