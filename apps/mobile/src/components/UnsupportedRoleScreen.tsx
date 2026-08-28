import { Linking, Text, View } from "react-native";
import { homePathForRoles, type AppRole } from "@titan-kinetic/core";
import { SubmitButton } from "./form/SubmitButton";
import { supabase } from "../lib/supabase";

// Affiché à la place de la coquille (tabs)/(auth) quand un utilisateur
// connecté n'a QUE des rôles non pris en charge sur mobile (entreprise,
// admin, formateur — v1 mobile = apprenant uniquement, cf. plan). Jamais
// un no-op silencieux ni une redirection vers un espace qui n'existe pas.
export function UnsupportedRoleScreen({ roles }: { roles: AppRole[] }) {
  const webUrl = process.env.EXPO_PUBLIC_WEB_URL ?? "https://titan-kinetic.vercel.app";

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background px-gutter">
      <Text className="text-center font-display text-lg text-foreground">
        Cet espace n&apos;est pas encore disponible sur mobile
      </Text>
      <Text className="text-center font-body text-foreground-muted">
        L&apos;application mobile couvre pour l&apos;instant l&apos;espace apprenant. Continuez sur le
        site web pour accéder à votre espace.
      </Text>
      <SubmitButton onPress={() => Linking.openURL(`${webUrl}${homePathForRoles(roles)}`)}>
        Continuer sur le web
      </SubmitButton>
      <SubmitButton onPress={() => supabase.auth.signOut()}>Se déconnecter</SubmitButton>
    </View>
  );
}
