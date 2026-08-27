"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Button } from "@titan-kinetic/ui";
import {
  acceptQuoteAction,
  rejectQuoteAction,
  generateInvoiceAction,
  markInvoicePaidAction,
  type DevisActionState,
} from "../_actions/devis";

function SubmitButton({ label, variant }: { label: string; variant: "primary" | "outline" | "destructive" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} loading={pending} className="whitespace-nowrap">
      {label}
    </Button>
  );
}

function ActionButton({
  action,
  orderId,
  label,
  variant = "primary",
}: {
  action: (state: DevisActionState, formData: FormData) => Promise<DevisActionState>;
  orderId: string;
  label: string;
  variant?: "primary" | "outline" | "destructive";
}) {
  const [state, formAction] = useActionState<DevisActionState, FormData>(action, undefined);
  return (
    <form action={formAction} className="inline-flex flex-col items-end gap-1">
      <input type="hidden" name="orderId" value={orderId} />
      <SubmitButton label={label} variant={variant} />
      {state?.error && (
        <p role="alert" className="max-w-48 text-right font-body text-xs text-error">
          {state.error}
        </p>
      )}
    </form>
  );
}

export function DevisRowActions({
  orderId,
  status,
  invoiceNumber,
}: {
  orderId: string;
  status: string;
  invoiceNumber: string | null;
}) {
  if (status === "devis") {
    return (
      <div className="flex items-center justify-end gap-2">
        <ActionButton action={acceptQuoteAction} orderId={orderId} label="Accepter" variant="primary" />
        <ActionButton action={rejectQuoteAction} orderId={orderId} label="Refuser" variant="destructive" />
      </div>
    );
  }

  if (status === "en_attente_paiement") {
    return <ActionButton action={generateInvoiceAction} orderId={orderId} label="Générer la facture" />;
  }

  if (status === "facturee") {
    return (
      <div className="flex items-center justify-end gap-2">
        <Link
          href={`/admin/devis/${orderId}/facture`}
          className="font-body text-sm text-accent-text hover:underline"
        >
          Voir la facture
        </Link>
        <ActionButton action={markInvoicePaidAction} orderId={orderId} label="Marquer payée" />
      </div>
    );
  }

  if (status === "payee") {
    return (
      <Link href={`/admin/devis/${orderId}/facture`} className="font-body text-sm text-accent-text hover:underline">
        Facture {invoiceNumber ?? ""}
      </Link>
    );
  }

  return null;
}
