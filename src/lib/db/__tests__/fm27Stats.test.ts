import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  cache: new Map<string, unknown>(),
  deleteCacheKey: vi.fn(),
  recompute: vi.fn(),
  prisma: {
    user: { count: vi.fn(), create: vi.fn() },
    save: { count: vi.fn(), findUnique: vi.fn(), findMany: vi.fn() },
    season: { count: vi.fn() },
    careerStint: { count: vi.fn() },
    trophy: { count: vi.fn(), findFirst: vi.fn(), create: vi.fn(), delete: vi.fn() },
    challengeDefinition: { count: vi.fn() },
    achievementDefinition: { findMany: vi.fn() },
    userAchievement: { findMany: vi.fn() },
  },
}));
vi.mock('../prisma', () => ({ prisma: mocks.prisma }));
vi.mock('@/lib/db/prisma', () => ({ prisma: mocks.prisma }));
vi.mock('../competitions', () => ({ fetchCompetition: vi.fn(async () => ({ id: 39 })) }));
vi.mock('../teams', () => ({ fetchTeam: vi.fn(async () => ({ id: 1 })) }));
vi.mock('../challenges', () => ({
  getDetailedChallengesForSave: vi.fn(),
  getDetailedChallengesForSaves: vi.fn(async () => new Map()),
}));
vi.mock('../progress', () => ({ safeRecomputeSaveProgress: mocks.recompute }));
vi.mock('../../analytics/server', () => ({ trackServerEvent: vi.fn() }));
vi.mock('../../cache/redis', () => ({ deleteCacheKey: mocks.deleteCacheKey }));
vi.mock('@/lib/cache/redis', () => ({
  deleteCacheKey: mocks.deleteCacheKey,
  readThroughCache: async (key: string, _ttl: number, fetcher: () => Promise<unknown>) => {
    if (mocks.cache.has(key)) return { data: mocks.cache.get(key), cacheStatus: 'hit' };
    const data = await fetcher();
    mocks.cache.set(key, data);
    return { data, cacheStatus: 'miss' };
  },
}));

import { invalidateUserPreviewSavesCache, getFullUserSaves } from '../saves';
import { addTrophyToSave, deleteTrophy, countAllTrophiesForUser } from '../trophies';
import { createUser } from '../users';
import { getUserAchievementSummary } from '../achievements';
import { GET as globalStats } from '../../../app/api/stats/route';

describe('FM27 statistics data and invalidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cache.clear();
    mocks.deleteCacheKey.mockImplementation(async (key: string) => { mocks.cache.delete(key); });
    mocks.prisma.user.count.mockResolvedValue(1);
    mocks.prisma.save.count.mockResolvedValue(2);
    mocks.prisma.season.count.mockResolvedValue(2);
    mocks.prisma.careerStint.count.mockResolvedValue(2);
    mocks.prisma.trophy.count.mockResolvedValue(0);
    mocks.prisma.challengeDefinition.count.mockResolvedValue(1);
    mocks.prisma.save.findUnique.mockResolvedValue({ id: 'save-fm27', userId: 'owner', gameId: 'fm27' });
    mocks.prisma.trophy.findFirst.mockResolvedValue(null);
    mocks.prisma.trophy.create.mockResolvedValue({ id: 27, saveId: 'save-fm27', gameId: 'fm27', teamId: 1, competitionGroupId: 39, season: '2026/27' });
    mocks.prisma.trophy.delete.mockResolvedValue({ id: 27 });
  });

  it('refreshes global counts and user previews after save/season/career invalidation', async () => {
    expect((await globalStats()).headers.get('x-cache')).toBe('miss');
    mocks.cache.set('saves:preview:user:owner', []);
    mocks.prisma.season.count.mockResolvedValue(3);
    mocks.prisma.careerStint.count.mockResolvedValue(3);
    expect((await globalStats()).headers.get('x-cache')).toBe('hit');
    await invalidateUserPreviewSavesCache('owner');
    expect(mocks.cache.has('saves:preview:user:owner')).toBe(false);
    const refreshed = await globalStats();
    expect(refreshed.headers.get('x-cache')).toBe('miss');
    expect(await refreshed.json()).toMatchObject({ totalSeasons: 3, totalCareerStints: 3 });
  });

  it.each([false, true])('invalidates stats for FM27 trophy creation even with skipProgress=%s', async (skipProgress) => {
    await globalStats();
    const id = await addTrophyToSave({ teamId: 1, competitionId: 39, uid: 'owner', season: '2026/27', saveId: 'save-fm27', skipProgress });
    expect(id).toBe(27);
    expect(mocks.prisma.trophy.create).toHaveBeenCalledWith({ data: {
      gameId: 'fm27', saveId: 'save-fm27', season: '2026/27', teamId: 1, competitionGroupId: 39,
    } });
    expect(mocks.cache.has('stats:global')).toBe(false);
    mocks.prisma.trophy.count.mockResolvedValue(1);
    expect(await (await globalStats()).json()).toMatchObject({ totalTrophies: 1 });
    if (skipProgress) expect(mocks.recompute).not.toHaveBeenCalled();
    else expect(mocks.recompute).toHaveBeenCalledWith(expect.objectContaining({ gameId: 'fm27' }));
  });

  it('invalidates global trophy counts after deletion', async () => {
    mocks.prisma.trophy.count.mockResolvedValue(1);
    await globalStats();
    expect(await deleteTrophy(27)).toBe(true);
    mocks.prisma.trophy.count.mockResolvedValue(0);
    expect(await (await globalStats()).json()).toMatchObject({ totalTrophies: 0 });
  });

  it('invalidates global counts after user creation', async () => {
    await globalStats();
    mocks.prisma.user.create.mockResolvedValue({ uid: 'new-user' });
    await createUser({ uid: 'new-user', email: 'new@example.test', displayName: 'New', avatarURL: '' });
    mocks.prisma.user.count.mockResolvedValue(2);
    expect(await (await globalStats()).json()).toMatchObject({ totalUsers: 2 });
  });

  it('does not invalidate counts if creating a user fails', async () => {
    mocks.prisma.user.create.mockRejectedValueOnce(new Error('Database unavailable'));
    await expect(createUser({ uid: 'new-user', email: 'new@example.test', displayName: 'New', avatarURL: '' })).rejects.toThrow('Database unavailable');
    expect(mocks.deleteCacheKey).not.toHaveBeenCalled();
  });

  it('loads all saves and counts trophies without excluding FM27', async () => {
    mocks.prisma.save.findMany.mockResolvedValue([{ id: 'new', gameId: 'fm27' }, { id: 'old', gameId: 'fm26' }]);
    const saves = await getFullUserSaves('owner');
    expect(saves.map(save => save.gameId)).toEqual(['fm27', 'fm26']);
    expect(mocks.prisma.save.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'owner' } }));
    await countAllTrophiesForUser('owner');
    expect(mocks.prisma.trophy.count).toHaveBeenCalledWith({ where: { save: { userId: 'owner' } } });
  });

  it('sums only unlocked active achievement points across all games', async () => {
    mocks.prisma.achievementDefinition.findMany.mockResolvedValue([{}, {}, {}]);
    mocks.prisma.userAchievement.findMany.mockResolvedValue([
      { gameId: 'fm27', pointsAwarded: 25, unlockedAt: new Date() },
      { gameId: 'fm26', pointsAwarded: 100, unlockedAt: new Date() },
      { gameId: 'fm27', pointsAwarded: 50, unlockedAt: null },
    ]);
    expect(await getUserAchievementSummary('owner')).toEqual({
      totalPoints: 125, unlockedCount: 2, totalCount: 3, progressPercent: 67,
    });
    expect(mocks.prisma.userAchievement.findMany).toHaveBeenCalledWith({
      where: { userId: 'owner', achievement: { isActive: true } },
      select: { pointsAwarded: true, unlockedAt: true },
    });
  });
});
