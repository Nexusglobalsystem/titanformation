import { Stack } from "expo-router";

// Pile poussée depuis le tableau de bord/agenda (pas un onglet) — même
// esprit que apps/web/.../apprenant/formations/[enrollmentId]/*.
export default function EnrollmentLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Programme" }} />
      <Stack.Screen name="lecons/[lessonId]" options={{ title: "Leçon" }} />
      <Stack.Screen name="quiz/[lessonId]" options={{ title: "Quiz" }} />
      <Stack.Screen name="certificat" options={{ title: "Certificat" }} />
      <Stack.Screen name="satisfaction" options={{ title: "Satisfaction" }} />
    </Stack>
  );
}
