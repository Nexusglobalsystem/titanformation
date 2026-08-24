export function PageLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-24 animate-pulse rounded-xl bg-surface-elevated" />
      <div className="h-48 animate-pulse rounded-xl bg-surface-elevated" />
      <div className="h-48 animate-pulse rounded-xl bg-surface-elevated" />
    </div>
  );
}
