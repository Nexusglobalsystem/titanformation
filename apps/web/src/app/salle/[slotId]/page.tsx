import Link from "next/link";
import { SalleClient } from "./_components/SalleClient";

export const metadata = { title: "Classe virtuelle — Titan Kinetic" };

export default async function SallePage({
  params,
}: {
  params: Promise<{ slotId: string }>;
}) {
  const { slotId } = await params;

  return (
    <div data-theme="dark" className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <Link href="/" className="font-display text-sm font-bold tracking-tight text-accent">
          Titan Kinetic
        </Link>
        <span className="font-mono-label text-xs uppercase tracking-widest text-foreground-muted">
          Classe virtuelle
        </span>
      </header>
      <SalleClient slotId={slotId} />
    </div>
  );
}
