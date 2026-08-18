import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../../../../apps/web/.env.local") });

import { createAdminClient } from "../supabase/admin";
import type { AppRole } from "../roles";

const SEED_PASSWORD = "TitanKinetic2026!";

const admin = createAdminClient();

const DIACRITICS = new RegExp("[̀-ͯ]", "g");

function slugify(value: string) {
  return value.normalize("NFD").replace(DIACRITICS, "").toLowerCase();
}

async function createUser(email: string, firstName: string, lastName: string, roles: AppRole[]) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: SEED_PASSWORD,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName },
  });

  if (error) throw new Error(`Création de ${email} impossible : ${error.message}`);
  const userId = data.user.id;

  // Le trigger on_auth_user_created a déjà créé le profil et accordé le rôle
  // 'apprenant'. On ajoute les rôles supplémentaires demandés (upsert : idempotent).
  const extraRoles = roles.filter((role) => role !== "apprenant");
  if (extraRoles.length > 0) {
    const { error: roleError } = await admin
      .from("user_roles")
      .upsert(
        extraRoles.map((role) => ({ user_id: userId, role })),
        { onConflict: "user_id,role" },
      );
    if (roleError) throw new Error(`Attribution des rôles à ${email} impossible : ${roleError.message}`);
  }

  console.log(`  ✓ ${email} (${roles.join(", ")})`);
  return userId;
}

async function main() {
  console.log("Seed Titan Kinetic — mot de passe pour tous les comptes :", SEED_PASSWORD);

  console.log("\nComptes staff");
  await createUser("admin@titankinetic.fr", "Alix", "Moreau", ["admin"]);
  await createUser("gestion@titankinetic.fr", "Camille", "Girard", ["gestionnaire"]);
  const formateur1Id = await createUser("f.bernard@titankinetic.fr", "Farid", "Bernard", ["formateur"]);
  await createUser("s.lecomte@titankinetic.fr", "Sophie", "Lecomte", ["formateur"]);

  console.log("\nEntreprise cliente");
  const { data: company, error: companyError } = await admin
    .from("companies")
    .insert({
      name: "Constructa BTP",
      siret: "81234567800019",
      address_line1: "12 rue des Bâtisseurs",
      postal_code: "69003",
      city: "Lyon",
      country: "FR",
      opco_name: "Constructys",
      billing_email: "compta@constructa-btp.fr",
    })
    .select()
    .single();
  if (companyError) throw new Error(`Création entreprise impossible : ${companyError.message}`);
  console.log(`  ✓ ${company.name}`);

  const responsableId = await createUser(
    "r.perrin@constructa-btp.fr",
    "Romain",
    "Perrin",
    ["responsable_entreprise"],
  );

  const salarieIds: string[] = [];
  for (const [firstName, lastName] of [
    ["Julie", "Faure"],
    ["Mehdi", "Belkacem"],
    ["Nora", "Chevallier"],
  ] as const) {
    const id = await createUser(
      `${slugify(firstName)}.${slugify(lastName)}@constructa-btp.fr`,
      firstName,
      lastName,
      ["apprenant"],
    );
    salarieIds.push(id);
  }

  const { error: membersError } = await admin.from("company_members").insert([
    { company_id: company.id, user_id: responsableId, role: "responsable" },
    ...salarieIds.map((user_id) => ({ company_id: company.id, user_id, role: "salarie" as const })),
  ]);
  if (membersError) throw new Error(`Rattachement des salariés impossible : ${membersError.message}`);

  console.log("\nApprenants particuliers");
  for (const [firstName, lastName] of [
    ["Claire", "Dubois"],
    ["Karim", "Haddad"],
    ["Léa", "Martin"],
    ["Thomas", "Roux"],
    ["Amandine", "Petit"],
  ] as const) {
    await createUser(
      `${slugify(firstName)}.${slugify(lastName)}@exemple.fr`,
      firstName,
      lastName,
      ["apprenant"],
    );
  }

  console.log("\nCatalogue");
  const { data: trainings, error: trainingsError } = await admin
    .from("trainings")
    .insert([
      {
        slug: "management-equipe-distance",
        title: "Manager une équipe à distance",
        summary: "Structurer le pilotage et l'animation d'une équipe hybride ou 100% distante.",
        objectives:
          "Mettre en place des rituels d'équipe efficaces ; fixer des objectifs mesurables ; " +
          "détecter les signaux faibles de désengagement à distance.",
        prerequisites: "Aucun.",
        target_audience: "Managers et futurs managers encadrant une équipe hybride ou distante.",
        duration_hours: 21,
        duration_days: 3,
        price_ht: 1490,
        vat_rate: 0,
        modalities: "Blended : classes virtuelles synchrones et modules asynchrones.",
        access_delay: "Inscription possible jusqu'à 48h avant le début de la session.",
        pedagogical_means:
          "Classes virtuelles LiveKit, études de cas, mises en situation, ressources vidéo et quiz.",
        assessment_methods:
          "Quiz de positionnement en amont, quiz de validation des acquis, étude de cas notée.",
        accessibility_info:
          "Formation accessible aux personnes en situation de handicap. Contactez le référent handicap " +
          "à handicap@titankinetic.fr pour toute adaptation nécessaire.",
        satisfaction_rate: 92,
        success_rate: 88,
        stats_updated_at: "2026-06-01",
        is_certifying: false,
        status: "publiee",
        published_at: new Date().toISOString(),
      },
      {
        slug: "prevention-risques-psychosociaux",
        title: "Prévention des risques psychosociaux",
        summary: "Identifier, prévenir et traiter les risques psychosociaux au sein de son équipe.",
        objectives:
          "Repérer les facteurs de risques psychosociaux ; outiller les managers pour agir en prévention ; " +
          "construire un plan d'action adapté à son organisation.",
        prerequisites: "Aucun.",
        target_audience: "Managers, RH, référents QVCT.",
        duration_hours: 14,
        duration_days: 2,
        price_ht: 990,
        vat_rate: 0,
        modalities: "Blended : classes virtuelles synchrones et modules asynchrones.",
        access_delay: "Inscription possible jusqu'à 48h avant le début de la session.",
        pedagogical_means: "Classes virtuelles LiveKit, ateliers pratiques, ressources documentaires et quiz.",
        assessment_methods: "Quiz de validation des acquis, plan d'action individuel évalué par le formateur.",
        accessibility_info:
          "Formation accessible aux personnes en situation de handicap. Contactez le référent handicap " +
          "à handicap@titankinetic.fr pour toute adaptation nécessaire.",
        satisfaction_rate: 95,
        success_rate: 91,
        stats_updated_at: "2026-06-01",
        is_certifying: false,
        status: "publiee",
        published_at: new Date().toISOString(),
      },
    ])
    .select();
  if (trainingsError) throw new Error(`Création du catalogue impossible : ${trainingsError.message}`);
  trainings.forEach((t) => console.log(`  ✓ ${t.title}`));

  console.log("\nSession à venir");
  const mainTraining = trainings.find((t) => t.slug === "management-equipe-distance")!;
  const { data: session, error: sessionError } = await admin
    .from("sessions")
    .insert({
      training_id: mainTraining.id,
      reference: "FORM-2026-014",
      status: "ouverte",
      starts_on: "2026-09-15",
      ends_on: "2026-09-17",
      min_seats: 4,
      max_seats: 12,
    })
    .select()
    .single();
  if (sessionError) throw new Error(`Création de la session impossible : ${sessionError.message}`);
  console.log(`  ✓ ${session.reference} — ${mainTraining.title} (15–17 sept. 2026)`);

  const { error: trainerError } = await admin
    .from("session_trainers")
    .insert({ session_id: session.id, trainer_id: formateur1Id, is_lead: true });
  if (trainerError) throw new Error(`Affectation du formateur impossible : ${trainerError.message}`);

  const slotDays = ["2026-09-15", "2026-09-16", "2026-09-17"] as const;
  const { error: slotsError } = await admin.from("session_slots").insert(
    slotDays.flatMap((day) => [
      {
        session_id: session.id,
        slot_date: day,
        half_day: "matin" as const,
        starts_at: `${day}T07:00:00Z`,
        ends_at: `${day}T10:30:00Z`,
      },
      {
        session_id: session.id,
        slot_date: day,
        half_day: "apres_midi" as const,
        starts_at: `${day}T12:00:00Z`,
        ends_at: `${day}T15:30:00Z`,
      },
    ]),
  );
  if (slotsError) throw new Error(`Création des créneaux impossible : ${slotsError.message}`);
  console.log(`  ✓ 6 créneaux (3 jours × matin/après-midi)`);

  console.log("\nSeed terminé.");
}

main().catch((error) => {
  console.error("\nÉchec du seed :", error.message);
  process.exit(1);
});
