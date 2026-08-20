import { z } from "zod";

const required = (label: string) => z.string({ required_error: `${label} est requis.` }).min(1, `${label} est requis.`);

const optionalString = () =>
  z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.string().optional());

export const programmeSchema = z.object({
  slug: required("Le slug")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Le slug ne doit contenir que des minuscules, chiffres et tirets."),
  title: required("Le titre"),
  summary: optionalString(),
  status: z.enum(["brouillon", "publiee", "archivee"]).default("brouillon"),
});

export type ProgrammeInput = z.infer<typeof programmeSchema>;
