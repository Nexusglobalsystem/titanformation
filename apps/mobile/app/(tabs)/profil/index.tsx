import type { ReactNode } from "react";
import { Link } from "expo-router";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useRequireAuth } from "../../../src/hooks/useRequireAuth";
import { SignInPrompt } from "../../../src/components/SignInPrompt";
import { useNotifications } from "../../../src/features/notifications/useNotifications";
import { useAppTheme } from "../../../src/theme/ThemeProvider";
import { Badge } from "../../../src/components/Badge";
import { SubmitButton } from "../../../src/components/form/SubmitButton";
import { supabase } from "../../../src/lib/supabase";
import { IconAlertTriangle, IconBell, IconFileText } from "../../../src/components/Icon";

// Onglet soft-gated (§3.6 du plan) : reste dans la barre d'onglets et
// affiche un message + lien de connexion plutôt qu'une redirection.
// Notifications/Documents/Réclamations en menu ici plutôt qu'une cloche
// persistante dans un en-tête partagé (simplification volontaire de ce
// lot par rapport au plan initial — upgrade possible dans un futur lot
// de polish si souhaité).
export default function ProfilScreen() {
  const { theme } = useAppTheme();
  const { isAuthenticated, session, loading } = useRequireAuth();
  const { data: notifications } = useNotifications(session?.user.id);
  const unreadCount = notifications?.filter((n) => !n.read_at).length ?? 0;

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <SignInPrompt message="Connectez-vous pour accéder à votre profil." />;
  }

  return (
    <View className="flex-1 gap-6 bg-background px-gutter py-6">
      <View>
        <Text className="font-display text-xl font-bold text-foreground">Profil</Text>
        <Text className="mt-1 font-body text-sm text-foreground-muted">{session?.user.email}</Text>
      </View>

      <View className="overflow-hidden rounded-lg border border-border bg-surface-elevated">
        <MenuItem
          href="/(tabs)/profil/notifications"
          icon={<IconBell size={20} color={theme.colors.foreground} />}
          label="Notifications"
          badge={unreadCount > 0 ? unreadCount : undefined}
        />
        <MenuItem
          href="/(tabs)/profil/documents"
          icon={<IconFileText size={20} color={theme.colors.foreground} />}
          label="Mes documents"
        />
        <MenuItem
          href="/(tabs)/profil/reclamations"
          icon={<IconAlertTriangle size={20} color={theme.colors.foreground} />}
          label="Réclamations"
          last
        />
      </View>

      <SubmitButton onPress={() => supabase.auth.signOut()}>Se déconnecter</SubmitButton>
    </View>
  );
}

function MenuItem({
  href,
  icon,
  label,
  badge,
  last,
}: {
  href: "/(tabs)/profil/notifications" | "/(tabs)/profil/documents" | "/(tabs)/profil/reclamations";
  icon: ReactNode;
  label: string;
  badge?: number;
  last?: boolean;
}) {
  return (
    <Link href={href} asChild>
      <Pressable
        className={["flex-row items-center gap-3 p-4", last ? "" : "border-b border-border"].join(" ")}
      >
        {icon}
        <Text className="flex-1 font-body text-sm text-foreground">{label}</Text>
        {badge !== undefined && <Badge variant="warning">{String(badge)}</Badge>}
      </Pressable>
    </Link>
  );
}
