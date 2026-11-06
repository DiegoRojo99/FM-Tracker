export function TrophiesPageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse p-4 sm:p-6 lg:p-8" aria-busy="true" aria-live="polite">
      <div className="space-y-5">
        <div className="fm-panel p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 space-y-3">
              <div className="h-3 w-32 rounded bg-[var(--color-surface-soft)]" />
              <div className="h-9 w-56 rounded bg-[var(--color-surface-soft)]" />
              <div className="h-4 w-72 max-w-full rounded bg-[var(--color-surface-soft)]" />
            </div>

            <div className="grid w-full shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[28rem]">
              <div className="h-16 rounded-xl bg-[var(--color-surface-soft)]" />
              <div className="h-16 rounded-xl bg-[var(--color-surface-soft)]" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="fm-inset p-3">
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
    <div className="fm-panel h-fit overflow-hidden p-3">
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
