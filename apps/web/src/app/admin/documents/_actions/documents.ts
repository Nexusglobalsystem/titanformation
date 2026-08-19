"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DOCUMENT_TYPES } from "../_lib/document-types";

const GENERATED_TYPES = ["convocation", "attestation_fin_formation"] as const;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildDocumentHtml({
  kind,
  learnerName,
  trainingTitle,
  durationHours,
  modalities,
  startsOn,
  endsOn,
  reference,
}: {
  kind: (typeof GENERATED_TYPES)[number];
  learnerName: string;
  trainingTitle: string;
  durationHours: number;
  modalities: string;
  startsOn: string;
  endsOn: string;
  reference: string;
}) {
  const generatedDate = new Date().toLocaleDateString("fr-FR");
  const startFr = new Date(startsOn + "T00:00:00").toLocaleDateString("fr-FR");
  const endFr = new Date(endsOn + "T00:00:00").toLocaleDateString("fr-FR");

  const title = kind === "convocation" ? "Convocation" : "Attestation de fin de formation";
  const intro =
    kind === "convocation"
      ? `<p>Nous avons le plaisir de vous convoquer à la session de formation suivante :</p>`
      : `<p>Nous attestons que <strong>${escapeHtml(learnerName)}</strong> a suivi la formation suivante :</p>`;

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>${title} — ${escapeHtml(trainingTitle)}</title>
<style>
  body { font-family: Georgia, "Times New Roman", serif; max-width: 680px; margin: 48px auto; color: #1a1a2e; line-height: 1.7; padding: 0 24px; }
  h1 { font-size: 1.6rem; border-bottom: 2px solid #003366; padding-bottom: 10px; color: #003366; }
  .meta { color: #555; font-size: 0.9rem; margin-bottom: 28px; }
  .field { margin-bottom: 10px; }
  .label { font-weight: bold; display: inline-block; min-width: 140px; }
  footer { margin-top: 48px; font-size: 0.8rem; color: #777; border-top: 1px solid #ddd; padding-top: 12px; }
</style>
</head>
<body>
  <h1>${title}</h1>
  <p class="meta">Titan Kinetic — Organisme de formation certifié Qualiopi</p>
  ${kind === "convocation" ? `<p>Madame, Monsieur ${escapeHtml(learnerName)},</p>` : ""}
  ${intro}
  <div class="field"><span class="label">Formation :</span> ${escapeHtml(trainingTitle)}</div>
  <div class="field"><span class="label">Dates :</span> du ${startFr} au ${endFr}</div>
  <div class="field"><span class="label">Durée :</span> ${durationHours} heures</div>
  <div class="field"><span class="label">Modalités :</span> ${escapeHtml(modalities)}</div>
  ${kind === "convocation" ? `<p>Merci de vous présenter selon les modalités indiquées ci-dessus.</p>` : ""}
  <footer>Document généré le ${generatedDate} — référence ${reference}</footer>
</body>
</html>`;
}

export type DocumentActionState = { error?: string } | undefined;

export async function generateDocumentAction(
  _prev: DocumentActionState,
  formData: FormData,
): Promise<DocumentActionState> {
  const enrollmentId = formData.get("enrollmentId");
  const kind = formData.get("kind");

  if (
    typeof enrollmentId !== "string" ||
    typeof kind !== "string" ||
    !GENERATED_TYPES.includes(kind as (typeof GENERATED_TYPES)[number])
  ) {
    return { error: "Formulaire invalide." };
  }

  const supabase = await createClient();
  const { data: enrollment, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("id, profiles(first_name, last_name), sessions(starts_on, ends_on, trainings(title, duration_hours, modalities))")
    .eq("id", enrollmentId)
    .single();

  if (enrollmentError || !enrollment) {
    return { error: "Inscription introuvable." };
  }

  const learner = enrollment.profiles;
  const session = enrollment.sessions;
  const training = session?.trainings;
  if (!learner || !session || !training) {
    return { error: "Données d'inscription incomplètes pour générer ce document." };
  }

  const reference = `${kind.toUpperCase()}-${enrollmentId.slice(0, 8).toUpperCase()}-${Date.now()}`;
  const html = buildDocumentHtml({
    kind: kind as (typeof GENERATED_TYPES)[number],
    learnerName: `${learner.first_name ?? ""} ${learner.last_name ?? ""}`.trim(),
    trainingTitle: training.title,
    durationHours: training.duration_hours,
    modalities: training.modalities,
    startsOn: session.starts_on,
    endsOn: session.ends_on,
    reference,
  });

  const path = `enrollments/${enrollmentId}/${kind}-${Date.now()}.html`;
  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(path, new Blob([html], { type: "text/html" }), { upsert: true, contentType: "text/html" });

  if (uploadError) {
    return { error: "Échec de la génération : " + uploadError.message };
  }

  const { error: insertError } = await supabase.from("documents").insert({
    type: kind as (typeof GENERATED_TYPES)[number],
    enrollment_id: enrollmentId,
    storage_path: path,
  });

  if (insertError) {
    return { error: "Document généré mais échec de l'enregistrement : " + insertError.message };
  }

  revalidatePath("/admin/documents");
}

export async function uploadDocumentAction(
  _prev: DocumentActionState,
  formData: FormData,
): Promise<DocumentActionState> {
  const enrollmentId = formData.get("enrollmentId");
  const type = formData.get("type");
  const file = formData.get("file");

  if (
    typeof enrollmentId !== "string" ||
    typeof type !== "string" ||
    !DOCUMENT_TYPES.includes(type as (typeof DOCUMENT_TYPES)[number])
  ) {
    return { error: "Formulaire invalide." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Sélectionnez un fichier." };
  }

  const supabase = await createClient();
  const path = `enrollments/${enrollmentId}/${type}-${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("documents").upload(path, file);

  if (uploadError) {
    return { error: "Échec de l'envoi : " + uploadError.message };
  }

  const { error: insertError } = await supabase.from("documents").insert({
    type: type as (typeof DOCUMENT_TYPES)[number],
    enrollment_id: enrollmentId,
    storage_path: path,
  });

  if (insertError) {
    return { error: "Fichier envoyé mais échec de l'enregistrement : " + insertError.message };
  }

  revalidatePath("/admin/documents");
}

export async function deleteDocumentAction(formData: FormData) {
  const id = formData.get("id");
  const storagePath = formData.get("storagePath");
  if (typeof id !== "string" || typeof storagePath !== "string") return;

  const supabase = await createClient();
  await supabase.storage.from("documents").remove([storagePath]);
  await supabase.from("documents").delete().eq("id", id);
  revalidatePath("/admin/documents");
}
