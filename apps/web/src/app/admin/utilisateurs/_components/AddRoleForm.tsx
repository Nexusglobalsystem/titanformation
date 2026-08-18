"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@titan-kinetic/ui";
import { grantRoleAction, type GrantRoleState } from "../_actions/roles";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  gestionnaire: "Gestionnaire",
  formateur: "Formateur",
  responsable_entreprise: "Responsable entreprise",
  apprenant: "Apprenant",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="ghost" size="sm" loading={pending}>
      Ajouter
    </Button>
  );
}

export function AddRoleForm({ userId, availableRoles }: { userId: string; availableRoles: string[] }) {
  const [state, formAction] = useActionState<GrantRoleState, FormData>(grantRoleAction, undefined);
  const [role, setRole] = useState("");

  if (availableRoles.length === 0) return null;

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="role" value={role} />
      <Select value={role} onValueChange={setRole}>
        <SelectTrigger className="h-8 w-44 text-xs">
          <SelectValue placeholder="+ Ajouter un rôle" />
        </SelectTrigger>
        <SelectContent>
          {availableRoles.map((r) => (
            <SelectItem key={r} value={r}>
              {ROLE_LABELS[r] ?? r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <SubmitButton />
      {state?.error && <p className="font-body text-xs text-error">{state.error}</p>}
    </form>
  );
}
