import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="connexion" options={{ title: "Connexion" }} />
      <Stack.Screen name="inscription" options={{ title: "Inscription" }} />
      <Stack.Screen
        name="mot-de-passe-oublie"
        options={{ title: "Mot de passe oublié" }}
      />
      <Stack.Screen
        name="reinitialiser-mot-de-passe"
        options={{ title: "Réinitialiser le mot de passe" }}
      />
    </Stack>
  );
}
