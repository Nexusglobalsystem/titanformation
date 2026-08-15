export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4 py-12">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-DEFAULT bg-primary font-display text-lg font-bold text-accent"
        >
          TK
        </span>
        <span className="font-display text-xl font-semibold text-foreground">Titan Kinetic</span>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
