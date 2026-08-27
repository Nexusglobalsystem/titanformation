"use client";

import { Button } from "./Button";

export function PrintButton({ label = "Imprimer / Enregistrer en PDF" }: { label?: string }) {
  return (
    <Button variant="primary" onClick={() => window.print()}>
      {label}
    </Button>
  );
}
