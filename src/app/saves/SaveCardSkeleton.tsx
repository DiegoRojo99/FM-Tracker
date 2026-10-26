export function SaveCardSkeleton() {
  return (
    <div
      className="animate-pulse overflow-hidden rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/90 p-4 shadow-lg backdrop-blur-sm"
      aria-hidden="true"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="space-y-2">
          <div className="h-3.5 w-16 rounded bg-[var(--color-surface-soft)]" />
          <div className="h-2.5 w-20 rounded bg-[var(--color-surface-soft)]" />
        </div>
        <div className="h-10 w-10 rounded-lg bg-[var(--color-surface-soft)]" />
      </div>

      <div className="flex min-h-[150px] flex-col items-center justify-center gap-3 pb-6">
        <div className="h-20 w-20 rounded-full bg-[var(--color-surface-soft)]" />
        <div className="h-4 w-28 rounded bg-[var(--color-surface-soft)]" />
      </div>
    </div>
  );
}
