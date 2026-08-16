export function PublicFooter() {
  return (
    <footer className="mt-auto w-full border-t border-border bg-surface px-4 py-12 md:px-(--spacing-margin-desktop)">
      <div className="mx-auto flex max-w-(--spacing-container-max) flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <span className="font-display text-lg font-bold text-foreground">Titan Kinetic</span>
          <p className="font-body text-sm text-foreground-muted">
            Organisme de formation certifié Qualiopi.
          </p>
        </div>
      </div>
    </footer>
  );
}
