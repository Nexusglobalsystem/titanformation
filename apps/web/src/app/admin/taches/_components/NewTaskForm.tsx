"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@titan-kinetic/ui";
import { createTaskAction, type TaskActionState } from "@/app/_actions/tasks";

const DOMAINS = ["Pédagogie", "Agenda", "Formations", "Utilisateurs", "Support", "Autre"];

const PRIORITY_LABELS: Record<string, string> = {
  low: "Basse",
  normal: "Normale",
  high: "Haute",
  urgent: "Urgente",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="sm" loading={pending}>
      Créer la tâche
    </Button>
  );
}

export function NewTaskForm({
  assignableUsers,
}: {
  assignableUsers: { id: string; label: string }[];
}) {
  const [state, formAction] = useActionState<TaskActionState, FormData>(createTaskAction, undefined);
  const [domain, setDomain] = useState("Pédagogie");
  const [priority, setPriority] = useState("normal");
  const [assignedTo, setAssignedTo] = useState("");

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="domain" value={domain} />
      <input type="hidden" name="priority" value={priority} />
      <input type="hidden" name="assignedTo" value={assignedTo} />

      <Input label="Titre" name="title" required placeholder="Ex. Planifier les cours du Bootcamp IA" />
      <Textarea label="Description" name="description" rows={2} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="font-body text-sm font-medium text-foreground">Domaine</label>
          <Select value={domain} onValueChange={setDomain}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOMAINS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-body text-sm font-medium text-foreground">Priorité</label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-body text-sm font-medium text-foreground">Responsable</label>
          <Select value={assignedTo} onValueChange={setAssignedTo}>
            <SelectTrigger>
              <SelectValue placeholder="Non assignée" />
            </SelectTrigger>
            <SelectContent>
              {assignableUsers.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Input label="Échéance" name="dueDate" type="date" />
      </div>

      {state?.error && (
        <p role="alert" className="font-body text-xs text-error">
          {state.error}
        </p>
      )}
      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
