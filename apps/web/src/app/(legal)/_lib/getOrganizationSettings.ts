import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@titan-kinetic/core/database.types";

export async function getOrganizationSettings(): Promise<Tables<"organization_settings"> | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("organization_settings").select("*").eq("id", 1).maybeSingle();
  return data;
}

export function hasAnyLegalInfo(settings: Tables<"organization_settings"> | null): boolean {
  if (!settings) return false;
  return Boolean(
    settings.legal_name ||
      settings.legal_form ||
      settings.siret ||
      settings.address_line1 ||
      settings.city ||
      settings.contact_email ||
      settings.contact_phone,
  );
}
