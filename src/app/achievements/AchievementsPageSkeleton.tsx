export function AchievementsPageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse p-4 sm:p-6 lg:p-8" aria-busy="true" aria-live="polite">
      <div className="rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/90 p-5 shadow-xl backdrop-blur-sm sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <div className="h-3 w-32 rounded bg-[var(--color-surface-soft)]" />
            <div className="h-9 w-56 rounded bg-[var(--color-surface-soft)]" />
            <div className="h-4 w-80 rounded bg-[var(--color-surface-soft)]" />
          </div>

          <div className="h-10 w-full rounded-xl bg-[var(--color-surface-soft)] sm:w-48" />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] p-4">
              <div className="h-3 w-16 rounded bg-[var(--color-dark)]/40" />
              <div className="mt-3 h-6 w-14 rounded bg-[var(--color-dark)]/40" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 space-y-8">
        {Array.from({ length: 3 }).map((_, sectionIndex) => (
          <AchievementCategorySkeleton key={sectionIndex} />
        ))}
      </div>
    </div>
  );
}

function AchievementCategorySkeleton() {
  return (
    <section className="rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/90 p-5 shadow-lg backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-5 w-40 rounded bg-[var(--color-surface-soft)]" />
        <div className="h-3 w-24 rounded bg-[var(--color-surface-soft)]" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <AchievementCardSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}

function AchievementCardSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)]/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="w-full space-y-2">
          <div className="h-4 w-2/3 rounded bg-[var(--color-dark)]/40" />
          <div className="h-3 w-full rounded bg-[var(--color-dark)]/40" />
        </div>
        <div className="h-5 w-16 shrink-0 rounded-full bg-[var(--color-dark)]/40" />
      </div>

      <div className="mt-4">
        <div className="h-2 w-full rounded-full bg-[var(--color-darker)]" />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="h-4 w-14 rounded bg-[var(--color-dark)]/40" />
        <div className="h-4 w-20 rounded bg-[var(--color-dark)]/40" />
      </div>
    </div>
  );
}
