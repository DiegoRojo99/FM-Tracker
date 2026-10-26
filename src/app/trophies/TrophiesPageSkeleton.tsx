export function TrophiesPageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse p-4 sm:p-6 lg:p-8" aria-busy="true" aria-live="polite">
      <div className="space-y-6">
        <div className="rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/90 p-5 shadow-xl backdrop-blur-sm sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between md:mb-4">
            <div className="space-y-3">
              <div className="h-3 w-32 rounded bg-[var(--color-surface-soft)]" />
              <div className="h-9 w-56 rounded bg-[var(--color-surface-soft)]" />
              <div className="h-4 w-72 rounded bg-[var(--color-surface-soft)]" />
            </div>

            <div className="grid w-full grid-cols-1 gap-3 sm:w-[28rem] sm:grid-cols-2">
              <div className="h-16 rounded-xl bg-[var(--color-surface-soft)]" />
              <div className="h-16 rounded-xl bg-[var(--color-surface-soft)]" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] p-4">
                <div className="h-3 w-20 rounded bg-[var(--color-dark)]/40" />
                <div className="mt-3 h-7 w-12 rounded bg-[var(--color-dark)]/40" />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <TrophyCountryCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TrophyCountryCardSkeleton() {
  return (
    <div className="h-fit overflow-hidden rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/88 p-4 shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-8 w-8 rounded bg-[var(--color-surface-soft)]" />
          <div className="space-y-2">
            <div className="h-4 w-28 rounded bg-[var(--color-surface-soft)]" />
            <div className="h-3 w-20 rounded bg-[var(--color-surface-soft)]" />
          </div>
        </div>
        <div className="h-7 w-12 rounded-full bg-[var(--color-surface-soft)]" />
      </div>
    </div>
  );
}
