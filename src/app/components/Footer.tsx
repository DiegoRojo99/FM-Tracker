export default function Footer(){
  return (
    <footer className="border-t border-[var(--color-surface-border)] bg-[var(--color-background)]/84 py-8 text-sm text-[var(--text-muted)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:px-6 lg:flex-row lg:px-8">
        <p>&copy; {new Date().getFullYear()} FM Tracker. Built for Football Manager fans.</p>
        <div className="flex items-center gap-4 text-xs uppercase tracking-widest text-[var(--text-muted)]/80">
          <span>Track</span>
          <span>Compete</span>
          <span>Legacy</span>
        </div>
      </div>
    </footer>
  )
};