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
} from "@titan-kinetic/ui";
import { createAccessGrantAction, type AccessGrantFormState } from "../_actions/accessGrants";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="sm" loading={pending}>
      Accorder l&apos;accès
    </Button>
  );
}

export function GrantAccessForm({
  users,
  companies,
  programmes,
  trainings,
  modules,
  sessions,
}: {
  users: { id: string; name: string }[];
  companies: { id: string; name: string }[];
  programmes: { id: string; title: string }[];
  trainings: { id: string; title: string }[];
  modules: { id: string; label: string }[];
  sessions: { id: string; label: string }[];
}) {
  const [state, formAction] = useActionState<AccessGrantFormState, FormData>(createAccessGrantAction, undefined);
  const [targetType, setTargetType] = useState<"user" | "company">("user");
  const [targetId, setTargetId] = useState("");
  const [scopeType, setScopeType] = useState<"programme" | "training" | "module" | "session">("training");
  const [scopeId, setScopeId] = useState("");

  const targetOptions = targetType === "user" ? users.map((u) => ({ id: u.id, label: u.name })) : companies.map((c) => ({ id: c.id, label: c.name }));
  const scopeOptions =
    scopeType === "programme"
      ? programmes.map((p) => ({ id: p.id, label: p.title }))
      : scopeType === "training"
        ? trainings.map((t) => ({ id: t.id, label: t.title }))
        : scopeType === "module"
          ? modules.map((m) => ({ id: m.id, label: m.label }))
          : sessions.map((s) => ({ id: s.id, label: s.label }));

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />
      <input type="hidden" name="scopeType" value={scopeType} />
      <input type="hidden" name="scopeId" value={scopeId} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="font-body text-sm font-medium text-foreground">Qui</label>
          <div className="flex gap-4">
            {(["user", "company"] as const).map((t) => (
              <label key={t} className="flex items-center gap-1.5 font-body text-sm text-foreground">
                <input
                  type="radio"
                  checked={targetType === t}
                  onChange={() => {
                    setTargetType(t);
                    setTargetId("");
                  }}
                  className="h-3.5 w-3.5 accent-accent"
                />
                {t === "user" ? "Utilisateur" : "Entreprise"}
              </label>
            ))}
          </div>
          <Select value={targetId} onValueChange={setTargetId}>
            <SelectTrigger className="h-9 text-sm" aria-label={targetType === "user" ? "Choisir un utilisateur" : "Choisir une entreprise"}>
              <SelectValue placeholder={targetType === "user" ? "Choisir un utilisateur" : "Choisir une entreprise"} />
            </SelectTrigger>
            <SelectContent>
              {targetOptions.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-body text-sm font-medium text-foreground">Accès à</label>
          <Select
            value={scopeType}
            onValueChange={(v) => {
              setScopeType(v as typeof scopeType);
              setScopeId("");
            }}
          >
            <SelectTrigger className="h-9 text-sm" aria-label="Accès à">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="programme">Programme</SelectItem>
              <SelectItem value="training">Formation</SelectItem>
              <SelectItem value="module">Module</SelectItem>
              <SelectItem value="session">Session</SelectItem>
            </SelectContent>
          </Select>
          <Select value={scopeId} onValueChange={setScopeId}>
            <SelectTrigger className="h-9 text-sm" aria-label="Élément concerné">
              <SelectValue placeholder="Choisir…" />
            </SelectTrigger>
            <SelectContent>
              {scopeOptions.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input label="Expire le (facultatif)" name="expires_at" type="date" className="h-9 text-sm" />
        <Input label="Note (facultative)" name="note" className="h-9 text-sm" />
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
