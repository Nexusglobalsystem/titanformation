import { useState } from "react";
import { Link } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema, type SignInInput } from "@titan-kinetic/core/schemas";
import { useAppTheme } from "../../src/theme/ThemeProvider";
import {
  IconBell,
  IconCalendar,
  IconCheckCircle,
  IconGraduationCap,
  IconShieldCheck,
} from "../../src/components/Icon";
import { TextField } from "../../src/components/form/TextField";
import { PasswordField } from "../../src/components/form/PasswordField";
import { SubmitButton } from "../../src/components/form/SubmitButton";
import { ErrorText } from "../../src/components/form/ErrorText";

// Vitrine des tokens/polices/icônes/formulaire (lots 0.3-0.5) — classes
// NativeWind clair/sombre, useAppTheme(), et un formulaire jetable câblé
// sur le vrai schéma Zod signInSchema (@titan-kinetic/core) pour vérifier
// TextField/PasswordField/SubmitButton/ErrorText bout en bout avant que
// le lot 1.2 construise le véritable écran de connexion. Sera remplacé
// par le vrai tableau de bord apprenant au lot 3.1.
export default function AccueilScreen() {
  const { theme, scheme, setScheme } = useAppTheme();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { control, handleSubmit } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: SignInInput) {
    setSubmitError(`Validé : ${values.email} — la vraie soumission arrive au lot 1.2.`);
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="items-center gap-4 px-gutter py-8">
      <Text className="font-display text-xl text-foreground">Accueil</Text>
      <Text className="font-body text-foreground-muted">Tableau de bord apprenant — lot 3.1.</Text>

      <View className="w-full gap-2 rounded-lg border border-border bg-surface p-4">
        <Text className="font-body text-accent-text">Texte en accent-text (nuance clair/sombre)</Text>
        <Text className="font-body text-success">Succès</Text>
        <Text className="font-body text-warning">Avertissement</Text>
        <Text className="font-body text-error">Erreur</Text>
        <Text className="font-mono-label text-xs uppercase tracking-wider text-foreground-muted">
          Thème JS actuel : {theme.scheme}
        </Text>
      </View>

      <View className="w-full flex-row items-center justify-around rounded-lg border border-border bg-surface p-4">
        <IconBell size={22} color={theme.colors.foreground} />
        <IconCalendar size={22} color={theme.colors.accent} />
        <IconCheckCircle size={22} color={theme.colors.success.fg} />
        <IconShieldCheck size={22} color={theme.colors.foreground} />
        <IconGraduationCap size={22} color={theme.colors.primary} />
      </View>

      <View className="w-full gap-3 rounded-lg border border-border bg-surface p-4">
        <Text className="font-display text-sm text-foreground">Formulaire jetable (lot 0.5)</Text>
        {submitError && <ErrorText>{submitError}</ErrorText>}
        <TextField
          control={control}
          name="email"
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <PasswordField control={control} name="password" label="Mot de passe" />
        <SubmitButton onPress={handleSubmit(onSubmit)}>Valider</SubmitButton>
      </View>

      <Pressable
        onPress={() => setScheme(scheme === "dark" ? "light" : "dark")}
        className="rounded-DEFAULT bg-primary px-4 py-2"
      >
        <Text className="font-display text-on-primary">Basculer le thème ({scheme})</Text>
      </Pressable>

      <Link href="/(auth)/connexion">Se connecter</Link>
    </ScrollView>
  );
}
