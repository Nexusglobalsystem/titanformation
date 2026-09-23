import type { ReactNode } from "react";
import { Text, View } from "react-native";

// Port RN de packages/ui/src/primitives/Badge.tsx — mêmes variantes,
// ajoutées à la demande (seules celles utilisées par les écrans mobiles
// portés jusqu'ici). `icon` distinct de `children` (RN n'accepte pas un
// composant SVG comme enfant direct d'un <Text>, contrairement au web).
const VARIANT_CLASSES: Record<string, string> = {
  featured: "bg-primary",
  neutral: "border border-border bg-surface",
  success: "bg-success-bg",
  warning: "bg-warning-bg",
  error: "bg-error-bg",
};

const VARIANT_TEXT_CLASSES: Record<string, string> = {
  featured: "text-accent",
  neutral: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  error: "text-error",
};

export function Badge({
  variant = "neutral",
  icon,
  children,
}: {
  variant?: keyof typeof VARIANT_CLASSES;
  icon?: ReactNode;
  children: string;
}) {
  return (
    <View className={["flex-row items-center gap-1 rounded-sm px-2 py-0.5", VARIANT_CLASSES[variant]].join(" ")}>
      {icon}
      <Text className={["font-body text-xs font-medium", VARIANT_TEXT_CLASSES[variant]].join(" ")}>
        {children}
      </Text>
    </View>
  );
}
