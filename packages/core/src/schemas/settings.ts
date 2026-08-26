import { z } from "zod";

const optionalString = () =>
  z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.string().optional());

export const organizationSettingsSchema = z.object({
  legalName: optionalString(),
  legalForm: optionalString(),
  siret: optionalString(),
  shareCapital: optionalString(),
  addressLine1: optionalString(),
  addressLine2: optionalString(),
  postalCode: optionalString(),
  city: optionalString(),
  publicationDirector: optionalString(),
  contactEmail: optionalString(),
  contactPhone: optionalString(),
  withdrawalPeriodDays: z.coerce.number().int().min(0).default(14),
  paymentTerms: optionalString(),
  cancellationPolicy: optionalString(),
});

export type OrganizationSettingsInput = z.infer<typeof organizationSettingsSchema>;
