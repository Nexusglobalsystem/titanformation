"use client";

import { useState, useTransition } from "react";
import { Badge, Button, Textarea } from "@titan-kinetic/ui";
import { addTaskCommentAction, deleteTaskAction, updateTaskStatusAction } from "@/app/_actions/tasks";

const STATUS_LABELS: Record<string, string> = {
  todo: "À faire",
  in_progress: "En cours",
  blocked: "Bloquée",
  review: "En relecture",
  completed: "Terminée",
  cancelled: "Annulée",
};

const STATUS_VARIANTS: Record<string, "neutral" | "success" | "warning" | "error"> = {
  todo: "neutral",
  in_progress: "warning",
  blocked: "error",
  review: "warning",
  completed: "success",
  cancelled: "neutral",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Basse",
  normal: "Normale",
  high: "Haute",
  urgent: "Urgente",
};

const PRIORITY_VARIANTS: Record<string, "neutral" | "success" | "warning" | "error"> = {
  low: "neutral",
  normal: "neutral",
  high: "warning",
  urgent: "error",
};

const STATUSES = ["todo", "in_progress", "blocked", "review", "completed", "cancelled"];

export type TaskComment = { id: string; body: string; created_at: string; author_name: string };

export function TaskCard({
  id,
  title,
  description,
  domain,
  priority,
  status,
  assigneeName,
  dueDate,
  comments,
  redirectTo,
  canDelete,
}: {
  id: string;
  title: string;
  description: string | null;
  domain: string | null;
  priority: string;
  status: string;
  assigneeName: string | null;
  dueDate: string | null;
  comments: TaskComment[];
  redirectTo: string;
  canDelete: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [showComments, setShowComments] = useState(false);
  const [commentBody, setCommentBody] = useState("");

  return (
    <div className="flex flex-col gap-3 rounded-DEFAULT border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-body text-sm font-semibold text-foreground">{title}</p>
          {description && <p className="font-body text-sm text-foreground-muted">{description}</p>}
          <p className="font-body text-xs text-foreground-muted">
            {domain ?? "—"} · Responsable : {assigneeName ?? "non assigné"}
            {dueDate ? ` · Échéance : ${new Date(dueDate + "T00:00:00").toLocaleDateString("fr-FR")}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={PRIORITY_VARIANTS[priority] ?? "neutral"}>{PRIORITY_LABELS[priority] ?? priority}</Badge>
          <Badge variant={STATUS_VARIANTS[status] ?? "neutral"}>{STATUS_LABELS[status] ?? status}</Badge>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          defaultValue={status}
          disabled={isPending}
          aria-label={`Statut de la tâche ${title}`}
          className="h-8 rounded-DEFAULT border border-border bg-surface px-2 font-body text-xs text-foreground disabled:opacity-50"
          onChange={(event) => {
            const formData = new FormData();
            formData.set("taskId", id);
            formData.set("status", event.target.value);
            formData.set("redirectTo", redirectTo);
            startTransition(() => {
              updateTaskStatusAction(formData);
            });
          }}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        <Button type="button" variant="ghost" size="sm" onClick={() => setShowComments((v) => !v)}>
          Commentaires ({comments.length})
        </Button>

        {canDelete && (
          <form action={deleteTaskAction}>
            <input type="hidden" name="taskId" value={id} />
            <Button type="submit" variant="ghost" size="sm">
              Supprimer
            </Button>
          </form>
        )}
      </div>

      {showComments && (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          {comments.length === 0 ? (
            <p className="font-body text-xs text-foreground-muted">Aucun commentaire.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="rounded-DEFAULT bg-surface-elevated p-2">
                <p className="font-body text-xs font-semibold text-foreground">
                  {c.author_name} <span className="font-normal text-foreground-muted">· {new Date(c.created_at).toLocaleString("fr-FR")}</span>
                </p>
                <p className="font-body text-sm text-foreground">{c.body}</p>
              </div>
            ))
          )}
          <form
            action={(formData) => {
              startTransition(() => {
                addTaskCommentAction(formData);
                setCommentBody("");
              });
            }}
            className="flex flex-col gap-2"
          >
            <input type="hidden" name="taskId" value={id} />
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <Textarea
              name="body"
              rows={2}
              placeholder="Ajouter un commentaire..."
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
            />
            <div>
              <Button type="submit" variant="outline" size="sm" disabled={!commentBody.trim()}>
                Envoyer
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
