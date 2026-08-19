export function GridBackdrop({
  mask = "radial-gradient(ellipse 80% 60% at 30% 20%, black 40%, transparent 90%)",
}: {
  mask?: string;
}) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      />
      <div className="absolute -left-32 -top-32 h-[520px] w-[520px] rounded-full bg-primary/40 blur-[120px]" />
      <div className="absolute right-0 top-1/3 h-[420px] w-[420px] rounded-full bg-accent/10 blur-[130px]" />
    </div>
  );
}
