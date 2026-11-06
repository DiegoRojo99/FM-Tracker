export function SaveDetailsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse p-4 sm:p-6 lg:p-8" aria-busy="true" aria-live="polite">
      <section className="fm-panel p-4 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="h-3 w-28 rounded bg-[var(--color-surface-soft)]" />
            <div className="h-9 w-64 max-w-full rounded bg-[var(--color-surface-soft)]" />
            <div className="h-4 w-48 rounded bg-[var(--color-surface-soft)]" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <StatChipSkeleton key={index} />
            ))}
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-5">
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
    <div className="fm-inset p-3">
      <div className="h-3 w-14 rounded bg-[var(--color-dark)]/40" />
      <div className="mt-2 h-5 w-10 rounded bg-[var(--color-dark)]/40" />
    </div>
  );
}

function SectionSkeleton({ rows }: { rows: number }) {
  return (
    <section className="fm-panel p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-5 w-32 rounded bg-[var(--color-surface-soft)]" />
        <div className="h-11 w-24 rounded-md bg-[var(--color-surface-soft)]" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="h-16 w-full rounded-md bg-[var(--color-surface-soft)]" />
        ))}
      </div>
    </section>
  );
}
