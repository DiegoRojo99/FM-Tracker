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
              desc: 'Log each club and season you manage, with full stats and trophies.',
            },
            {
              title: 'Achievements',
              desc: 'Unlock milestones like unbeaten runs, treble wins, and promotions.',
            },
            {
              title: 'Completeness Map',
              desc: 'Track countries and continents you’ve conquered.',
            },
            {
              title: 'Challenges',
              desc: 'Take on legendary FM challenges like the Pentagon or Youth Only.',
            },
            {
              title: 'Stats Dashboard',
              desc: 'Visualize your total matches, goals, and club history over time.',
            },
            {
              title: 'Career Archive',
              desc: 'Build a timeline of your entire Football Manager journey.',
            },
          ].map(({ title, desc }) => (
            <div key={title} className="bg-[var(--surface)] rounded-xl p-6 shadow hover:shadow-md transition">
              <h4 className="text-xl font-semibold mb-2">{title}</h4>
              <p className="text-[var(--text-muted)]">{desc}</p>
            </div>
          ))}
        </div>
      </section>
      
    </div>
  )
}
