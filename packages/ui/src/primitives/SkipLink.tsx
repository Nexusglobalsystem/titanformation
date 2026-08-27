export function SkipLink({ targetId = "main-content" }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:font-body focus:text-sm focus:font-medium focus:text-on-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      Aller au contenu principal
    </a>
  );
}
