import { Text } from "react-native";

// Erreur de soumission globale (ex. "Email ou mot de passe incorrect"),
// distincte des erreurs par champ déjà gérées dans TextField.
export function ErrorText({ children }: { children: string }) {
  return (
    <Text role="alert" className="rounded border border-error bg-error-bg px-3 py-2 font-body text-sm text-error">
      {children}
    </Text>
  );
}
