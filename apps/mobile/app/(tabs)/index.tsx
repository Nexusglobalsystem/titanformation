import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useAppTheme } from "../../src/theme/ThemeProvider";
import {
  IconBell,
  IconCalendar,
  IconCheckCircle,
  IconGraduationCap,
  IconShieldCheck,
} from "../../src/components/Icon";

// Vitrine des tokens/polices/icônes (lots 0.3-0.4) — classes NativeWind
// clair/sombre + accès JS brut via useAppTheme(). Sera remplacée par le
// vrai tableau de bord apprenant au lot 3.1.
export default function AccueilScreen() {
  const { theme, scheme, setScheme } = useAppTheme();

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background px-gutter">
      <Text className="font-display text-xl text-foreground">Accueil</Text>
      <Text className="font-body text-foreground-muted">Tableau de bord apprenant — lot 3.1.</Text>

      <View className="w-full gap-2 rounded-lg border border-border bg-surface p-4">
        <Text className="font-body text-accent-text">Texte en accent-text (nuance clair/sombre)</Text>
        <Text className="font-body text-success">Succès</Text>
        <Text className="font-body text-warning">Avertissement</Text>
        <Text className="font-body text-error">Erreur</Text>
        <Text className="font-mono-label text-xs uppercase tracking-wider text-foreground-muted">
          Thème JS actuel : {theme.scheme}
        </Text>
      </View>

      <View className="w-full flex-row items-center justify-around rounded-lg border border-border bg-surface p-4">
        <IconBell size={22} color={theme.colors.foreground} />
        <IconCalendar size={22} color={theme.colors.accent} />
        <IconCheckCircle size={22} color={theme.colors.success.fg} />
        <IconShieldCheck size={22} color={theme.colors.foreground} />
        <IconGraduationCap size={22} color={theme.colors.primary} />
      </View>

      <Pressable
        onPress={() => setScheme(scheme === "dark" ? "light" : "dark")}
        className="rounded-DEFAULT bg-primary px-4 py-2"
      >
        <Text className="font-display text-white">Basculer le thème ({scheme})</Text>
      </Pressable>

      <Link href="/(auth)/connexion">Se connecter</Link>
    </View>
  );
}
