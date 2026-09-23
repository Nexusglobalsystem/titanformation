import { Text, View } from "react-native";

// Port RN de packages/ui/src/primitives/Progress.tsx
export function Progress({ value, max = 100, label }: { value: number; max?: number; label?: string }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <View className="gap-1.5">
      {label && (
        <View className="flex-row items-center justify-between">
          <Text className="font-body text-xs text-foreground-muted">{label}</Text>
          <Text className="font-mono-label text-xs text-foreground-muted">{Math.round(pct)}%</Text>
        </View>
      )}
      <View className="h-2 w-full overflow-hidden rounded-full bg-zebra">
        <View className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </View>
    </View>
  );
}
