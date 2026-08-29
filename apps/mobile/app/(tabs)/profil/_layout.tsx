import { Stack } from "expo-router";

export default function ProfilLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
      <Stack.Screen name="documents" options={{ title: "Mes documents" }} />
      <Stack.Screen name="reclamations" options={{ title: "Réclamations" }} />
    </Stack>
  );
}
