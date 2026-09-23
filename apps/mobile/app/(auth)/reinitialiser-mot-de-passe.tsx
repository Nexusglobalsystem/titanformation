import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordInput } from "@titan-kinetic/core/schemas";
import { supabase } from "../../src/lib/supabase";
import { PasswordField } from "../../src/components/form/PasswordField";
import { SubmitButton } from "../../src/components/form/SubmitButton";
import { ErrorText } from "../../src/components/form/ErrorText";

// Atterrissage du deep link titankinetic://reinitialiser-mot-de-passe?code=...
// — routé automatiquement ici par Expo Router (le schéma app.json + le nom
// de fichier suffisent, pas d'écouteur Linking séparé nécessaire). Échange
// le "code" PKCE contre une session recovery (exchangeCodeForSession),
// symétrique du code_verifier stocké localement par resetPasswordForEmail
// au lot 1.3, puis équivalent RN de resetPasswordAction (web) une fois la
// session recovery active.
//
// Action manuelle requise côté utilisateur (hors de portée des outils
// disponibles ici) : ajouter titankinetic://reinitialiser-mot-de-passe à
// la liste blanche Auth → URL Configuration du dashboard Supabase — sans
// ça, Supabase refuse le redirectTo et l'email n'est pas émis avec ce lien.
export default function ReinitialiserMotDePasseScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const router = useRouter();
  const [exchangeState, setExchangeState] = useState<"pending" | "ready" | "error">(
    code ? "pending" : "ready",
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (!code) return;
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      setExchangeState(error ? "error" : "ready");
    });
  }, [code]);

  async function onSubmit(values: ResetPasswordInput) {
    setSubmitError(null);
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      setSubmitError("Impossible de mettre à jour le mot de passe : " + error.message);
      return;
    }
    router.replace("/(auth)/connexion");
  }

  if (exchangeState === "pending") {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (exchangeState === "error") {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background px-gutter">
        <Text className="text-center font-body text-error">
          Ce lien de réinitialisation n&apos;est plus valide. Demande un nouveau lien depuis l&apos;écran
          « Mot de passe oublié ».
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center gap-4 bg-background px-gutter">
      <Text className="font-display text-xl text-foreground">Réinitialiser le mot de passe</Text>
      {submitError && <ErrorText>{submitError}</ErrorText>}
      <PasswordField control={control} name="password" label="Nouveau mot de passe" />
      <PasswordField control={control} name="confirmPassword" label="Confirmer le mot de passe" />
      <SubmitButton onPress={handleSubmit(onSubmit)} loading={isSubmitting}>
        Mettre à jour le mot de passe
      </SubmitButton>
    </View>
  );
}
