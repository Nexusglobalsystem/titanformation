"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@titan-kinetic/ui";
import { enrollEmployeeAction, type EnrollEmployeeState } from "../../_actions/enrollEmployee";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" className="w-full" loading={pending}>
      Inscrire ce salarié
    </Button>
  );
}

export function EnrollEmployeeForm({
  sessionId,
  slug,
  employees,
}: {
  sessionId: string;
  slug: string;
  employees: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState<EnrollEmployeeState, FormData>(enrollEmployeeAction, undefined);
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");

  if (state?.success) {
    return (
      <p role="status" className="rounded-DEFAULT bg-success-bg px-3 py-2 font-body text-sm text-success">
        {state.success}
      </p>
    );
  }

  if (employees.length === 0) {
    return (
      <p className="font-body text-sm text-foreground-muted">
        Aucun salarié rattaché.{" "}
        <Link href="/entreprise/salaries" className="text-accent-text hover:underline">
          Ajoutez-en un
        </Link>
        .
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="slug" value={slug} />
      <div className="flex flex-col gap-1.5">
        <label className="font-body text-sm font-medium text-foreground">Salarié</label>
        <Select value={employeeId} onValueChange={setEmployeeId}>
          <SelectTrigger aria-label="Salarié">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {employees.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="employeeId" value={employeeId} />
      </div>
      {state?.error && (
        <p role="alert" className="rounded-DEFAULT bg-error-bg px-3 py-2 font-body text-sm text-error">
          {state.error}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
