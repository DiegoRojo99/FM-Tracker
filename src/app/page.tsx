export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] font-sans">

      {/* Hero */}
      <section className="text-center px-6 py-20 bg-gradient-to-b from-[var(--primary)] to-[var(--accent)] text-white">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">Track Your Football Manager Legacy</h2>
        <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">Log your saves, earn achievements, complete challenges, and build your career history — all in one place.</p>
        <a
          href="saves"
          className="inline-block bg-[var(--highlight)] text-white px-6 py-3 rounded-lg font-semibold shadow hover:opacity-90 transition"
        >
          Get Started
        </a>
      </section>

      {/* Features */}
      <section id="features" className="py-16 px-6 max-w-6xl mx-auto">
        <h3 className="text-3xl font-bold text-center mb-12">Features</h3>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: 'Save Tracker',
              desc: 'Log each club and season you manage, with trophies.',
              available: true,
            },
            {
              title: 'Trophy Checklist',
              desc: 'See which trophies you’ve won and which are still pending.',
              available: true,
            },
            {
              title: 'Challenges',
              desc: 'Take on legendary FM challenges like the Pentagon or Youth Only.',
              available: true,
            },
            {
              title: 'Achievements',
              desc: 'Unlock milestones like unbeaten runs, treble wins, and promotions.',
              available: false,
            },
            // {
            //   title: 'Completeness Map',
            //   desc: 'Track countries and competitions you’ve conquered.',
            //   available: true,
            // },
            {
              title: 'Friend Leaderboard',
              desc: 'Compete with friends to see who can achieve the most in FM.',
              available: false,
            },
            // {
            //   title: 'Stats Dashboard',
            //   desc: 'Visualize your total matches, goals, and club history over time.',
            //   available: false,
            // },
            {
              title: 'Career Archive',
              desc: 'Build a timeline of your entire Football Manager journey.',
              available: false,
            },
          ].map(({ title, desc, available }) => (
            <div key={title} className="bg-[var(--surface)] rounded-xl p-6 shadow hover:shadow-md transition">
              <h4 className="text-xl font-semibold mb-2">{title}</h4>
              <p className="text-[var(--text-muted)]">{desc}</p>
              {!available && (
                <p className="text-red-500 mt-2">Coming Soon!</p>
              )}
            </div>
          ))}
        </div>
      </section>
      
    </div>
  )
}
