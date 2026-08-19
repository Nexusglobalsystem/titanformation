import { createClient } from "@/lib/supabase/server";
import { SpaceShell } from "@/components/SpaceShell";
import { Card, CardContent, CardHeader, CardTitle } from "@titan-kinetic/ui";
import { NewTaskForm } from "./_components/NewTaskForm";
import { TaskCard } from "@/app/_components/TaskCard";

export default async function AdminTasksPage() {
  const supabase = await createClient();

  const { data: staffAndTrainers } = await supabase
    .from("user_roles")
    .select("role, profiles!user_roles_user_id_fkey(id, first_name, last_name)")
    .in("role", ["admin", "gestionnaire", "formateur"]);

  const assignableUsers = Array.from(
    new Map(
      (staffAndTrainers ?? [])
        .filter((r) => r.profiles)
        .map((r) => [
          r.profiles!.id,
          { id: r.profiles!.id, label: `${r.profiles!.first_name ?? ""} ${r.profiles!.last_name ?? ""}`.trim() },
        ]),
    ).values(),
  );

  const { data: tasks } = await supabase
    .from("organization_tasks")
    .select(
      "id, title, description, domain, priority, status, due_date, assigned_to, profiles!organization_tasks_assigned_to_fkey(first_name, last_name)",
    )
    .order("created_at", { ascending: false });

  const { data: comments } = await supabase
    .from("task_comments")
    .select("id, task_id, body, created_at, profiles(first_name, last_name)")
    .order("created_at", { ascending: true });

  const commentsByTask = new Map<string, { id: string; body: string; created_at: string; author_name: string }[]>();
  for (const c of comments ?? []) {
    const author = c.profiles;
    const authorName = author ? `${author.first_name ?? ""} ${author.last_name ?? ""}`.trim() : "—";
    const list = commentsByTask.get(c.task_id) ?? [];
    list.push({ id: c.id, body: c.body, created_at: c.created_at, author_name: authorName });
    commentsByTask.set(c.task_id, list);
  }

  return (
    <SpaceShell title="Espace administration">
      <div className="flex flex-col gap-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Nouvelle tâche</CardTitle>
          </CardHeader>
          <CardContent>
            <NewTaskForm assignableUsers={assignableUsers} />
          </CardContent>
        </Card>

        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Toutes les tâches</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {!tasks || tasks.length === 0 ? (
              <p className="font-body text-sm text-foreground-muted">Aucune tâche pour le moment.</p>
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
                    redirectTo="/admin/taches"
                    canDelete
                  />
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </SpaceShell>
  );
}
