"use client";

import { Button } from "@titan-kinetic/ui";

export function PrintCertificateButton() {
  return (
    <Button variant="primary" onClick={() => window.print()}>
      Imprimer / Enregistrer en PDF
    </Button>
  );
}
