"use client";

import { Button } from "@titan-kinetic/ui";
import { signOutAction } from "../app/(auth)/_actions/auth";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="outline" size="sm">
        Déconnexion
      </Button>
    </form>
  );
}
