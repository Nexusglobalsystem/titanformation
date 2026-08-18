import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SpaceShell } from "@/components/SpaceShell";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@titan-kinetic/ui";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/app/_actions/notifications";

export async function NotificationsPage({ title, basePath }: { title: string; basePath: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, body, link, read_at, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const unreadCount = notifications?.filter((n) => !n.read_at).length ?? 0;
  const currentPath = `${basePath}/notifications`;

  return (
    <SpaceShell title={title}>
      <Card className="max-w-2xl">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Notifications</CardTitle>
          {unreadCount > 0 && (
            <form action={markAllNotificationsReadAction}>
              <input type="hidden" name="redirectTo" value={currentPath} />
              <Button type="submit" variant="ghost" size="sm">
                Tout marquer comme lu
              </Button>
            </form>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!notifications || notifications.length === 0 ? (
            <p className="font-body text-sm text-foreground-muted">Aucune notification pour le moment.</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`flex flex-col gap-2 rounded-DEFAULT border p-4 sm:flex-row sm:items-start sm:justify-between ${
                  n.read_at ? "border-border" : "border-primary bg-surface-elevated"
                }`}
              >
                <div className="flex flex-col gap-1">
                  <p className="font-body text-sm font-semibold text-foreground">{n.title}</p>
                  {n.body && <p className="font-body text-sm text-foreground-muted">{n.body}</p>}
                  <p className="font-body text-xs text-foreground-muted">
                    {new Date(n.created_at).toLocaleString("fr-FR")}
                  </p>
                  {n.link && (
                    <Link href={n.link} className="font-body text-xs text-primary underline">
                      Consulter
                    </Link>
                  )}
                </div>
                {!n.read_at && (
                  <form action={markNotificationReadAction}>
                    <input type="hidden" name="id" value={n.id} />
                    <input type="hidden" name="redirectTo" value={currentPath} />
                    <Button type="submit" variant="outline" size="sm">
                      Marquer comme lu
                    </Button>
                  </form>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </SpaceShell>
  );
}
