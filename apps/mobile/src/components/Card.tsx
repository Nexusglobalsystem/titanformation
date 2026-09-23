import type { ReactNode } from "react";
import { View } from "react-native";

// Port RN minimal de packages/ui/src/primitives/Card.tsx — juste le
// conteneur + un padding par défaut, pas de Header/Title/Footer distincts
// (aucun écran mobile porté jusqu'ici n'en a besoin).
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <View className={["rounded-lg border border-border bg-surface-elevated p-6", className].join(" ")}>
      {children}
    </View>
  );
}
