"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const TASK_STATUSES = ["todo", "in_progress", "blocked", "review", "completed", "cancelled"] as const;
const TASK_PRIORITIES = ["low", "normal", "high", "urgent"] as const;

export type TaskActionState = { error?: string } | undefined;

export async function createTaskAction(
  _prev: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const title = formData.get("title");
  const description = formData.get("description");
  const domain = formData.get("domain");
  const priority = formData.get("priority");
  const assignedTo = formData.get("assignedTo");
  const dueDate = formData.get("dueDate");

  if (typeof title !== "string" || !title.trim()) {
    return { error: "Le titre est requis." };
  }
  if (typeof priority !== "string" || !TASK_PRIORITIES.includes(priority as (typeof TASK_PRIORITIES)[number])) {
    return { error: "Priorité invalide." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée." };

  const { error } = await supabase.from("organization_tasks").insert({
    title: title.trim(),
    description: typeof description === "string" && description.trim() ? description.trim() : null,
    domain: typeof domain === "string" && domain ? domain : null,
    priority: priority as (typeof TASK_PRIORITIES)[number],
    created_by: user.id,
    assigned_to: typeof assignedTo === "string" && assignedTo ? assignedTo : null,
    due_date: typeof dueDate === "string" && dueDate ? dueDate : null,
  });

  if (error) {
    return { error: "Impossible de créer la tâche : " + error.message };
  }

  revalidatePath("/admin/taches");
}

export async function updateTaskStatusAction(formData: FormData) {
  const taskId = formData.get("taskId");
  const status = formData.get("status");
  const redirectTo = formData.get("redirectTo");

  if (
    typeof taskId !== "string" ||
    typeof status !== "string" ||
    !TASK_STATUSES.includes(status as (typeof TASK_STATUSES)[number])
  ) {
    return;
  }

  const supabase = await createClient();
  await supabase
    .from("organization_tasks")
    .update({ status: status as (typeof TASK_STATUSES)[number], updated_at: new Date().toISOString() })
    .eq("id", taskId);

  if (typeof redirectTo === "string") revalidatePath(redirectTo);
}

export async function addTaskCommentAction(formData: FormData) {
  const taskId = formData.get("taskId");
  const body = formData.get("body");
  const redirectTo = formData.get("redirectTo");

  if (typeof taskId !== "string" || typeof body !== "string" || !body.trim()) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("task_comments").insert({ task_id: taskId, author_id: user.id, body: body.trim() });

  if (typeof redirectTo === "string") revalidatePath(redirectTo);
}

export async function deleteTaskAction(formData: FormData) {
  const taskId = formData.get("taskId");
  if (typeof taskId !== "string") return;

  const supabase = await createClient();
  await supabase.from("organization_tasks").delete().eq("id", taskId);
  revalidatePath("/admin/taches");
}
