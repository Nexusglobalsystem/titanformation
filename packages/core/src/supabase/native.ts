import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";

/**
 * Stockage de session minimal (évite une dépendance dure à
 * @react-native-async-storage/async-storage dans ce package partagé).
 * AsyncStorage y est déjà conforme sans adaptation.
 */
export interface NativeAuthStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

/**
 * Client Supabase pour React Native (Expo) : session persistée via
 * `storage` au lieu des cookies utilisés par supabase/client.ts (web).
 * `detectSessionInUrl` désactivé — RN n'a pas de barre d'adresse, la
 * réinitialisation de mot de passe passe par un écouteur de deep link
 * dédié côté app.
 */
export function createNativeClient(storage: NativeAuthStorage) {
  return createSupabaseClient<Database>(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    },
  );
}
