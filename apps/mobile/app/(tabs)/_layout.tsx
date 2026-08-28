import { Tabs } from "expo-router";

// Toujours montée, connecté ou non (le catalogue Formations est public) —
// Accueil/Agenda/Profil se gardent eux-mêmes au lot 1.1 (useRequireAuth).
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: "Accueil" }} />
      <Tabs.Screen name="formations" options={{ title: "Formations" }} />
      <Tabs.Screen name="agenda" options={{ title: "Agenda" }} />
      <Tabs.Screen name="profil" options={{ title: "Profil" }} />
    </Tabs>
  );
}
