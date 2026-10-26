export function ChallengesPageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse p-4 sm:p-6 lg:p-8" aria-busy="true" aria-live="polite">
      <div className="rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/90 p-5 shadow-xl backdrop-blur-sm sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <div className="h-3 w-28 rounded bg-[var(--color-surface-soft)]" />
            <div className="h-9 w-48 rounded bg-[var(--color-surface-soft)]" />
            <div className="h-4 w-72 rounded bg-[var(--color-surface-soft)]" />
          </div>

          <div className="h-16 w-full rounded-xl bg-[var(--color-surface-soft)] sm:w-72" />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-7 w-20 rounded-full bg-[var(--color-surface-soft)]" />
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] p-4">
              <div className="h-3 w-24 rounded bg-[var(--color-dark)]/40" />
              <div className="mt-3 h-7 w-12 rounded bg-[var(--color-dark)]/40" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 space-y-8">
        {Array.from({ length: 2 }).map((_, sectionIndex) => (
          <ChallengeSectionSkeleton key={sectionIndex} />
        ))}
      </div>
    </div>
  );
}

function ChallengeSectionSkeleton() {
  return (
    <section>
      <div className="mb-4 h-5 w-40 rounded bg-[var(--color-surface-soft)]" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="aspect-square w-full rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] p-3"
          >
            <div className="h-4 w-14 rounded-full bg-[var(--color-dark)]/40" />
            <div className="mt-6 space-y-2">
              <div className="h-3 w-full rounded bg-[var(--color-dark)]/40" />
              <div className="h-3 w-3/4 rounded bg-[var(--color-dark)]/40" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
