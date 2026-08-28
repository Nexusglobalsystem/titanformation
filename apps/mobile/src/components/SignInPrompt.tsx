import { Link } from "expo-router";
import { Text, View } from "react-native";

// Partagé par les onglets soft-gated (Accueil lot 3.1, Agenda lot 4.1,
// Profil ci-dessous) — décision du plan : rester dans la barre d'onglets
// plutôt qu'une redirection globale qui en sortirait l'utilisateur.
export function SignInPrompt({ message }: { message: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background px-gutter">
      <Text className="text-center font-body text-foreground-muted">{message}</Text>
      <Link href="/(auth)/connexion" className="font-body text-accent-text">
        Se connecter
      </Link>
    </View>
  );
}
