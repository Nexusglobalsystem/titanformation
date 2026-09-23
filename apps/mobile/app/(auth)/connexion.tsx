import { useState } from "react";
import { Link, useRouter } from "expo-router";
import { Text, View } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema, type SignInInput } from "@titan-kinetic/core/schemas";
import { supabase } from "../../src/lib/supabase";
import { TextField } from "../../src/components/form/TextField";
import { PasswordField } from "../../src/components/form/PasswordField";
import { SubmitButton } from "../../src/components/form/SubmitButton";
import { ErrorText } from "../../src/components/form/ErrorText";

// Équivalent RN de apps/web/src/app/(auth)/_actions/auth.ts::signInAction —
// appel direct signInWithPassword (RN n'a pas de Server Actions), même
// schéma Zod. Le routage par rôle est géré par AppShell (app/_layout.tsx)
// qui réagit au changement de session : pas de redirection explicite ici
// selon le rôle, juste un retour à la coquille principale.
export default function ConnexionScreen() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: SignInInput) {
    setSubmitError(null);
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      setSubmitError("Email ou mot de passe incorrect.");
      return;
    }
    router.replace("/");
  }

  return (
    <View className="flex-1 justify-center gap-4 bg-background px-gutter">
      <Text className="font-display text-xl text-foreground">Connexion</Text>
      {submitError && <ErrorText>{submitError}</ErrorText>}
      <TextField
        control={control}
        name="email"
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <PasswordField control={control} name="password" label="Mot de passe" />
      <SubmitButton onPress={handleSubmit(onSubmit)} loading={isSubmitting}>
        Se connecter
      </SubmitButton>
      <Link href="/(auth)/inscription" className="font-body text-sm text-accent-text">
        Créer un compte
      </Link>
      <Link href="/(auth)/mot-de-passe-oublie" className="font-body text-sm text-accent-text">
        Mot de passe oublié
      </Link>
    </View>
  );
}
