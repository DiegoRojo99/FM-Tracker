export function SaveCardSkeleton() {
  return (
    <div
      className="animate-pulse overflow-hidden rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-dark)]"
      aria-hidden="true"
    >
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-6 w-16 rounded bg-[var(--color-surface-soft)]" />
          <div className="h-4 w-4 rounded bg-[var(--color-surface-soft)]" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 shrink-0 rounded bg-[var(--color-surface-soft)]" />
          <div className="space-y-2">
            <div className="h-4 w-28 rounded bg-[var(--color-surface-soft)]" />
            <div className="h-3 w-16 rounded bg-[var(--color-surface-soft)]" />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-[var(--color-surface-border)] px-4 py-2">
        <div className="h-3 w-28 rounded bg-[var(--color-surface-soft)]" />
        <div className="h-11 w-11 rounded-md bg-[var(--color-surface-soft)]" />
      </div>
    </div>
  );
}
