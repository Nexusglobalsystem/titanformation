import { SignOutButton } from "./SignOutButton";

export function SpaceShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border px-8 py-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-DEFAULT bg-primary font-display text-sm font-bold text-accent"
          >
            TK
          </span>
          <span className="font-display text-lg font-semibold text-foreground">{title}</span>
        </div>
        <SignOutButton />
      </header>
      <main className="p-8">{children}</main>
    </div>
  );
}
