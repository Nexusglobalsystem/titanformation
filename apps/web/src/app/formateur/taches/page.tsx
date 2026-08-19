import { createClient } from "@/lib/supabase/server";
import { SpaceShell } from "@/components/SpaceShell";
import { Card, CardContent, CardHeader, CardTitle } from "@titan-kinetic/ui";
import { TaskCard } from "@/app/_components/TaskCard";

export default async function FormateurTasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tasks } = await supabase
    .from("organization_tasks")
    .select(
      "id, title, description, domain, priority, status, due_date, assigned_to, profiles!organization_tasks_assigned_to_fkey(first_name, last_name)",
    )
    .order("created_at", { ascending: false });

  const taskIds = (tasks ?? []).map((t) => t.id);
  const { data: comments } =
    taskIds.length > 0
      ? await supabase
          .from("task_comments")
          .select("id, task_id, body, created_at, profiles(first_name, last_name)")
          .in("task_id", taskIds)
          .order("created_at", { ascending: true })
      : { data: [] };

  const commentsByTask = new Map<string, { id: string; body: string; created_at: string; author_name: string }[]>();
  for (const c of comments ?? []) {
    const author = c.profiles;
    const authorName = author ? `${author.first_name ?? ""} ${author.last_name ?? ""}`.trim() : "—";
    const list = commentsByTask.get(c.task_id) ?? [];
    list.push({ id: c.id, body: c.body, created_at: c.created_at, author_name: authorName });
    commentsByTask.set(c.task_id, list);
  }

  return (
    <SpaceShell title="Espace formateur">
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Mes tâches</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!tasks || tasks.length === 0 ? (
            <p className="font-body text-sm text-foreground-muted">Aucune tâche assignée pour le moment.</p>
          ) : (
            tasks.map((t) => {
              const assignee = t.profiles;
              return (
                <TaskCard
                  key={t.id}
                  id={t.id}
                  title={t.title}
                  description={t.description}
                  domain={t.domain}
                  priority={t.priority}
                  status={t.status}
                  assigneeName={assignee ? `${assignee.first_name ?? ""} ${assignee.last_name ?? ""}`.trim() : null}
                  dueDate={t.due_date}
                  comments={commentsByTask.get(t.id) ?? []}
                  redirectTo="/formateur/taches"
                  canDelete={false}
                />
              );
            })
          )}
        </CardContent>
      </Card>
    </SpaceShell>
  );
}
