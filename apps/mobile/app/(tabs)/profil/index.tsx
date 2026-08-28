import { ActivityIndicator, Text, View } from "react-native";
import { useRequireAuth } from "../../../src/hooks/useRequireAuth";
import { SignInPrompt } from "../../../src/components/SignInPrompt";
import { SubmitButton } from "../../../src/components/form/SubmitButton";
import { supabase } from "../../../src/lib/supabase";

// Onglet soft-gated (§3.6 du plan) : reste dans la barre d'onglets et
// affiche un message + lien de connexion plutôt qu'une redirection.
// Documents/Réclamations (menu, lots 5.x) viendront s'ajouter ici.
export default function ProfilScreen() {
  const { isAuthenticated, session, loading } = useRequireAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <SignInPrompt message="Connectez-vous pour accéder à votre profil." />;
  }

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background px-gutter">
      <Text className="font-display text-xl text-foreground">Profil</Text>
      <Text className="font-body text-foreground-muted">{session?.user.email}</Text>
      <Text className="font-body text-foreground-muted">
        Notifications, documents, réclamations — lots 5.x.
      </Text>
      <SubmitButton onPress={() => supabase.auth.signOut()}>Se déconnecter</SubmitButton>
    </View>
  );
}
