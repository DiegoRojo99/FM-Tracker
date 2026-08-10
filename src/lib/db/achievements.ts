import {
  AchievementDefinition,
  Prisma,
  UserAchievement,
} from '../../../prisma/generated/client';
import {
  ACHIEVEMENT_CATALOG,
  ACHIEVEMENT_CATALOG_BY_KEY,
  AchievementEventType,
} from '../achievements/catalog';
import { prisma } from './prisma';

type UserAchievementWithDefinition = UserAchievement & {
  achievement: AchievementDefinition;
};

type EvaluateAchievementsInput = {
  userId: string;
  saveId?: string;
  gameId?: string;
  eventType: AchievementEventType;
  eventTimestamp?: Date;
  evaluateAll?: boolean;
  skipSeed?: boolean;
};

type UserAggregates = {
  totalTrophies: number;
  totalPromotions: number;
  completedChallenges: number;
  startedChallenges: number;
  activeSaves: number;
  distinctClubsManaged: number;
  totalSeasons: number;
};

export async function seedAchievementDefinitions(): Promise<void> {
  const activeKeys = ACHIEVEMENT_CATALOG.map((entry) => entry.key);
  await prisma.achievementDefinition.updateMany({
    where: {
      key: { notIn: activeKeys },
      isActive: true,
    },
    data: { isActive: false },
  });

  for (const entry of ACHIEVEMENT_CATALOG) {
    await prisma.achievementDefinition.upsert({
      where: { key: entry.key },
      update: {
        title: entry.title,
        description: entry.description,
        category: entry.category,
        rarity: entry.rarity,
        points: entry.points,
        icon: entry.icon ?? null,
        maxProgress: entry.maxProgress,
        isActive: entry.isActive ?? true,
      },
      create: {
        key: entry.key,
        title: entry.title,
        description: entry.description,
        category: entry.category,
        rarity: entry.rarity,
        points: entry.points,
        icon: entry.icon ?? null,
        maxProgress: entry.maxProgress,
        isActive: entry.isActive ?? true,
      },
    });
  }
}

export async function backfillAchievementsForAllUsers(): Promise<{
  usersProcessed: number;
  totalEvaluatedCount: number;
  totalUnlockedNow: number;
}> {
  const users = await prisma.user.findMany({
    select: { uid: true },
  });

  let totalEvaluatedCount = 0;
  let totalUnlockedNow = 0;

  for (const user of users) {
    const result = await evaluateAchievementsForUser({
      userId: user.uid,
      eventType: 'season.created',
      evaluateAll: true,
      eventTimestamp: new Date(),
      skipSeed: true,
    });

    totalEvaluatedCount += result.evaluatedCount;
    totalUnlockedNow += result.unlockedNow.length;
  }

  return {
    usersProcessed: users.length,
    totalEvaluatedCount,
    totalUnlockedNow,
  };
}

export async function getAchievementDefinitions(): Promise<AchievementDefinition[]> {
  return prisma.achievementDefinition.findMany({
    where: { isActive: true },
    orderBy: { key: 'asc' },
  });
}

export async function getUserAchievements(
  userId: string,
  gameId?: string
): Promise<UserAchievementWithDefinition[]> {
  return prisma.userAchievement.findMany({
    where: {
      userId,
      achievement: { isActive: true },
      ...(gameId ? { OR: [{ gameId: null }, { gameId }] } : {}),
    },
    include: { achievement: true },
    orderBy: [{ unlockedAt: 'desc' }, { achievementKey: 'asc' }],
  });
}

export async function getUserAchievementSummary(userId: string): Promise<{
  totalPoints: number;
  unlockedCount: number;
  totalCount: number;
  progressPercent: number;
}> {
  const [definitions, userAchievements] = await Promise.all([
    getAchievementDefinitions(),
    prisma.userAchievement.findMany({
      where: {
        userId,
        achievement: { isActive: true },
      },
      select: {
        pointsAwarded: true,
        unlockedAt: true,
      },
    }),
  ]);

  const unlocked = userAchievements.filter((row) => row.unlockedAt !== null);
  const totalPoints = unlocked.reduce((sum, row) => sum + row.pointsAwarded, 0);
  const totalCount = definitions.length;
  const unlockedCount = unlocked.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((unlockedCount / totalCount) * 100);

  return {
    totalPoints,
    unlockedCount,
    totalCount,
    progressPercent,
  };
}

export async function evaluateAchievementsForUser(input: EvaluateAchievementsInput): Promise<{
  evaluatedCount: number;
  unlockedNow: string[];
}> {
  if (!input.skipSeed) await seedAchievementDefinitions();

  const definitions = await getAchievementDefinitions();
  const relevantDefinitions = input.evaluateAll
    ? definitions
    : definitions.filter((definition) => {
        const catalogEntry = ACHIEVEMENT_CATALOG_BY_KEY.get(definition.key);
        return catalogEntry?.triggerEvents.includes(input.eventType) ?? false;
      });

  if (relevantDefinitions.length === 0) {
    return { evaluatedCount: 0, unlockedNow: [] };
  }

  const relevantKeys = relevantDefinitions.map((definition) => definition.key);
  const existing = await prisma.userAchievement.findMany({
    where: {
      userId: input.userId,
      achievementKey: { in: relevantKeys },
    },
  });

  const existingByKey = new Map(existing.map((row) => [row.achievementKey, row]));
  const aggregates = await computeUserAggregates(input.userId);
  const unlockedNow: string[] = [];

  for (const definition of relevantDefinitions) {
    const computedProgress = computeProgress(definition.key, aggregates, definition.maxProgress);
    const existingRecord = existingByKey.get(definition.key);

    // Always use the live count so deleted saves/edited seasons are reflected.
    const nextProgress = computedProgress;

    const shouldUnlock = nextProgress >= definition.maxProgress;
    const unlockedAt = existingRecord?.unlockedAt ?? (shouldUnlock ? (input.eventTimestamp ?? new Date()) : null);
    const pointsAwarded = unlockedAt ? definition.points : 0;

    if (!existingRecord?.unlockedAt && unlockedAt) {
      unlockedNow.push(definition.key);
    }

    const sourceMetadata: Prisma.InputJsonValue = {
      eventType: input.eventType,
      eventTimestamp: (input.eventTimestamp ?? new Date()).toISOString(),
      saveId: input.saveId ?? null,
      gameId: input.gameId ?? null,
      evaluateAll: !!input.evaluateAll,
    };

    await prisma.userAchievement.upsert({
      where: {
        userId_achievementKey: {
          userId: input.userId,
          achievementKey: definition.key,
        },
      },
      update: {
        progress: nextProgress,
        unlockedAt,
        pointsAwarded,
        gameId: input.gameId ?? existingRecord?.gameId ?? null,
        saveId: input.saveId ?? existingRecord?.saveId ?? null,
        sourceMetadata,
      },
      create: {
        userId: input.userId,
        achievementKey: definition.key,
        progress: nextProgress,
        unlockedAt,
        pointsAwarded,
        gameId: input.gameId ?? null,
        saveId: input.saveId ?? null,
        sourceMetadata,
      },
    });
  }

  return {
    evaluatedCount: relevantDefinitions.length,
    unlockedNow,
  };
}

function computeProgress(key: string, aggregates: UserAggregates, maxProgress: number): number {
  if (key === 'quickwin.first_save') return Math.min(aggregates.activeSaves, maxProgress);
  if (key === 'quickwin.first_challenge_started') return Math.min(aggregates.startedChallenges, maxProgress);
  if (key === 'quickwin.first_season_logged') return Math.min(aggregates.totalSeasons, maxProgress);
  if (key.startsWith('trophies.')) return Math.min(aggregates.totalTrophies, maxProgress);
  if (key.startsWith('promotions.')) return Math.min(aggregates.totalPromotions, maxProgress);
  if (key.startsWith('challenges.')) return Math.min(aggregates.completedChallenges, maxProgress);
  if (key.startsWith('career.')) return Math.min(aggregates.distinctClubsManaged, maxProgress);
  if (key.startsWith('seasons.')) return Math.min(aggregates.totalSeasons, maxProgress);
  return 0;
}

async function computeUserAggregates(userId: string): Promise<UserAggregates> {
  const [totalTrophies, totalPromotions, completedChallenges, startedChallenges, activeSaves, totalSeasons, distinctClubs] = await Promise.all([
    prisma.trophy.count({ where: { save: { userId } } }),
    prisma.leagueResult.count({ where: { promoted: true, season: { save: { userId } } } }),
    prisma.challengeRun.count({ where: { userId, completedAt: { not: null } } }),
    prisma.challengeRun.count({ where: { userId } }),
    prisma.save.count({ where: { userId } }),
    prisma.season.count({ where: { save: { userId } } }),
    prisma.careerStint.groupBy({
      by: ['teamId'],
      where: { save: { userId } },
    }),
  ]);

  return {
    totalTrophies,
    totalPromotions,
    completedChallenges,
    startedChallenges,
    activeSaves,
    totalSeasons,
    distinctClubsManaged: distinctClubs.length,
  };
}
