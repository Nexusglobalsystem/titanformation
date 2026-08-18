import { z } from "zod";

const required = (label: string) => z.string({ required_error: `${label} est requis.` }).min(1, `${label} est requis.`);

const optionalString = () =>
  z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.string().optional());

const optionalNumber = () =>
  z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.coerce.number().positive().optional());

export const trainingSchema = z.object({
  slug: required("Le slug")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Le slug ne doit contenir que des minuscules, chiffres et tirets."),
  title: required("Le titre"),
  summary: required("Le résumé"),
  objectives: required("Les objectifs"),
  prerequisites: required("Les prérequis (indique « aucun » si besoin)"),
  target_audience: required("Le public visé"),
  duration_hours: z.coerce.number({ invalid_type_error: "Durée invalide." }).positive("La durée doit être positive."),
  duration_days: optionalNumber(),
  price_ht: z.coerce.number({ invalid_type_error: "Prix invalide." }).min(0, "Le prix ne peut pas être négatif."),
  vat_rate: z.coerce.number().min(0).max(100).default(0),
  modalities: required("Les modalités"),
  access_delay: required("Le délai d'accès"),
  pedagogical_means: required("Les moyens pédagogiques"),
  assessment_methods: required("Les modalités d'évaluation"),
  accessibility_info: required("Les informations d'accessibilité"),
  category: optionalString(),
  status: z.enum(["brouillon", "publiee", "archivee"]).default("brouillon"),
  is_certifying: z.coerce.boolean().default(false),
  certification_name: optionalString(),
  rncp_code: optionalString(),
});

export type TrainingInput = z.infer<typeof trainingSchema>;
