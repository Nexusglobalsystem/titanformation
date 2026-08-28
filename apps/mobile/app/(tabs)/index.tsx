import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useAppTheme } from "../../src/theme/ThemeProvider";

// Vitrine des tokens (lot 0.3) — classes NativeWind clair/sombre + accès
// JS brut via useAppTheme(). Sera remplacée par le vrai tableau de bord
// apprenant au lot 3.1.
export default function AccueilScreen() {
  const { theme, scheme, setScheme } = useAppTheme();

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background px-gutter">
      <Text className="font-semibold text-xl text-foreground">Accueil</Text>
      <Text className="text-foreground-muted">Tableau de bord apprenant — lot 3.1.</Text>

      <View className="w-full gap-2 rounded-lg border border-border bg-surface p-4">
        <Text className="text-accent-text">Texte en accent-text (nuance clair/sombre)</Text>
        <Text className="text-success">Succès</Text>
        <Text className="text-warning">Avertissement</Text>
        <Text className="text-error">Erreur</Text>
        <Text className="text-foreground-muted">Thème JS actuel : {theme.scheme}</Text>
      </View>

      <Pressable
        onPress={() => setScheme(scheme === "dark" ? "light" : "dark")}
        className="rounded-DEFAULT bg-primary px-4 py-2"
      >
        <Text className="font-semibold text-white">Basculer le thème ({scheme})</Text>
      </Pressable>

      <Link href="/(auth)/connexion">Se connecter</Link>
    </View>
  );
}
