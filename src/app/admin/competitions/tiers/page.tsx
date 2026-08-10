'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/app/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, Layers, Search } from 'lucide-react';

type Competition = {
  id: number;
  name: string;
  displayName: string;
  countryCode: string;
  type: string;
  tier: number | null;
  isActive: boolean;
};

const TIER_COLORS: Record<number, string> = {
  1: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  2: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  3: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  4: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
};
const tierStyle = (tier: number | null) =>
  tier && TIER_COLORS[tier]
    ? TIER_COLORS[tier]
    : 'bg-[var(--color-surface-soft)] text-[var(--color-text-muted)] border-[var(--color-surface-border)]';

export default function CompetitionTiersPage() {
  const { user, userLoading } = useAuth();
  const router = useRouter();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);
  const [groupByCountry, setGroupByCountry] = useState(false);
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [editTier, setEditTier] = useState<Record<number, string>>({});
  const [editType, setEditType] = useState<Record<number, string>>({});

  const COMPETITION_TYPES = ['DOMESTIC_LEAGUE', 'DOMESTIC_CUP', 'International', 'Other'];

  useEffect(() => {
    const adminUID = process.env.NEXT_PUBLIC_ADMIN_UID;
    if (userLoading) return;
    if (!user || user.uid !== adminUID) router.replace('/');
  }, [user, userLoading, router]);

  const fetchCompetitions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (country) params.set('country', country);
      if (activeOnly) params.set('activeOnly', 'true');
      const res = await fetch(`/api/admin/competitions/tiers?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCompetitions(data);
      setEditTier(Object.fromEntries(data.map((c: Competition) => [c.id, c.tier?.toString() ?? ''])));
      setEditType(Object.fromEntries(data.map((c: Competition) => [c.id, c.type ?? ''])));
    } finally {
      setLoading(false);
    }
  }, [user, search, country, activeOnly]);

  useEffect(() => {
    if (!userLoading && user) fetchCompetitions();
  }, [user, userLoading, fetchCompetitions]);

  const saveTier = async (id: number) => {
    if (!user) return;
    const raw = editTier[id];
    const tier = raw === '' ? null : parseInt(raw, 10);
    if (raw !== '' && (isNaN(tier!) || tier! < 1)) return;
    setSaving(prev => ({ ...prev, [id]: true }));
    try {
      const token = await user.getIdToken();
      await fetch('/api/admin/competitions/tiers', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, tier }),
      });
      setCompetitions(prev => prev.map(c => c.id === id ? { ...c, tier: tier ?? null } : c));
    } finally {
      setSaving(prev => ({ ...prev, [id]: false }));
    }
  };

  const saveType = async (id: number) => {
    if (!user) return;
    const type = editType[id];
    if (!type) return;
    setSaving(prev => ({ ...prev, [id]: true }));
    try {
      const token = await user.getIdToken();
      await fetch('/api/admin/competitions/tiers', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type }),
      });
      setCompetitions(prev => prev.map(c => c.id === id ? { ...c, type } : c));
    } finally {
      setSaving(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/90 p-6 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-highlight)]">Admin</p>
              <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">Competition Tiers</h1>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Tier 1 = top flight. Promotions are blocked for tier-1 seasons.
              </p>
            </div>
            <Layers className="h-8 w-8 text-[var(--color-highlight)]" />
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search competition name…"
                className="w-full rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] py-2 pl-9 pr-3 text-sm text-white placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>
            <input
              value={country}
              onChange={e => setCountry(e.target.value.toUpperCase())}
              placeholder="Country code (e.g. ESP)"
              className="w-full rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-3 py-2 text-sm text-white placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none sm:w-52"
            />
            <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-3 py-2 text-sm text-white select-none">
              <input
                type="checkbox"
                checked={activeOnly}
                onChange={e => setActiveOnly(e.target.checked)}
                className="rounded"
              />
              Active only
            </label>
            <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-3 py-2 text-sm text-white select-none">
              <input
                type="checkbox"
                checked={groupByCountry}
                onChange={e => {
                  setGroupByCountry(e.target.checked);
                  if (e.target.checked) {
                    // Expand all countries by default when switching to grouped view
                    setExpandedCountries(new Set(competitions.map(c => c.countryCode)));
                  }
                }}
                className="rounded"
              />
              Group by country
            </label>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/90 shadow-2xl backdrop-blur-sm overflow-hidden">
          {loading ? (
            <p className="p-8 text-center text-sm text-[var(--color-text-muted)]">Loading…</p>
          ) : competitions.length === 0 ? (
            <p className="p-8 text-center text-sm text-[var(--color-text-muted)]">No competitions found.</p>
          ) : groupByCountry ? (
            // Grouped accordion view
            <div className="divide-y divide-[var(--color-surface-border)]">
              {Object.entries(
                competitions.reduce<Record<string, Competition[]>>((acc, c) => {
                  (acc[c.countryCode] ??= []).push(c);
                  return acc;
                }, {})
              ).sort(([a], [b]) => a.localeCompare(b)).map(([code, comps]) => {
                const isOpen = expandedCountries.has(code);
                const toggle = () => setExpandedCountries(prev => {
                  const next = new Set(prev);
                  next.has(code) ? next.delete(code) : next.add(code);
                  return next;
                });
                const tieredCount = comps.filter(c => c.tier !== null).length;
                return (
                  <div key={code}>
                    <button
                      onClick={toggle}
                      className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-white/2"
                    >
                      <div className="flex items-center gap-3">
                        {isOpen ? <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" /> : <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />}
                        <span className="font-mono text-sm font-bold text-white">{code}</span>
                        <span className="text-xs text-[var(--color-text-muted)]">{comps.length} competition{comps.length !== 1 ? 's' : ''}</span>
                      </div>
                      <span className={`text-xs font-semibold ${tieredCount === comps.length ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {tieredCount}/{comps.length} tiered
                      </span>
                    </button>
                    {isOpen && (
                      <table className="w-full text-sm border-t border-[var(--color-surface-border)]/50">
                        <tbody>
                          {comps.sort((a, b) => (a.tier ?? 99) - (b.tier ?? 99) || a.name.localeCompare(b.name)).map(c => {
                            const currentTierStr = editTier[c.id] ?? '';
                            const isDirty = currentTierStr !== (c.tier?.toString() ?? '');
                            return (
                              <tr key={c.id} className="border-b border-[var(--color-surface-border)]/30 hover:bg-white/2">
                                <td className="px-8 py-2 font-semibold text-white">{c.displayName || c.name}</td>
                                <td className="px-4 py-2">
                                  <div className="flex items-center gap-1">
                                    <select
                                      value={editType[c.id] ?? c.type}
                                      onChange={e => setEditType(prev => ({ ...prev, [c.id]: e.target.value }))}
                                      className="rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-2 py-1 text-xs text-white focus:border-[var(--color-accent)] focus:outline-none"
                                    >
                                      {COMPETITION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    {editType[c.id] !== c.type && (
                                      <button onClick={() => saveType(c.id)} disabled={saving[c.id]}
                                        className="rounded-lg border border-sky-500/40 bg-sky-500/15 px-2 py-1 text-xs font-semibold text-sky-300 hover:bg-sky-500/25 disabled:opacity-50">
                                        {saving[c.id] ? '…' : 'Save'}
                                      </button>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-2 w-36">
                                  <div className="flex items-center gap-2">
                                    <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${tierStyle(c.tier)}`}>{c.tier ?? '—'}</span>
                                    <input
                                      type="number" min={1}
                                      value={currentTierStr}
                                      onChange={e => setEditTier(prev => ({ ...prev, [c.id]: e.target.value }))}
                                      onKeyDown={e => e.key === 'Enter' && saveTier(c.id)}
                                      placeholder="—"
                                      className="w-14 rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-2 py-1 text-center text-xs text-white focus:border-[var(--color-accent)] focus:outline-none"
                                    />
                                    {isDirty && (
                                      <button onClick={() => saveTier(c.id)} disabled={saving[c.id]}
                                        className="rounded-lg border border-[var(--color-highlight)]/40 bg-[var(--color-highlight)]/15 px-2 py-1 text-xs font-semibold text-white transition hover:bg-[var(--color-highlight)]/25 disabled:opacity-50">
                                        {saving[c.id] ? '…' : 'Save'}
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-surface-border)] bg-black/20 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  <th className="px-4 py-3">Competition</th>
                  <th className="px-4 py-3">Country</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 w-48">Edit Type</th>
                  <th className="px-4 py-3 w-32">Tier</th>
                  <th className="px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {competitions.map(c => {
                  const currentTierStr = editTier[c.id] ?? '';
                  const isDirty = currentTierStr !== (c.tier?.toString() ?? '');
                  return (
                    <tr key={c.id} className="border-b border-[var(--color-surface-border)]/50 hover:bg-white/2">
                      <td className="px-4 py-3">
                        <span className="font-semibold text-white">{c.displayName || c.name}</span>
                        {!c.isActive && <span className="ml-2 text-xs text-[var(--color-text-muted)]">inactive</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--color-text-muted)]">{c.countryCode}</td>
                      <td className="px-4 py-3 text-xs text-[var(--color-text-muted)]">{c.type}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <select
                            value={editType[c.id] ?? c.type}
                            onChange={e => setEditType(prev => ({ ...prev, [c.id]: e.target.value }))}
                            className="rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-2 py-1 text-xs text-white focus:border-[var(--color-accent)] focus:outline-none"
                          >
                            {COMPETITION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          {editType[c.id] !== c.type && (
                            <button onClick={() => saveType(c.id)} disabled={saving[c.id]}
                              className="rounded-lg border border-sky-500/40 bg-sky-500/15 px-2 py-1 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/25 disabled:opacity-50">
                              {saving[c.id] ? '…' : 'Save'}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${tierStyle(c.tier)}`}>
                            {c.tier ?? '—'}
                          </span>
                          <input
                            type="number"
                            min={1}
                            value={currentTierStr}
                            onChange={e => setEditTier(prev => ({ ...prev, [c.id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && saveTier(c.id)}
                            placeholder="—"
                            className="w-14 rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-2 py-1 text-center text-xs text-white focus:border-[var(--color-accent)] focus:outline-none"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {isDirty && (
                          <button
                            onClick={() => saveTier(c.id)}
                            disabled={saving[c.id]}
                            className="rounded-lg border border-[var(--color-highlight)]/40 bg-[var(--color-highlight)]/15 px-3 py-1 text-xs font-semibold text-white transition hover:bg-[var(--color-highlight)]/25 disabled:opacity-50"
                          >
                            {saving[c.id] ? 'Saving…' : 'Save'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
