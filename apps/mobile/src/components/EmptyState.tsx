import type { ReactNode } from "react";
import { Text, View } from "react-native";

// Port RN de packages/ui/src/primitives/EmptyState.tsx
export function EmptyState({
  icon,
  title,
  action,
}: {
  icon?: ReactNode;
  title: string;
  action?: ReactNode;
}) {
  return (
    <View className="items-center gap-3 rounded-DEFAULT border border-dashed border-border px-6 py-10">
      {icon && (
        <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-elevated">{icon}</View>
      )}
      <Text className="text-center font-body text-sm text-foreground-muted">{title}</Text>
      {action}
    </View>
  );
}
