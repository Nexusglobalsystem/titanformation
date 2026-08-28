import { Platform } from "react-native";
import { setupURLPolyfill } from "react-native-url-polyfill";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";

// Équivalent inliné de "react-native-url-polyfill/auto" : l'import de
// sous-chemin résout mal sous Metro ici (unstable_enablePackageExports,
// nécessaire pour @titan-kinetic/core, casse la résolution des sous-chemins
// de paquets tiers sans champ "exports" une fois qu'on descend d'un niveau
// de dossier) — le contenu réel d'auto.js est trivial, reproduit tel quel.
if (Platform.OS !== "web") {
  setupURLPolyfill();
}

// Garde de session/rôle (lot 1.1) viendra ici, avant le rendu de Stack.
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
