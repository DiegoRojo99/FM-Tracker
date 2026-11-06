import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  countUsers: vi.fn(),
  countSaves: vi.fn(),
  countSeasons: vi.fn(),
  countStints: vi.fn(),
  countTrophies: vi.fn(),
  countChallenges: vi.fn(),
  countPromotions: vi.fn(),
  countRuns: vi.fn(),
  friendships: vi.fn(),
  users: vi.fn(),
  saves: vi.fn(),
  games: vi.fn(),
  fullSaves: vi.fn(),
  userTrophies: vi.fn(),
  userSeasons: vi.fn(),
  favoriteTeams: vi.fn(),
  achievements: vi.fn(),
  user: vi.fn(),
  cache: vi.fn(),
}));

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: { count: mocks.countUsers, findMany: mocks.users },
    save: { count: mocks.countSaves, findMany: mocks.saves },
    season: { count: mocks.countSeasons },
    careerStint: { count: mocks.countStints },
    trophy: { count: mocks.countTrophies },
    challengeDefinition: { count: mocks.countChallenges },
    leagueResult: { count: mocks.countPromotions },
    challengeRun: { count: mocks.countRuns },
    friendship: { findMany: mocks.friendships },
    game: { findMany: mocks.games },
  },
}));
vi.mock('@/lib/auth/withAuth', () => ({
  withAuth: (_request: NextRequest, handler: (uid: string) => Promise<Response>) => handler('owner'),
  withOptionalAuth: (_request: NextRequest, handler: () => Promise<Response>) => handler(),
}));
vi.mock('@/lib/cache/redis', () => ({ readThroughCache: mocks.cache }));
vi.mock('@/lib/db/saves', () => ({ getFullUserSaves: mocks.fullSaves }));
vi.mock('@/lib/db/trophies', () => ({ countAllTrophiesForUser: mocks.userTrophies }));
vi.mock('@/lib/db/seasons', () => ({ countUserSeasons: mocks.userSeasons }));
vi.mock('@/lib/db/career', () => ({ getUserMostUsedTeams: mocks.favoriteTeams }));
vi.mock('@/lib/db/achievements', () => ({ getUserAchievementSummary: mocks.achievements }));
vi.mock('@/lib/db/users', () => ({ getUserById: mocks.user }));

import { GET as globalStats } from '../stats/route';
import { GET as ownStats } from '../users/stats/route';
import { GET as profileStats } from '../users/[id]/stats/route';
import { GET as leaderboard } from '../friends/leaderboard/route';

describe('FM27 statistics and leaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cache.mockImplementation(async (_key, _ttl, fetcher) => ({ data: await fetcher(), cacheStatus: 'miss' }));
    mocks.countUsers.mockResolvedValue(2);
    mocks.countSaves.mockResolvedValue(3);
    mocks.countSeasons.mockResolvedValue(5);
    mocks.countStints.mockResolvedValue(4);
    mocks.countTrophies.mockResolvedValue(6);
    mocks.countChallenges.mockResolvedValue(7);
    mocks.countPromotions.mockResolvedValue(2);
    mocks.countRuns.mockResolvedValue(1);
    mocks.friendships.mockResolvedValue([{ user1Id: 'owner', user2Id: 'friend' }]);
    mocks.users.mockResolvedValue([
      { uid: 'owner', displayName: 'Owner', email: 'owner@example.test', avatarURL: null },
      { uid: 'friend', displayName: 'Friend', email: 'friend@example.test', avatarURL: null },
    ]);
    mocks.saves.mockResolvedValue([{ gameId: 'fm27' }, { gameId: 'fm26' }]);
    mocks.games.mockResolvedValue([{ id: 'fm27', name: 'Football Manager 2027' }, { id: 'fm26', name: 'Football Manager 2026' }]);
    mocks.fullSaves.mockResolvedValue([
      { id: 'new-save', gameId: 'fm27', seasons: [{}, {}, {}] },
      { id: 'older-save', gameId: 'fm26', seasons: [{}] },
    ]);
    mocks.userTrophies.mockResolvedValue(6);
    mocks.userSeasons.mockResolvedValue(4);
    mocks.favoriteTeams.mockResolvedValue([]);
    mocks.achievements.mockResolvedValue({ totalPoints: 125, unlockedCount: 2, totalCount: 4, progressPercent: 50 });
    mocks.user.mockResolvedValue({ uid: 'friend' });
  });

  it('aggregates all game versions in global statistics without a version filter', async () => {
    const response = await globalStats();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      totalUsers: 2, totalSaves: 3, totalSeasons: 5, totalCareerStints: 4,
      totalTrophies: 6, totalChallenges: 7, timestamp: expect.any(String),
    });
    expect(response.headers.get('x-cache')).toBe('miss');
    expect(mocks.cache).toHaveBeenCalledWith('stats:global', 60, expect.any(Function));
    for (const count of [mocks.countSaves, mocks.countSeasons, mocks.countTrophies]) {
      expect(count).toHaveBeenCalledWith();
    }
  });

  it('returns cached global statistics without rerunning counts', async () => {
    mocks.cache.mockResolvedValue({ data: { totalSaves: 3 }, cacheStatus: 'hit' });
    const response = await globalStats();
    expect(response.headers.get('x-cache')).toBe('hit');
    expect(mocks.countSaves).not.toHaveBeenCalled();
  });

  it('includes FM27 and older saves in authenticated profile totals', async () => {
    const response = await ownStats(new NextRequest('http://localhost/api/users/stats'));
    expect(await response.json()).toMatchObject({
      activeSaves: 2, totalTrophies: 6, currentSeasons: 4, totalPromotions: 2,
      longestSave: { id: 'new-save', gameId: 'fm27' },
      achievements: { totalPoints: 125, unlockedCount: 2 },
    });
    expect(mocks.fullSaves).toHaveBeenCalledWith('owner');
    expect(mocks.userTrophies).toHaveBeenCalledWith('owner');
    expect(mocks.cache).not.toHaveBeenCalled();
  });

  it('includes FM27 in another user profile without reusing viewer statistics', async () => {
    const response = await profileStats(new NextRequest('http://localhost/api/users/friend/stats'), {
      params: Promise.resolve({ id: 'friend' }),
    });
    expect(await response.json()).toMatchObject({
      user: { uid: 'friend' }, totalTrophies: 6,
      longestSave: { gameId: 'fm27' }, achievements: { totalPoints: 125 },
    });
    expect(mocks.fullSaves).toHaveBeenCalledWith('friend');
    expect(mocks.achievements).toHaveBeenCalledWith('friend');
    expect(mocks.cache).not.toHaveBeenCalled();
  });

  it.each(['fm27', 'fm26'])('isolates %s leaderboard trophies and promotions', async (gameId) => {
    const response = await leaderboard(new NextRequest(`http://localhost/api/friends/leaderboard?gameId=${gameId}`));
    const data = await response.json();
    expect(data).toMatchObject({ gameId, participantCount: 2, games: [{ id: 'fm27' }, { id: 'fm26' }] });
    expect(data.leaderboard).toHaveLength(2);
    for (const userId of ['owner', 'friend']) {
      expect(mocks.countTrophies).toHaveBeenCalledWith({ where: { save: { userId, gameId } } });
      expect(mocks.countPromotions).toHaveBeenCalledWith({ where: { promoted: true, season: { save: { userId, gameId } } } });
    }
    expect(data.leaderboard.map((entry: { score: number; rank: number }) => [entry.score, entry.rank])).toEqual([[70, 1], [70, 1]]);
    expect(data.leaderboard[0].breakdown).toEqual({ trophiesPoints: 60, promotionsPoints: 10 });
    expect(mocks.games).toHaveBeenCalledWith({
      where: { id: { in: ['fm27', 'fm26'] } }, select: { id: true, name: true }, orderBy: { releaseDate: 'desc' },
    });
    expect(mocks.cache).not.toHaveBeenCalled();
  });

  it('preserves all-games scoring when no leaderboard game is requested', async () => {
    const response = await leaderboard(new NextRequest('http://localhost/api/friends/leaderboard'));
    expect((await response.json()).gameId).toBeNull();
    expect(mocks.countTrophies).toHaveBeenCalledWith({ where: { save: { userId: 'owner' } } });
    expect(mocks.countPromotions).toHaveBeenCalledWith({ where: { promoted: true, season: { save: { userId: 'owner' } } } });
  });
});
