export function SaveDetailsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse p-4 sm:p-6 lg:p-8" aria-busy="true" aria-live="polite">
      <section className="relative overflow-hidden rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/92 p-5 shadow-2xl backdrop-blur-sm sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="h-3 w-28 rounded bg-[var(--color-surface-soft)]" />
            <div className="h-9 w-64 rounded bg-[var(--color-surface-soft)]" />
            <div className="h-4 w-48 rounded bg-[var(--color-surface-soft)]" />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <StatChipSkeleton key={index} />
            ))}
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6">
        <SectionSkeleton rows={3} />
        <SectionSkeleton rows={3} />
        <SectionSkeleton rows={2} />
        <SectionSkeleton rows={2} />
      </div>
    </div>
  );
}

function StatChipSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] p-3">
      <div className="h-3 w-14 rounded bg-[var(--color-dark)]/40" />
      <div className="mt-4 h-5 w-10 rounded bg-[var(--color-dark)]/40" />
    </div>
  );
}

function SectionSkeleton({ rows }: { rows: number }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/88 p-4 shadow-xl backdrop-blur-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-5 w-32 rounded bg-[var(--color-surface-soft)]" />
        <div className="h-9 w-24 rounded-xl bg-[var(--color-surface-soft)]" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="h-16 w-full rounded-xl bg-[var(--color-surface-soft)]" />
        ))}
      </div>
    </section>
  );
}
