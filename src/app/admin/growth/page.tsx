'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/components/AuthProvider';
import FootballLoader from '@/app/components/FootBallLoader';
import { Activity, TrendingUp, Users } from 'lucide-react';

type GrowthStats = {
  windowDays: number;
  generatedAt: string;
  topOfFunnel: {
    landingVisitors: number;
    loginOrAddSaveVisitors: number;
    signups: number;
    landingToLoginRate: number | null;
    loginToSignupRate: number | null;
  };
  activation: {
    totalSignups: number;
    signupsWithFirstSave: number;
    activationRate: number | null;
  };
  retention: {
    wau: number;
    mau: number;
    d7EligibleCohortSize: number;
    d7RetainedCount: number;
    d7RetentionRate: number | null;
  };
  perFeature: Array<{ event: string; totalEvents: number; distinctUsers: number }>;
};

function formatRate(rate: number | null): string {
  return rate === null ? 'n/a' : `${rate}%`;
}

export default function AdminGrowthPage() {
  const { user, userLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<GrowthStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const adminUID = process.env.NEXT_PUBLIC_ADMIN_UID;
    if (userLoading) return;
    if (!user || user.uid !== adminUID) router.replace('/');
  }, [user, userLoading, router]);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/growth', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      setStats(await res.json());
    }
    catch {
      setError('Unable to load growth stats.');
    }
    finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!userLoading && user) fetchStats();
  }, [user, userLoading, fetchStats]);

  const cardClass = 'rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/90 p-5 shadow-xl';
  const numClass = 'text-3xl font-black text-white';
  const labelClass = 'mt-1 text-sm text-[var(--color-text-muted)]';

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/90 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-highlight)]">
            <Activity className="h-3.5 w-3.5" />
            Growth & Engagement
          </p>
          <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">Funnel & Retention</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Computed from the first-party AnalyticsEvent table (Vercel&apos;s Hobby plan doesn&apos;t visualize custom events).
            Two separate funnels, matching the Growth & Engagement Roadmap: top-of-funnel (anonymous) and post-signup (per-user).
          </p>
        </div>

        {loading && !stats ? (
          <FootballLoader />
        ) : error ? (
          <div className="text-center text-[var(--color-text-muted)]">{error}</div>
        ) : stats ? (
          <div className="space-y-8">
            <section>
              <h2 className="mb-3 text-lg font-bold text-white">Top-of-Funnel (last {stats.windowDays} days, anonymous)</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className={cardClass}>
                  <div className={numClass}>{stats.topOfFunnel.landingVisitors.toLocaleString()}</div>
                  <div className={labelClass}>Landing page (&quot;/&quot;) visitors</div>
                </div>
                <div className={cardClass}>
                  <div className={numClass}>{stats.topOfFunnel.loginOrAddSaveVisitors.toLocaleString()}</div>
                  <div className={labelClass}>Reached /login or /add-save ({formatRate(stats.topOfFunnel.landingToLoginRate)} of landing)</div>
                </div>
                <div className={cardClass}>
                  <div className={numClass}>{stats.topOfFunnel.signups.toLocaleString()}</div>
                  <div className={labelClass}>Signups completed ({formatRate(stats.topOfFunnel.loginToSignupRate)} of login/add-save viewers)</div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-white">Post-Signup Activation (last {stats.windowDays} days, per-user)</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className={cardClass}>
                  <div className={numClass}>{stats.activation.totalSignups.toLocaleString()}</div>
                  <div className={labelClass}>Total signups</div>
                </div>
                <div className={cardClass}>
                  <div className={numClass}>{stats.activation.signupsWithFirstSave.toLocaleString()}</div>
                  <div className={labelClass}>Created at least one save</div>
                </div>
                <div className={cardClass}>
                  <div className={numClass}>{formatRate(stats.activation.activationRate)}</div>
                  <div className={labelClass}>Activation rate (signup &rarr; first save)</div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-white">
                <Users className="h-4 w-4" /> Active Users & Retention
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className={cardClass}>
                  <div className={numClass}>{stats.retention.wau.toLocaleString()}</div>
                  <div className={labelClass}>Weekly active users</div>
                </div>
                <div className={cardClass}>
                  <div className={numClass}>{stats.retention.mau.toLocaleString()}</div>
                  <div className={labelClass}>Monthly active users</div>
                </div>
                <div className={cardClass}>
                  <div className={numClass}>{formatRate(stats.retention.d7RetentionRate)}</div>
                  <div className={labelClass}>D7 retention</div>
                </div>
                <div className={cardClass}>
                  <div className={numClass}>{stats.retention.d7RetainedCount} / {stats.retention.d7EligibleCohortSize}</div>
                  <div className={labelClass}>Retained / eligible cohort</div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-white">
                <TrendingUp className="h-4 w-4" /> Per-Feature Engagement (last {stats.windowDays} days)
              </h2>
              <div className="overflow-hidden rounded-2xl border border-[var(--color-surface-border)]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--color-surface-soft)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                    <tr>
                      <th className="px-4 py-3">Event</th>
                      <th className="px-4 py-3">Total Events</th>
                      <th className="px-4 py-3">Distinct Users</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.perFeature.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-6 text-center text-[var(--color-text-muted)]">No events recorded yet.</td>
                      </tr>
                    ) : (
                      stats.perFeature.map((row) => (
                        <tr key={row.event} className="border-t border-[var(--color-surface-border)]">
                          <td className="px-4 py-3 text-white">{row.event}</td>
                          <td className="px-4 py-3 text-[var(--color-text-muted)]">{row.totalEvents.toLocaleString()}</td>
                          <td className="px-4 py-3 text-[var(--color-text-muted)]">{row.distinctUsers.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <p className="text-xs text-[var(--color-text-muted)]">Last updated: {new Date(stats.generatedAt).toLocaleString()}</p>
          </div>
        ) : (
          <div className="text-center text-[var(--color-text-muted)]">Unable to load growth stats at this time.</div>
        )}
      </div>
    </div>
  );
}
