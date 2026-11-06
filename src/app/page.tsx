import Link from 'next/link';
import { Archive, Save, Star, Target, Trophy, Users } from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      title: 'Save Tracker',
      desc: 'Log every club, season, and major result from your manager career.',
      available: true,
      icon: Save,
    },
    {
      title: 'Trophy Checklist',
      desc: 'See your completed silverware and what is still missing from your cabinet.',
      available: true,
      icon: Trophy,
    },
    {
      title: 'Challenges',
      desc: 'Progress through iconic FM challenge paths and completion goals.',
      available: true,
      icon: Target,
    },
    {
      title: 'Achievements',
      desc: 'Unlock milestones like promotion runs, unbeaten streaks, and doubles.',
      available: true,
      icon: Star,
    },
    {
      title: 'Friend Leaderboard',
      desc: 'Compare progress and trophies with friends in your social circle.',
      available: false,
      icon: Users,
    },
    {
      title: 'Career Archive',
      desc: 'Build your full timeline and revisit every era of your legacy.',
      available: false,
      icon: Archive,
    },
  ];

  return (
    <div className="min-h-screen text-[var(--color-foreground)] font-sans">
      <section className="relative border-b border-[var(--color-surface-border)] px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
              Your FM Career, Organized
            </p>
            <h1 className="text-3xl font-bold leading-tight text-[var(--color-foreground)] sm:text-4xl lg:text-5xl">
              Build a living record of every save, challenge, and trophy.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--text-muted)] sm:text-lg">
              FM Tracker keeps your Football Manager story in one place, from first promotion to continental glory.
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
              Track FM27 alongside your older careers. Start with a men&apos;s or women&apos;s club, or begin unemployed.
              Choose the matching game version when creating each save.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/saves"
                className="fm-action"
              >
                Open My Saves
              </Link>
              <a
                href="#features"
                className="fm-secondary"
              >
                Explore Features
              </a>
            </div>
          </div>

          <div className="fm-panel relative overflow-hidden p-5 sm:p-6">
            <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-linear-to-r/srgb from-[var(--color-highlight)] to-[var(--color-highlight-violet)]" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">At a Glance</p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="fm-inset p-4">
                <p className="text-lg font-semibold text-[var(--color-foreground)]">All Saves</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Your complete manager journey</p>
              </div>
              <div className="fm-inset p-4">
                <p className="text-lg font-semibold text-[var(--color-foreground)]">Challenge Paths</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Track elite career objectives</p>
              </div>
              <div className="fm-inset p-4">
                <p className="text-lg font-semibold text-[var(--color-foreground)]">Trophies</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Country by country checklist</p>
              </div>
              <div className="fm-inset p-4">
                <p className="text-lg font-semibold text-[var(--color-foreground)]">Friends</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Compare and compete together</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <h2 className="text-2xl font-semibold text-[var(--color-foreground)] sm:text-3xl">Everything you need to track your legacy</h2>
          <p className="max-w-md text-sm text-[var(--text-muted)]">Designed for quick updates after every session and deeper reflection over full careers.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ title, desc, available, icon: Icon }) => (
            <div key={title} className="fm-panel p-5">
              <div className="mb-4 flex items-center justify-between">
                <Icon className="h-6 w-6 text-[var(--color-accent)]" aria-hidden="true" />
                {!available && (
                  <span className="rounded-md border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Coming Soon
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{desc}</p>
            </div>
          ))}
        </div>

        <div className="fm-panel mt-8 p-5 sm:p-6">
          <h3 className="text-2xl font-semibold text-[var(--color-foreground)]">Pick your story back up</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
            Keep your career history close while you play. Return to your saves to record the next season, trophy, or milestone.
          </p>
          <Link
            href="/saves"
            className="fm-action mt-5"
          >
            Continue To Saves
          </Link>
        </div>
      </section>
    </div>
  )
}
