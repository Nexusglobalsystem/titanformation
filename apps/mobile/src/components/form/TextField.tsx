import { Text, TextInput, View, type TextInputProps } from "react-native";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { useAppTheme } from "../../theme/ThemeProvider";

// Port RN de packages/ui/src/primitives/Input.tsx — même convention
// visuelle (label au-dessus, bordure rouge + message sous le champ en cas
// d'erreur), câblé sur react-hook-form via Controller au lieu d'un
// <input>/register natif (RN n'a ni l'un ni l'autre).
export function TextField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  hint,
  endAdornment,
  ...inputProps
}: {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label?: string;
  hint?: string;
  endAdornment?: React.ReactNode;
} & Omit<TextInputProps, "value" | "onChangeText" | "onBlur">) {
  const { theme } = useAppTheme();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View className="gap-1.5">
          {label && <Text className="font-body text-sm font-medium text-foreground">{label}</Text>}
          <View className="relative justify-center">
            <TextInput
              value={typeof value === "string" ? value : ""}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholderTextColor={theme.colors.foregroundMuted}
              className={[
                "h-10 w-full rounded border bg-surface px-3 font-body text-sm text-foreground",
                error ? "border-error" : "border-border",
                endAdornment ? "pr-10" : "",
              ].join(" ")}
              {...inputProps}
            />
            {endAdornment && <View className="absolute right-1">{endAdornment}</View>}
          </View>
          {hint && !error && <Text className="font-body text-xs text-foreground-muted">{hint}</Text>}
          {error?.message && (
            <Text role="alert" className="font-body text-xs text-error">
              {error.message}
            </Text>
          )}
        </View>
      )}
    />
  );
}
