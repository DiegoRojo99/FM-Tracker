import { Settings } from 'lucide-react';
import ThemeSelector from '@/app/components/ThemeSelector';

export default function SettingsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-6">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
          <Settings className="h-4 w-4" />
          Preferences
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--color-foreground)]">Settings</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">Make FM Tracker feel right for you.</p>
      </header>
      <section aria-labelledby="appearance-heading" className="fm-panel p-5 sm:p-6">
        <h2 id="appearance-heading" className="mb-5 text-xl font-semibold text-[var(--color-foreground)]">Appearance</h2>
        <ThemeSelector />
      </section>
    </main>
  );
}
