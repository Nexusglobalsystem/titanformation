import { Stack } from "expo-router";

export default function AgendaLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="reserver" options={{ title: "Réserver un rendez-vous" }} />
    </Stack>
  );
}
