import { useState } from "react";
import { useRouter } from "expo-router";
import { ScrollView, Text } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema, type SignUpInput } from "@titan-kinetic/core/schemas";
import { supabase } from "../../src/lib/supabase";
import { TextField } from "../../src/components/form/TextField";
import { PasswordField } from "../../src/components/form/PasswordField";
import { SubmitButton } from "../../src/components/form/SubmitButton";
import { ErrorText } from "../../src/components/form/ErrorText";

// Équivalent RN de signUpAction (web) — emailRedirectTo pointe vers la
// page web /auth/confirm (pas de deep link personnalisé ici : une fois
// l'email confirmé, l'utilisateur revient simplement se connecter dans
// l'app, aucun transfert de session nécessaire — le deep link natif est
// réservé à la réinitialisation de mot de passe, lot 1.4).
export default function InscriptionScreen() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: SignUpInput) {
    setSubmitError(null);
    const webUrl = process.env.EXPO_PUBLIC_WEB_URL ?? "https://titan-kinetic.vercel.app";
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { first_name: values.firstName, last_name: values.lastName },
        emailRedirectTo: `${webUrl}/auth/confirm`,
      },
    });
    if (error) {
      setSubmitError("Impossible de créer le compte : " + error.message);
      return;
    }
    setSuccess("Compte créé. Vérifie ta boîte mail pour confirmer ton adresse avant de te connecter.");
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="justify-center gap-4 px-gutter py-8">
      <Text className="font-display text-xl text-foreground">Inscription</Text>
      {submitError && <ErrorText>{submitError}</ErrorText>}
      {success ? (
        <>
          <Text className="font-body text-foreground">{success}</Text>
          <SubmitButton onPress={() => router.replace("/(auth)/connexion")}>Se connecter</SubmitButton>
        </>
      ) : (
        <>
          <TextField control={control} name="firstName" label="Prénom" />
          <TextField control={control} name="lastName" label="Nom" />
          <TextField
            control={control}
            name="email"
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <PasswordField control={control} name="password" label="Mot de passe" />
          <PasswordField control={control} name="confirmPassword" label="Confirmer le mot de passe" />
          <SubmitButton onPress={handleSubmit(onSubmit)} loading={isSubmitting}>
            Créer mon compte
          </SubmitButton>
        </>
      )}
    </ScrollView>
  );
}
