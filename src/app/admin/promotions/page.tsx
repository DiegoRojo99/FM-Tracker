'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/app/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { RefreshCw, TrendingUp } from 'lucide-react';

type PromotionRow = {
  leagueResultId: number;
  seasonId: number;
  position: number;
  team: string;
  competition: string;
  competitionTier: number | null;
  countryCode: string;
  saveId: string;
  userId: string;
};

export default function AdminPromotionsPage() {
  const { user, userLoading } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<PromotionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterUserId, setFilterUserId] = useState('');

  useEffect(() => {
    const adminUID = process.env.NEXT_PUBLIC_ADMIN_UID;
    if (userLoading) return;
    if (!user || user.uid !== adminUID) router.replace('/');
  }, [user, userLoading, router]);

  const fetchRows = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams();
      if (filterUserId) params.set('userId', filterUserId);
      const res = await fetch(`/api/admin/promotions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRows(await res.json());
    } finally {
      setLoading(false);
    }
  }, [user, filterUserId]);

  useEffect(() => {
    if (!userLoading && user) fetchRows();
  }, [user, userLoading, fetchRows]);

  // Group by userId → saveId
  const grouped = rows.reduce<Record<string, Record<string, PromotionRow[]>>>((acc, row) => {
    if (!acc[row.userId]) acc[row.userId] = {};
    if (!acc[row.userId][row.saveId]) acc[row.userId][row.saveId] = [];
    acc[row.userId][row.saveId].push(row);
    return acc;
  }, {});

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/90 p-6 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-highlight)]">Admin</p>
              <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">Promotions</h1>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                All seasons with <code className="rounded bg-white/10 px-1">promoted = true</code> across all users.
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-[var(--color-highlight)]" />
          </div>

          <div className="mt-4 flex gap-3">
            <input
              value={filterUserId}
              onChange={e => setFilterUserId(e.target.value)}
              placeholder="Filter by user ID…"
              className="flex-1 rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-3 py-2 text-sm text-white placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
            />
            <button
              onClick={fetchRows}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] px-3 py-2 text-xs font-semibold text-white transition hover:border-[var(--color-highlight)] disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            Total: <span className="font-bold text-white">{rows.length}</span> promoted season{rows.length !== 1 ? 's' : ''}
          </p>
        </div>

        {Object.entries(grouped).map(([userId, saves]) => (
          <div key={userId} className="rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/90 shadow-2xl backdrop-blur-sm overflow-hidden">
            <div className="border-b border-[var(--color-surface-border)] bg-black/20 px-5 py-3">
              <p className="text-xs font-mono text-[var(--color-text-muted)]">user: {userId}</p>
            </div>

            {Object.entries(saves).map(([saveId, entries]) => (
              <div key={saveId}>
                <div className="flex items-center justify-between border-b border-[var(--color-surface-border)]/50 bg-white/2 px-5 py-2">
                  <p className="text-xs font-mono text-[var(--color-text-muted)]">save: {saveId}</p>
                  <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-xs font-bold text-sky-400">
                    {entries.length} promotion{entries.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-surface-border)]/40 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                      <th className="px-5 py-2">Team</th>
                      <th className="px-5 py-2">Competition</th>
                      <th className="px-5 py-2">Tier</th>
                      <th className="px-5 py-2">Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map(e => (
                      <tr key={e.leagueResultId} className="border-b border-[var(--color-surface-border)]/30 hover:bg-white/2">
                        <td className="px-5 py-2 font-semibold text-white">{e.team}</td>
                        <td className="px-5 py-2 text-[var(--color-text-muted)]">{e.competition}</td>
                        <td className="px-5 py-2">
                          {e.competitionTier ? (
                            <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${
                              e.competitionTier === 1
                                ? 'border-rose-500/40 bg-rose-500/15 text-rose-400'
                                : 'border-[var(--color-surface-border)] text-[var(--color-text-muted)]'
                            }`}>
                              {e.competitionTier === 1 ? '⚠ tier 1' : `tier ${e.competitionTier}`}
                            </span>
                          ) : (
                            <span className="text-xs text-[var(--color-text-muted)]">—</span>
                          )}
                        </td>
                        <td className="px-5 py-2 text-[var(--color-text-muted)]">{e.position}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        ))}

        {!loading && rows.length === 0 && (
          <p className="text-center text-sm text-[var(--color-text-muted)]">No promoted seasons found.</p>
        )}
      </div>
    </div>
  );
}
