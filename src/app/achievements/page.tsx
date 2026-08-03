'use client';

import { useAuth } from '@/app/components/AuthProvider';
import FootballLoader from '@/app/components/FootBallLoader';
import GradientButton from '@/app/components/GradientButton';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AchievementCategory,
  AchievementDefinition,
  AchievementRarity,
  UserAchievement,
} from '../../../prisma/generated/client';
import {
  AlertTriangle,
  CheckCircle2,
  Lock,
  RefreshCw,
  Sparkles,
  Star,
} from 'lucide-react';

type UserAchievementWithDefinition = UserAchievement & {
  achievement: AchievementDefinition;
};

type AchievementsApiResponse = {
  definitions: AchievementDefinition[];
  userAchievements: UserAchievementWithDefinition[];
  summary: {
    totalPoints: number;
    unlockedCount: number;
    totalCount: number;
    progressPercent: number;
  };
};

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  TROPHIES: 'Trophies',
  PROMOTIONS: 'Promotions',
  CHALLENGES: 'Challenges',
  CAREER: 'Career',
  SEASONS_CONSISTENCY: 'Seasons & Consistency',
};

const CATEGORY_ORDER: AchievementCategory[] = [
  'TROPHIES',
  'PROMOTIONS',
  'CHALLENGES',
  'CAREER',
  'SEASONS_CONSISTENCY',
];

const RARITY_STYLES: Record<AchievementRarity, string> = {
  COMMON: 'bg-slate-500/20 text-slate-200 border-slate-400/30',
  RARE: 'bg-sky-500/20 text-sky-200 border-sky-400/30',
  EPIC: 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400/30',
  LEGENDARY: 'bg-amber-500/20 text-amber-200 border-amber-400/30',
};

const RARITY_ORDER: Record<AchievementRarity, number> = {
  COMMON: 0,
  RARE: 1,
  EPIC: 2,
  LEGENDARY: 3,
};

export default function AchievementsPage() {
  const { user, userLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [runningBackfill, setRunningBackfill] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AchievementsApiResponse | null>(null);

  const fetchAchievements = useCallback(async () => {
    if (!user) {
      setData(null);
      setLoading(false);
      return;
    }

    const token = await user.getIdToken();
    const response = await fetch('/api/achievements', {
      headers: { Authorization: `Bearer ${token}`, },
      cache: 'no-store',
    });

    if (!response.ok) throw new Error('Failed to fetch achievements');
    const payload = (await response.json()) as AchievementsApiResponse;
    setData(payload);
  }, [user]);

  useEffect(() => {
    if (userLoading) return;

    setLoading(true);
    setError(null);

    fetchAchievements()
      .catch((err: unknown) => {
        if (!(err instanceof Error)) return;
        setError(err.message || 'Failed to load achievements');
      })
      .finally(() => setLoading(false));
  }, [fetchAchievements, userLoading]);

  const achievementProgressByKey = useMemo(() => {
    const achievementMap = new Map<string, UserAchievementWithDefinition>();

    for (const achievement of data?.userAchievements ?? []) {
      achievementMap.set(achievement.achievementKey, achievement);
    }

    return achievementMap;
  }, [data]);

  const categorizedDefinitions = useMemo(() => {
    const groups = new Map<AchievementCategory, AchievementDefinition[]>();
    for (const category of CATEGORY_ORDER) {
      groups.set(category, []);
    }

    for (const definition of data?.definitions ?? []) {
      groups.get(definition.category)?.push(definition);
    }

    for (const [, definitions] of groups) {
      definitions.sort((a, b) => {
        const rarityDiff = RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity];
        if (rarityDiff !== 0) return rarityDiff;
        const pointsDiff = a.points - b.points;
        if (pointsDiff !== 0) return pointsDiff;
        return a.title.localeCompare(b.title);
      });
    }

    return groups;
  }, [data]);

  const handleBackfill = async () => {
    if (!user || runningBackfill) return;

    setRunningBackfill(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/achievements/backfill', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.error || 'Backfill failed');
      }

      setRefreshing(true);
      await fetchAchievements();
    } catch (err: unknown) {
      if (!(err instanceof Error)) return;
      setError(err.message || 'Failed to run backfill');
    } finally {
      setRunningBackfill(false);
      setRefreshing(false);
    }
  };

  if (loading || userLoading) {
    return (
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="flex min-h-[52vh] items-center justify-center rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/90 shadow-xl backdrop-blur-sm">
          <FootballLoader />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-5xl p-6 sm:p-8">
        <div className="rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/92 p-6 text-center shadow-xl backdrop-blur-sm sm:p-8">
          <h1 className="text-2xl font-bold text-white">Achievements</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Log in to track your FM milestones and unlock rewards.</p>
        </div>
      </div>
    );
  }

  const summary = data?.summary ?? {
    totalPoints: 0,
    unlockedCount: 0,
    totalCount: 0,
    progressPercent: 0,
  };

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/90 p-5 shadow-xl backdrop-blur-sm sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-highlight)]">Legacy Progress</p>
            <h1 className="mt-1 text-3xl font-black text-white sm:text-4xl">Achievements</h1>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">Unlock milestones across trophies, promotions, challenges, and long-term career consistency.</p>
          </div>

          <GradientButton
            onClick={handleBackfill}
            disabled={runningBackfill || refreshing}
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 ${(runningBackfill || refreshing) ? 'animate-spin' : ''}`} />
            {runningBackfill ? 'Backfilling...' : 'Recalculate Progress'}
          </GradientButton>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-4">
          <SummaryStat label="Unlocked" value={`${summary.unlockedCount}/${summary.totalCount}`} icon={<CheckCircle2 className="h-5 w-5 text-emerald-300" />} />
          <SummaryStat label="Completion" value={`${summary.progressPercent}%`} icon={<Sparkles className="h-5 w-5 text-[var(--color-highlight)]" />} />
          <SummaryStat label="Total Points" value={`${summary.totalPoints}`} icon={<Star className="h-5 w-5 text-amber-300" />} />
          <SummaryStat label="Locked" value={`${Math.max(summary.totalCount - summary.unlockedCount, 0)}`} icon={<Lock className="h-5 w-5 text-slate-300" />} />
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <p>{error}</p>
          </div>
        )}
      </div>

      <div className="mt-8 space-y-8">
        {CATEGORY_ORDER.map((category) => {
          const definitions = categorizedDefinitions.get(category) ?? [];
          if (definitions.length === 0) return null;

          return (
            <section
              key={category}
              className="rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/90 p-5 shadow-lg backdrop-blur-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">{CATEGORY_LABELS[category]}</h2>
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  {definitions.length} achievements
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {definitions.map((definition) => {
                  const progress = achievementProgressByKey.get(definition.key);
                  const currentProgress = Math.min(progress?.progress ?? 0, definition.maxProgress);
                  const isUnlocked = !!progress?.unlockedAt;
                  const progressPct = definition.maxProgress > 0
                    ? Math.round((currentProgress / definition.maxProgress) * 100)
                    : 0;

                  return (
                    <article
                      key={definition.key}
                      className={`rounded-xl border p-4 transition ${
                        isUnlocked
                          ? 'border-emerald-400/35 bg-emerald-500/5'
                          : 'border-[var(--color-surface-border)] bg-[var(--color-surface-soft)]/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-white">{definition.title}</h3>
                          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{definition.description}</p>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2 py-1 text-[11px] font-semibold uppercase ${RARITY_STYLES[definition.rarity]}`}>
                          {definition.rarity}
                        </span>
                      </div>

                      <div className="mt-4">
                        <div className="mb-1 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                          <span>Progress</span>
                          <span>{currentProgress}/{definition.maxProgress}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[var(--color-darker)]">
                          <div
                            className={`h-full rounded-full transition-all ${isUnlocked ? 'bg-emerald-400' : 'bg-[var(--color-accent)]'}`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="font-semibold text-amber-300">{definition.points} pts</span>
                        {isUnlocked ? (
                          <span className="inline-flex items-center gap-1 text-emerald-300">
                            <CheckCircle2 className="h-4 w-4" />
                            Unlocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-300">
                            <Lock className="h-4 w-4" />
                            Locked
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
        {icon}
      </div>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </div>
  );
}
