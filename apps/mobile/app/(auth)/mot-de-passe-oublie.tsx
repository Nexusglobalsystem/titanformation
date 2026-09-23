import { useState } from "react";
import { Text, View } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Linking from "expo-linking";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@titan-kinetic/core/schemas";
import { supabase } from "../../src/lib/supabase";
import { TextField } from "../../src/components/form/TextField";
import { SubmitButton } from "../../src/components/form/SubmitButton";

// Équivalent RN de forgotPasswordAction — redirectTo pointe vers le deep
// link natif (titankinetic://reinitialiser-mot-de-passe), câblé côté
// Supabase Dashboard (Auth → URL Configuration) au lot 1.4. Même réponse
// que l'email existe ou non, anti-énumération de comptes (comme web).
export default function MotDePasseOublieScreen() {
  const [success, setSuccess] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: Linking.createURL("reinitialiser-mot-de-passe"),
    });
    setSuccess(true);
  }

  return (
    <View className="flex-1 justify-center gap-4 bg-background px-gutter">
      <Text className="font-display text-xl text-foreground">Mot de passe oublié</Text>
      {success ? (
        <Text className="font-body text-foreground">
          Si un compte existe avec cette adresse, un email de réinitialisation vient d&apos;être
          envoyé.
        </Text>
      ) : (
        <>
          <TextField
            control={control}
            name="email"
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <SubmitButton onPress={handleSubmit(onSubmit)} loading={isSubmitting}>
            Envoyer le lien de réinitialisation
          </SubmitButton>
        </>
      )}
    </View>
  );
}
