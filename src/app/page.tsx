import Link from 'next/link';

export default function LandingPage() {
  const features = [
    {
      title: 'Save Tracker',
      desc: 'Log every club, season, and major result from your manager career.',
      available: true,
      icon: '📘',
    },
    {
      title: 'Trophy Checklist',
      desc: 'See your completed silverware and what is still missing from your cabinet.',
      available: true,
      icon: '🏆',
    },
    {
      title: 'Challenges',
      desc: 'Progress through iconic FM challenge paths and completion goals.',
      available: true,
      icon: '🎯',
    },
    {
      title: 'Achievements',
      desc: 'Unlock milestones like promotion runs, unbeaten streaks, and doubles.',
      available: false,
      icon: '⭐',
    },
    {
      title: 'Friend Leaderboard',
      desc: 'Compare progress and trophies with friends in your social circle.',
      available: false,
      icon: '👥',
    },
    {
      title: 'Career Archive',
      desc: 'Build your full timeline and revisit every era of your legacy.',
      available: false,
      icon: '🗂️',
    },
  ];

  return (
    <div className="min-h-screen text-[var(--color-foreground)] font-sans">
      <section className="relative overflow-hidden px-6 pb-18 pt-20 sm:pt-24">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[10%] top-[8%] h-44 w-44 rounded-full bg-[var(--color-accent)]/20 blur-3xl" />
          <div className="absolute right-[8%] top-[22%] h-56 w-56 rounded-full bg-[var(--color-highlight)]/20 blur-3xl" />
          <div className="absolute bottom-[-3rem] left-[30%] h-56 w-56 rounded-full bg-[var(--color-primary)]/25 blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-highlight)]">
              Your FM Career, Organized
            </p>
            <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
              Build a living record of every save, challenge, and trophy.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--text-muted)] sm:text-lg">
              FM Tracker keeps your Football Manager story in one place, from first promotion to continental glory.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/saves"
                className="rounded-xl bg-[var(--color-highlight)] px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#0a0f1e] shadow-[0_14px_34px_#e664ff55] transition hover:translate-y-[-2px]"
              >
                Open My Saves
              </Link>
              <a
                href="#features"
                className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Explore Features
              </a>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-highlight)]">At a Glance</p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <p className="text-2xl font-extrabold text-white">All Saves</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Your complete manager journey</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <p className="text-2xl font-extrabold text-white">Challenge Paths</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Track elite career objectives</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <p className="text-2xl font-extrabold text-white">Trophies</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Country by country checklist</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <p className="text-2xl font-extrabold text-white">Friends</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Compare and compete together</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 pb-20 pt-8 sm:pt-12">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <h2 className="text-3xl font-black text-white sm:text-4xl">Everything you need to track your legacy</h2>
          <p className="max-w-md text-sm text-[var(--text-muted)]">Designed for quick updates after every session and deeper reflection over full careers.</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ title, desc, available, icon }) => (
            <div key={title} className="group rounded-2xl border border-white/10 bg-[var(--color-surface)]/70 p-6 shadow-[0_8px_30px_#0000002b] transition hover:-translate-y-1 hover:border-[var(--color-highlight)]/45">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-2xl" aria-hidden>
                  {icon}
                </span>
                {!available && (
                  <span className="rounded-full border border-[#ff646466] bg-[#ff64641a] px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-[#ff9e9e]">
                    Coming Soon
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-3xl border border-white/10 bg-gradient-to-r from-[var(--color-primary)]/40 via-[var(--color-accent)]/25 to-[var(--color-primary)]/40 p-6 sm:p-8">
          <h3 className="text-2xl font-black text-white">Pick your story back up</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
            Your most-used side project deserves to feel premium again. This refresh is step one, and your existing features remain fully intact.
          </p>
          <Link
            href="/saves"
            className="mt-5 inline-block rounded-xl bg-white px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-[#0a0f1e] transition hover:opacity-90"
          >
            Continue To Saves
          </Link>
        </div>
      </section>
    </div>
  )
}
