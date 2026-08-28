import { useSession } from "./useSession";

// Utilisé par les écrans Accueil/Agenda/Profil (gardés individuellement,
// pas par redirection globale — cf. décision "tabs toujours montées" du
// plan) pour savoir s'ils doivent afficher leur contenu ou un message
// "Connectez-vous pour accéder à votre espace".
export function useRequireAuth() {
  const { session, roles, loading } = useSession();
  return { isAuthenticated: Boolean(session), session, roles, loading };
}
