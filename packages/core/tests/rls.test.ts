import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../../../apps/web/.env.local") });

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "../src/supabase/admin";
import type { Database } from "../src/database.types";

/**
 * Tests RLS obligatoires (section 7 du prompt d'amorçage) : pour chaque table
 * sensible, on vérifie qu'un rôle non autorisé n'y accède pas. Exécutés en
 * intégration contre le projet Supabase cloud (pas de Postgres local
 * disponible) : un utilisateur B ne doit jamais voir les lignes appartenant à
 * un utilisateur A, sur profiles, user_roles, enrollments et attendances.
 */

const PASSWORD = "TestRls2026!";
const EMAIL_A = "test-rls-a@titankinetic.fr";
const EMAIL_B = "test-rls-b@titankinetic.fr";

const admin = createAdminClient();

let userAId: string;
let userBId: string;
let clientA: SupabaseClient<Database>;
let clientB: SupabaseClient<Database>;
let trainingId: string;
let sessionId: string;
let slotId: string;
let enrollmentId: string;

function anonClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

async function createConfirmedUser(email: string) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user.id;
}

async function signIn(email: string) {
  const client = anonClient();
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw error;
  return client;
}

beforeAll(async () => {
  userAId = await createConfirmedUser(EMAIL_A);
  userBId = await createConfirmedUser(EMAIL_B);
  clientA = await signIn(EMAIL_A);
  clientB = await signIn(EMAIL_B);

  const { data: training, error: trainingError } = await admin
    .from("trainings")
    .insert({
      slug: `rls-test-${Date.now()}`,
      title: "Formation test RLS",
      summary: "Fixture de test, non destinée à l'affichage.",
      objectives: "N/A",
      prerequisites: "Aucun",
      target_audience: "N/A",
      duration_hours: 7,
      price_ht: 100,
      modalities: "N/A",
      access_delay: "N/A",
      pedagogical_means: "N/A",
      assessment_methods: "N/A",
      accessibility_info: "N/A",
      status: "brouillon",
    })
    .select()
    .single();
  if (trainingError) throw trainingError;
  trainingId = training.id;

  const { data: session, error: sessionError } = await admin
    .from("sessions")
    .insert({
      training_id: trainingId,
      reference: `RLS-TEST-${Date.now()}`,
      status: "ouverte",
      starts_on: "2026-10-01",
      ends_on: "2026-10-01",
    })
    .select()
    .single();
  if (sessionError) throw sessionError;
  sessionId = session.id;

  const { data: slot, error: slotError } = await admin
    .from("session_slots")
    .insert({
      session_id: sessionId,
      slot_date: "2026-10-01",
      half_day: "matin",
      starts_at: "2026-10-01T09:00:00Z",
      ends_at: "2026-10-01T12:00:00Z",
    })
    .select()
    .single();
  if (slotError) throw slotError;
  slotId = slot.id;

  const { data: enrollment, error: enrollmentError } = await admin
    .from("enrollments")
    .insert({
      session_id: sessionId,
      learner_id: userAId,
      status: "confirme",
      funding: "particulier_cb",
    })
    .select()
    .single();
  if (enrollmentError) throw enrollmentError;
  enrollmentId = enrollment.id;

  // trg_create_attendance_rows crée automatiquement la ligne d'émargement
  // dès que l'inscription passe à 'confirme' — pas d'insert manuel ici.
});

afterAll(async () => {
  // L'enrollment (et l'attendance auto-créée par trigger) doivent partir
  // avant la session/le profil : leurs FK sont "on delete restrict".
  if (enrollmentId) await admin.from("enrollments").delete().eq("id", enrollmentId);
  if (sessionId) await admin.from("sessions").delete().eq("id", sessionId);
  if (trainingId) await admin.from("trainings").delete().eq("id", trainingId);
  if (userAId) await admin.auth.admin.deleteUser(userAId);
  if (userBId) await admin.auth.admin.deleteUser(userBId);
});

describe("RLS — profiles", () => {
  it("B ne voit pas le profil de A", async () => {
    const { data } = await clientB.from("profiles").select("id").eq("id", userAId);
    expect(data).toEqual([]);
  });

  it("A voit son propre profil", async () => {
    const { data } = await clientA.from("profiles").select("id").eq("id", userAId);
    expect(data).toHaveLength(1);
  });
});

describe("RLS — user_roles", () => {
  it("B ne voit pas les rôles de A", async () => {
    const { data } = await clientB.from("user_roles").select("role").eq("user_id", userAId);
    expect(data).toEqual([]);
  });

  it("A voit ses propres rôles", async () => {
    const { data } = await clientA.from("user_roles").select("role").eq("user_id", userAId);
    expect(data!.length).toBeGreaterThan(0);
  });
});

describe("RLS — enrollments", () => {
  it("B ne voit pas l'inscription de A", async () => {
    const { data } = await clientB.from("enrollments").select("id").eq("id", enrollmentId);
    expect(data).toEqual([]);
  });

  it("A voit sa propre inscription", async () => {
    const { data } = await clientA.from("enrollments").select("id").eq("id", enrollmentId);
    expect(data).toHaveLength(1);
  });
});

describe("RLS — attendances", () => {
  it("B ne voit pas l'émargement de A", async () => {
    const { data } = await clientB.from("attendances").select("id").eq("enrollment_id", enrollmentId);
    expect(data).toEqual([]);
  });

  it("A voit son propre émargement", async () => {
    const { data } = await clientA.from("attendances").select("id").eq("enrollment_id", enrollmentId);
    expect(data).toHaveLength(1);
  });
});
