import { Link } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useRequireAuth } from "../../../src/hooks/useRequireAuth";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "../../../src/features/notifications/useNotifications";
import { SubmitButton } from "../../../src/components/form/SubmitButton";

export default function NotificationsScreen() {
  const { session } = useRequireAuth();
  const userId = session?.user.id;
  const { data: notifications, isLoading } = useNotifications(userId);
  const markRead = useMarkNotificationRead(userId);
  const markAllRead = useMarkAllNotificationsRead(userId);

  const unreadCount = notifications?.filter((n) => !n.read_at).length ?? 0;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 px-gutter py-6">
      {unreadCount > 0 && (
        <SubmitButton onPress={() => markAllRead.mutate()} loading={markAllRead.isPending}>
          Tout marquer comme lu
        </SubmitButton>
      )}

      {!notifications || notifications.length === 0 ? (
        <Text className="font-body text-sm text-foreground-muted">Aucune notification pour le moment.</Text>
      ) : (
        notifications.map((n) => (
          <View
            key={n.id}
            className={[
              "gap-2 rounded-DEFAULT border p-4",
              n.read_at ? "border-border" : "border-primary bg-surface-elevated",
            ].join(" ")}
          >
            <Text className="font-body text-sm font-semibold text-foreground">{n.title}</Text>
            {n.body && <Text className="font-body text-sm text-foreground-muted">{n.body}</Text>}
            <Text className="font-body text-xs text-foreground-muted">
              {new Date(n.created_at).toLocaleString("fr-FR")}
            </Text>
            {n.link && (
              <Link href={n.link} className="font-body text-xs text-primary">
                Consulter
              </Link>
            )}
            {!n.read_at && (
              <SubmitButton onPress={() => markRead.mutate(n.id)} loading={markRead.isPending}>
                Marquer comme lu
              </SubmitButton>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}
