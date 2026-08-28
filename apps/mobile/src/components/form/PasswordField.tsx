import { useState } from "react";
import { Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import type { TextInputProps } from "react-native";
import { useAppTheme } from "../../theme/ThemeProvider";
import { TextField } from "./TextField";

// Port RN de packages/ui/src/primitives/PasswordInput.tsx — mêmes icônes
// œil/œil barré (locales à ce fichier côté web aussi, pas dans le
// catalogue partagé icons.tsx), même bascule visible/masqué.
export function PasswordField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  hint,
  ...inputProps
}: {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label?: string;
  hint?: string;
} & Omit<TextInputProps, "value" | "onChangeText" | "onBlur" | "secureTextEntry">) {
  const { theme } = useAppTheme();
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      control={control}
      name={name}
      label={label}
      hint={hint}
      secureTextEntry={!visible}
      endAdornment={
        <Pressable
          onPress={() => setVisible((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          className="h-8 w-8 items-center justify-center"
        >
          <MaterialCommunityIcons
            name={visible ? "eye-off-outline" : "eye-outline"}
            size={18}
            color={theme.colors.foregroundMuted}
          />
        </Pressable>
      }
      {...inputProps}
    />
  );
}
