"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button, Input } from "@titan-kinetic/ui";
import { addEmployeeAction, type EmployeeFormState } from "../_actions/employees";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" loading={pending}>
      Ajouter
    </Button>
  );
}

export function AddEmployeeForm() {
  const [state, formAction] = useActionState<EmployeeFormState, FormData>(addEmployeeAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            label="Email du salarié"
            name="email"
            type="email"
            placeholder="salarie@exemple.fr"
            required
          />
        </div>
        <SubmitButton />
      </div>
      <p className="font-body text-xs text-foreground-muted">
        Le salarié doit déjà avoir un compte Titan Kinetic (créé sur la page d&apos;inscription) —
        il est alors rattaché à votre entreprise.
      </p>
      {state?.error && (
        <p role="alert" className="rounded-DEFAULT bg-error-bg px-3 py-2 font-body text-sm text-error">
          {state.error}
        </p>
      )}
    </form>
  );
}
