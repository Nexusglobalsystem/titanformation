import { ActivityIndicator, Pressable, Text } from "react-native";
import { useAppTheme } from "../../theme/ThemeProvider";

// Port RN de la variante "primary" de packages/ui/src/primitives/Button.tsx
// (taille "md" par défaut) — pas de portage des autres variantes/tailles
// tant qu'aucun écran ne les demande.
export function SubmitButton({
  onPress,
  loading,
  disabled,
  children,
}: {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  children: string;
}) {
  const { theme } = useAppTheme();
  const isDisabled = Boolean(disabled) || Boolean(loading);

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      className={["h-10 flex-row items-center justify-center gap-2 rounded bg-primary px-4", isDisabled ? "opacity-50" : ""].join(
        " ",
      )}
    >
      {loading && <ActivityIndicator size="small" color={theme.colors.onPrimary} />}
      <Text className="font-body text-sm font-medium text-on-primary">{children}</Text>
    </Pressable>
  );
}
