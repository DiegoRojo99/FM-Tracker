'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Database, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useAuth } from '@/app/components/AuthProvider';

type ApiCompetitionRow = {
  id: number;
  name: string;
  countryCode: string;
  type: string;
  tier: number | null;
  isFemale: boolean | null;
  isActive: boolean;
  logoUrl: string | null;
  updatedAt: string;
  _count: {
    groups: number;
    teamSeasons: number;
  };
};

type SaveState = Record<number, boolean>;

const TYPE_OPTIONS = ['DOMESTIC_LEAGUE', 'DOMESTIC_CUP', 'CONTINENTAL_CLUB', 'INTERNATIONAL_NT', 'SUPER_CUP', 'Other'];

export default function ApiCompetitionsAdminPage() {
  const { user, userLoading } = useAuth();
  const router = useRouter();

  const [rows, setRows] = useState<ApiCompetitionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<SaveState>({});
  const [savingAll, setSavingAll] = useState(false);

  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [femaleFilter, setFemaleFilter] = useState<'all' | 'female' | 'male' | 'unknown'>('all');

  const [editType, setEditType] = useState<Record<number, string>>({});
  const [editTier, setEditTier] = useState<Record<number, string>>({});
  const [editIsActive, setEditIsActive] = useState<Record<number, boolean>>({});
  const [editIsFemale, setEditIsFemale] = useState<Record<number, 'true' | 'false' | 'null'>>({});

  const [newApiId, setNewApiId] = useState('');
  const [newType, setNewType] = useState('');
  const [newTier, setNewTier] = useState('');
  const [newIsActive, setNewIsActive] = useState(true);
  const [newIsFemale, setNewIsFemale] = useState<'auto' | 'true' | 'false' | 'null'>('auto');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const adminUID = process.env.NEXT_PUBLIC_ADMIN_UID;
    if (userLoading) return;
    if (!user || user.uid !== adminUID) router.replace('/');
  }, [user, userLoading, router]);

  const buildFilters = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (country) params.set('country', country);
    if (typeFilter) params.set('type', typeFilter);
    if (activeOnly) params.set('activeOnly', 'true');
    if (femaleFilter === 'female') params.set('isFemale', 'true');
    if (femaleFilter === 'male') params.set('isFemale', 'false');
    return params;
  }, [search, country, typeFilter, activeOnly, femaleFilter]);

  const hydrateEditors = (data: ApiCompetitionRow[]) => {
    setEditType(Object.fromEntries(data.map((row) => [row.id, row.type])));
    setEditTier(Object.fromEntries(data.map((row) => [row.id, row.tier?.toString() ?? ''])));
    setEditIsActive(Object.fromEntries(data.map((row) => [row.id, row.isActive])));
    setEditIsFemale(
      Object.fromEntries(
        data.map((row) => [row.id, row.isFemale === true ? 'true' : row.isFemale === false ? 'false' : 'null'])
      )
    );
  };

  const fetchRows = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/competitions/api?${buildFilters.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Failed to load API competitions (${response.status})`);
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        throw new Error('API competitions endpoint returned a non-JSON response');
      }

      const text = await response.text();
      const data = (text ? JSON.parse(text) : []) as ApiCompetitionRow[];
      const filtered =
        femaleFilter === 'unknown'
          ? data.filter((row) => row.isFemale === null)
          : data;

      setRows(filtered);
      hydrateEditors(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API competitions');
    } finally {
      setLoading(false);
    }
  }, [user, buildFilters, femaleFilter]);

  useEffect(() => {
    if (!userLoading && user) {
      fetchRows();
    }
  }, [userLoading, user, fetchRows]);

  const saveRow = async (id: number): Promise<{ ok: true } | { ok: false; message: string }> => {
    if (!user) return { ok: false, message: 'User not authenticated.' };

    const row = rows.find((entry) => entry.id === id);
    if (!row) return { ok: false, message: `Row id=${id} not found.` };

    const tierRaw = editTier[id] ?? '';
    const parsedTier = tierRaw === '' ? null : Number(tierRaw);
    if (tierRaw !== '' && (!Number.isInteger(parsedTier) || parsedTier < 1)) {
      return { ok: false, message: `Invalid tier for row ${id}. Tier must be empty or a positive integer.` };
    }

    const payload = {
      id,
      type: editType[id],
      tier: parsedTier,
      isActive: editIsActive[id],
      isFemale: editIsFemale[id] === 'null' ? null : editIsFemale[id] === 'true',
    };

    setSaving((prev) => ({ ...prev, [id]: true }));

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/competitions/api', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        return { ok: false, message: text || `Failed to update row ${id}` };
      }

      const updated = (await response.json()) as ApiCompetitionRow;
      setRows((prev) => {
        const next = prev.map((entry) => (entry.id === id ? updated : entry));
        hydrateEditors(next);
        return next;
      });

      return { ok: true };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : `Failed to save row ${id}` };
    } finally {
      setSaving((prev) => ({ ...prev, [id]: false }));
    }
  };

  const saveAllRows = async () => {
    if (!user) return;
    setSavingAll(true);
    setError(null);

    const dirtyIds = rows.filter((row) => rowDirty(row)).map((row) => row.id);
    if (dirtyIds.length === 0) {
      setSavingAll(false);
      return;
    }

    const failed: Array<{ id: number; message: string }> = [];
    let successCount = 0;

    for (const id of dirtyIds) {
      const result = await saveRow(id);
      if (result.ok) {
        successCount += 1;
      } else {
        failed.push({ id, message: result.message });
      }
    }

    if (failed.length === 0) {
      setError(null);
    } else {
      const first = failed[0];
      const remaining = failed.length - 1;
      setError(
        `Saved ${successCount}/${dirtyIds.length} rows. First error on id=${first.id}: ${first.message}${remaining > 0 ? ` (and ${remaining} more)` : ''}`
      );
    }

    setSavingAll(false);
  };

  const deleteRow = async (id: number) => {
    if (!user) return;
    const row = rows.find((entry) => entry.id === id);
    if (!row) return;

    const confirmed = window.confirm(
      `Delete API competition ${row.name} (${row.id})?\\nThis also deletes ${row._count.groups} group links and ${row._count.teamSeasons} team-season rows.`
    );
    if (!confirmed) return;

    setSaving((prev) => ({ ...prev, [id]: true }));
    setError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/competitions/api', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Failed to delete row ${id}`);
      }

      setRows((prev) => prev.filter((entry) => entry.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to delete row ${id}`);
    } finally {
      setSaving((prev) => ({ ...prev, [id]: false }));
    }
  };

  const addByApiId = async () => {
    if (!user) return;

    const apiId = Number(newApiId.trim());
    if (!Number.isInteger(apiId) || apiId <= 0) {
      setError('API ID must be a positive integer.');
      return;
    }

    const payload: {
      apiId: number;
      type?: string;
      tier?: number | null;
      isActive: boolean;
      isFemale?: boolean | null;
    } = {
      apiId,
      isActive: newIsActive,
    };

    if (newType) payload.type = newType;
    if (newTier !== '') payload.tier = Number(newTier);
    if (newIsFemale === 'true') payload.isFemale = true;
    if (newIsFemale === 'false') payload.isFemale = false;
    if (newIsFemale === 'null') payload.isFemale = null;

    if (payload.tier !== undefined && payload.tier !== null && (!Number.isInteger(payload.tier) || payload.tier < 1)) {
      setError('New row tier must be empty or a positive integer.');
      return;
    }

    setAdding(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/competitions/api', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Failed to add API competition ${apiId}`);
      }

      const created = (await response.json()) as ApiCompetitionRow;
      setRows((prev) => {
        const withoutOld = prev.filter((entry) => entry.id !== created.id);
        const next = [...withoutOld, created].sort((a, b) => a.countryCode.localeCompare(b.countryCode) || a.name.localeCompare(b.name));
        hydrateEditors(next);
        return next;
      });
      setNewApiId('');
      setNewTier('');
      setNewType('');
      setNewIsFemale('auto');
      setNewIsActive(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add API competition');
    } finally {
      setAdding(false);
    }
  };

  const rowDirty = (row: ApiCompetitionRow) => {
    const tierStr = row.tier?.toString() ?? '';
    const femaleStr = row.isFemale === true ? 'true' : row.isFemale === false ? 'false' : 'null';
    return (
      editType[row.id] !== row.type ||
      editTier[row.id] !== tierStr ||
      editIsActive[row.id] !== row.isActive ||
      editIsFemale[row.id] !== femaleStr
    );
  };

  const dirtyCount = rows.filter((row) => rowDirty(row)).length;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/90 p-6 shadow-2xl backdrop-blur-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-highlight)]">Admin</p>
              <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">API Competitions</h1>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Inspect, edit, delete, and create ApiCompetition rows from API-Football league IDs.
              </p>
            </div>
            <button
              onClick={fetchRows}
              disabled={loading || savingAll}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-4 py-2 text-sm font-semibold text-white hover:border-[var(--color-accent)] disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={saveAllRows}
              disabled={savingAll || dirtyCount === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-50"
            >
              {savingAll ? 'Saving...' : `Save All${dirtyCount > 0 ? ` (${dirtyCount})` : ''}`}
            </button>
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          )}

          <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or country code"
                className="w-full rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] py-2 pl-9 pr-3 text-sm text-white placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>
            <input
              value={country}
              onChange={(event) => setCountry(event.target.value.toUpperCase())}
              placeholder="Country code"
              className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-3 py-2 text-sm text-white placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
            />
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-3 py-2 text-sm text-white focus:border-[var(--color-accent)] focus:outline-none"
            >
              <option value="">All types</option>
              {TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select
              value={femaleFilter}
              onChange={(event) => setFemaleFilter(event.target.value as 'all' | 'female' | 'male' | 'unknown')}
              className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-3 py-2 text-sm text-white focus:border-[var(--color-accent)] focus:outline-none"
            >
              <option value="all">Gender: all</option>
              <option value="female">Gender: women</option>
              <option value="male">Gender: men</option>
              <option value="unknown">Gender: unknown</option>
            </select>
          </div>

          <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-3 py-2 text-sm text-white">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(event) => setActiveOnly(event.target.checked)}
              className="rounded"
            />
            Active only
          </label>
        </div>

        <div className="rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/90 p-6 shadow-2xl backdrop-blur-sm">
          <h2 className="text-lg font-bold text-white">Add or Sync by API League ID</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            This fetches from API-Football using the given league ID and upserts the row in ApiCompetition.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-6">
            <input
              value={newApiId}
              onChange={(event) => setNewApiId(event.target.value)}
              placeholder="API league id"
              className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-3 py-2 text-sm text-white placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
            />
            <select
              value={newType}
              onChange={(event) => setNewType(event.target.value)}
              className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-3 py-2 text-sm text-white focus:border-[var(--color-accent)] focus:outline-none"
            >
              <option value="">Type: from API</option>
              {TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <input
              value={newTier}
              onChange={(event) => setNewTier(event.target.value)}
              placeholder="Tier (optional)"
              className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-3 py-2 text-sm text-white placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
            />
            <select
              value={newIsFemale}
              onChange={(event) => setNewIsFemale(event.target.value as 'auto' | 'true' | 'false' | 'null')}
              className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-3 py-2 text-sm text-white focus:border-[var(--color-accent)] focus:outline-none"
            >
              <option value="auto">Gender: auto-detect</option>
              <option value="true">Gender: women</option>
              <option value="false">Gender: men</option>
              <option value="null">Gender: unknown</option>
            </select>
            <label className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-3 py-2 text-sm text-white">
              <input
                type="checkbox"
                checked={newIsActive}
                onChange={(event) => setNewIsActive(event.target.checked)}
                className="rounded"
              />
              Active
            </label>
            <button
              onClick={addByApiId}
              disabled={adding}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {adding ? 'Working...' : 'Add / Sync'}
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/90 shadow-2xl backdrop-blur-sm overflow-hidden">
          {loading ? (
            <p className="p-8 text-center text-sm text-[var(--color-text-muted)]">Loading API competitions...</p>
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-sm text-[var(--color-text-muted)]">No rows found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-surface-border)] bg-black/20 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  <th className="px-4 py-3">Comp</th>
                  <th className="px-4 py-3">Country</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">Female</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3">Links</th>
                  <th className="px-4 py-3">TeamSeasons</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const dirty = rowDirty(row);
                  const busy = saving[row.id] === true;

                  return (
                    <tr key={row.id} className="border-b border-[var(--color-surface-border)]/40 hover:bg-white/2">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {row.logoUrl ? (
                            <Image
                              src={row.logoUrl}
                              alt={row.name}
                              width={24}
                              height={24}
                              unoptimized
                              className="h-6 w-6 rounded object-contain bg-white/10"
                            />
                          ) : (
                            <Database className="h-5 w-5 text-[var(--color-text-muted)]" />
                          )}
                          <div>
                            <p className="font-semibold text-white">{row.name}</p>
                            <p className="text-xs text-[var(--color-text-muted)]">ID {row.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--color-text-muted)]">{row.countryCode}</td>
                      <td className="px-4 py-3">
                        <select
                          value={editType[row.id] ?? row.type}
                          onChange={(event) => setEditType((prev) => ({ ...prev, [row.id]: event.target.value }))}
                          className="rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-2 py-1 text-xs text-white focus:border-[var(--color-accent)] focus:outline-none"
                        >
                          {TYPE_OPTIONS.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          value={editTier[row.id] ?? ''}
                          onChange={(event) => setEditTier((prev) => ({ ...prev, [row.id]: event.target.value }))}
                          placeholder="-"
                          className="w-16 rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-2 py-1 text-center text-xs text-white focus:border-[var(--color-accent)] focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={editIsFemale[row.id] ?? 'null'}
                          onChange={(event) => setEditIsFemale((prev) => ({ ...prev, [row.id]: event.target.value as 'true' | 'false' | 'null' }))}
                          className="rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-2 py-1 text-xs text-white focus:border-[var(--color-accent)] focus:outline-none"
                        >
                          <option value="null">Unknown</option>
                          <option value="true">Women</option>
                          <option value="false">Men</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={editIsActive[row.id] ?? row.isActive}
                          onChange={(event) => setEditIsActive((prev) => ({ ...prev, [row.id]: event.target.checked }))}
                          className="h-4 w-4 rounded"
                        />
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--color-text-muted)]">{row._count.groups}</td>
                      <td className="px-4 py-3 text-xs text-[var(--color-text-muted)]">{row._count.teamSeasons}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => saveRow(row.id)}
                            disabled={!dirty || busy}
                            className="rounded-lg border border-sky-500/40 bg-sky-500/15 px-2.5 py-1 text-xs font-semibold text-sky-200 hover:bg-sky-500/25 disabled:opacity-40"
                          >
                            {busy ? '...' : 'Save'}
                          </button>
                          <button
                            onClick={() => deleteRow(row.id)}
                            disabled={busy}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/15 px-2.5 py-1 text-xs font-semibold text-rose-200 hover:bg-rose-500/25 disabled:opacity-40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
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
