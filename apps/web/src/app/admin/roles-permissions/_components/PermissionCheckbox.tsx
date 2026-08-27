"use client";

import { useTransition } from "react";
import { togglePermissionAction } from "../_actions/permissions";

export function PermissionCheckbox({
  role,
  permissionKey,
  checked,
  label,
}: {
  role: string;
  permissionKey: string;
  checked: boolean;
  label: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <input
      type="checkbox"
      defaultChecked={checked}
      disabled={isPending}
      aria-label={label}
      className="h-4 w-4 rounded border-border text-primary accent-primary disabled:opacity-50"
      onChange={(event) => {
        const formData = new FormData();
        formData.set("role", role);
        formData.set("key", permissionKey);
        formData.set("enabled", String(event.target.checked));
        startTransition(() => {
          togglePermissionAction(formData);
        });
      }}
    />
  );
}
