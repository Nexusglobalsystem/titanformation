import "../global.css";
import { useEffect } from "react";
import { Platform } from "react-native";
import { setupURLPolyfill } from "react-native-url-polyfill";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { ThemeProvider } from "../src/theme/ThemeProvider";
import { useAppFonts } from "../src/theme/fonts";
import { QueryClientProvider } from "../src/lib/queryClient";
import { SessionProvider, useSession } from "../src/hooks/useSession";
import { UnsupportedRoleScreen } from "../src/components/UnsupportedRoleScreen";

// Équivalent inliné de "react-native-url-polyfill/auto" : l'import de
// sous-chemin résout mal sous Metro ici (unstable_enablePackageExports,
// nécessaire pour @titan-kinetic/core, casse la résolution des sous-chemins
// de paquets tiers sans champ "exports" une fois qu'on descend d'un niveau
// de dossier) — le contenu réel d'auto.js est trivial, reproduit tel quel.
if (Platform.OS !== "web") {
  setupURLPolyfill();
}

SplashScreen.preventAutoHideAsync();

// Garde de rôle : (tabs)/(auth) restent la coquille normale pour "pas de
// session" (catalogue public) et "session + rôle apprenant" — seul un
// utilisateur connecté SANS le rôle apprenant sort de cette coquille
// (espace entreprise/admin/formateur, pas construits sur mobile v1).
function AppShell() {
  const { session, roles, loading } = useSession();

  if (loading) {
    return null;
  }

  if (session && roles.length > 0 && !roles.includes("apprenant")) {
    return <UnsupportedRoleScreen roles={roles} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useAppFonts();

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider>
          <SessionProvider>
            <ThemeProvider>
              <AppShell />
            </ThemeProvider>
          </SessionProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
