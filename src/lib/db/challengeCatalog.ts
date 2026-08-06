import { Prisma } from '../../../prisma/generated/client';
import { prisma } from './prisma';
import { CHALLENGE_CATALOG } from '../challenges/catalog';

type CompetitionKey =
  | 'uefa.champions-league'
  | 'uefa.europa-league'
  | 'uefa.conference-league';

type SeedChallengeCatalogResult = {
  definitionsCreated: number;
  definitionsUpdated: number;
  definitionsDeleted: number;
  definitionsArchived: number;
  definitionDeleteSkipped: number;
  goalsUpserted: number;
  rulesCreated: number;
  staleGoalsDeleted: number;
  staleGoalDeleteSkipped: number;
};

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0 && !Number.isNaN(Number(value))) return Number(value);
  return null;
}

function readCompetitionKey(value: unknown): CompetitionKey | null {
  if (typeof value !== 'string' || value.trim().length === 0) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'uefa.champions-league') return normalized;
  if (normalized === 'uefa.europa-league') return normalized;
  if (normalized === 'uefa.conference-league') return normalized;
  return null;
}

async function resolveCompetitionIdByKey(
  tx: Prisma.TransactionClient,
  competitionKey: CompetitionKey
): Promise<number | null> {
  const byKeySearch = {
    'uefa.champions-league': {
      family: 'champions',
      displayName: 'champions league',
      exactNames: ['UEFA Champions League', 'Champions League'],
    },
    'uefa.europa-league': {
      family: 'europa',
      displayName: 'europa league',
      exactNames: ['UEFA Europa League', 'Europa League'],
    },
    'uefa.conference-league': {
      family: 'conference',
      displayName: 'conference league',
      exactNames: ['UEFA Europa Conference League', 'Europa Conference League', 'UEFA Conference League'],
    },
  } as const;

  const search = byKeySearch[competitionKey];

  for (const exactName of search.exactNames) {
    const exactPreferredMatch = await tx.competitionGroup.findFirst({
      where: {
        isActive: true,
        countryCode: 'EUR',
        OR: [
          {
            displayName: {
              equals: exactName,
              mode: 'insensitive',
            },
          },
          {
            name: {
              equals: exactName,
              mode: 'insensitive',
            },
          },
        ],
      },
      orderBy: [{ id: 'asc' }],
      select: { id: true },
    });

    if (exactPreferredMatch) return exactPreferredMatch.id;

    const exactGlobalMatch = await tx.competitionGroup.findFirst({
      where: {
        OR: [
          {
            displayName: {
              equals: exactName,
              mode: 'insensitive',
            },
          },
          {
            name: {
              equals: exactName,
              mode: 'insensitive',
            },
          },
        ],
      },
      orderBy: [{ isActive: 'desc' }, { id: 'asc' }],
      select: { id: true },
    });

    if (exactGlobalMatch) return exactGlobalMatch.id;
  }

  const strictMatch = await tx.competitionGroup.findFirst({
    where: {
      isActive: true,
      countryCode: 'EUR',
      OR: [
        {
          displayName: {
            contains: search.displayName,
            mode: 'insensitive',
          },
        },
        {
          name: {
            contains: search.displayName,
            mode: 'insensitive',
          },
        },
      ],
    },
    orderBy: [{ id: 'asc' }],
    select: { id: true },
  });

  if (strictMatch) return strictMatch.id;

  const fallbackMatch = await tx.competitionGroup.findFirst({
    where: {
      isActive: true,
      countryCode: 'EUR',
      OR: [
        {
          displayName: {
            contains: search.family,
            mode: 'insensitive',
          },
        },
        {
          name: {
            contains: search.family,
            mode: 'insensitive',
          },
        },
      ],
    },
    orderBy: [{ id: 'asc' }],
    select: { id: true },
  });

  if (fallbackMatch) return fallbackMatch.id;

  const fallbackGlobalMatch = await tx.competitionGroup.findFirst({
    where: {
      OR: [
        {
          displayName: {
            contains: search.family,
            mode: 'insensitive',
          },
        },
        {
          name: {
            contains: search.family,
            mode: 'insensitive',
          },
        },
      ],
    },
    orderBy: [{ isActive: 'desc' }, { id: 'asc' }],
    select: { id: true },
  });

  return fallbackGlobalMatch?.id ?? null;
}

async function resolveRuleConfig(
  tx: Prisma.TransactionClient,
  kind: string,
  rawConfig: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const normalizedKind = kind.toLowerCase();
  if (normalizedKind !== 'competition.equals') return rawConfig;

  const directCompetitionId = readNumber(rawConfig.competitionId) ?? readNumber(rawConfig.competitionGroupId);
  if (directCompetitionId !== null) {
    const existingCompetition = await tx.competitionGroup.findUnique({
      where: { id: directCompetitionId },
      select: { id: true },
    });
    if (!existingCompetition) {
      throw new Error(`Challenge rule references missing CompetitionGroup.id=${directCompetitionId} for kind=${kind}`);
    }
    return {
      ...rawConfig,
      competitionId: directCompetitionId,
    };
  }

  const competitionKey = readCompetitionKey(rawConfig.competitionKey);
  if (!competitionKey) {
    throw new Error(`competition.equals rule requires competitionId or competitionKey. Received config=${JSON.stringify(rawConfig)}`);
  }

  const resolvedId = await resolveCompetitionIdByKey(tx, competitionKey);
  if (resolvedId === null) {
    throw new Error(`Unable to resolve competitionKey=${competitionKey} to CompetitionGroup.id`);
  }

  return {
    ...rawConfig,
    competitionId: resolvedId,
    resolvedFromKey: competitionKey,
  };
}

export async function seedChallengeCatalog(): Promise<SeedChallengeCatalogResult> {
  const result: SeedChallengeCatalogResult = {
    definitionsCreated: 0,
    definitionsUpdated: 0,
    definitionsDeleted: 0,
    definitionsArchived: 0,
    definitionDeleteSkipped: 0,
    goalsUpserted: 0,
    rulesCreated: 0,
    staleGoalsDeleted: 0,
    staleGoalDeleteSkipped: 0,
  };

  await prisma.$transaction(async (tx) => {
    const catalogKeys = new Set(CHALLENGE_CATALOG.map((item) => item.key));

    for (const definition of CHALLENGE_CATALOG) {
      const normalizedStatus = definition.status ?? 'PUBLISHED';

      const existing = await tx.challengeDefinition.findUnique({
        where: { key: definition.key },
        select: { id: true },
      });

      const persistedDefinition = await tx.challengeDefinition.upsert({
        where: { key: definition.key },
        update: {
          title: definition.title,
          description: definition.description,
          summary: definition.summary ?? null,
          status: normalizedStatus,
          sortOrder: definition.sortOrder,
          tags: definition.tags ?? [],
          metadata: definition.metadata ? (definition.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
          publishedAt: normalizedStatus === 'PUBLISHED' ? new Date() : null,
        },
        create: {
          key: definition.key,
          title: definition.title,
          description: definition.description,
          summary: definition.summary ?? null,
          status: normalizedStatus,
          sortOrder: definition.sortOrder,
          tags: definition.tags ?? [],
          metadata: definition.metadata ? (definition.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
          publishedAt: normalizedStatus === 'PUBLISHED' ? new Date() : null,
        },
      });

      if (existing) result.definitionsUpdated += 1;
      else result.definitionsCreated += 1;

      const definitionHasRuns = (await tx.challengeRun.count({
        where: { challengeDefinitionId: persistedDefinition.id },
      })) > 0;

      const activePositions = new Set<number>();

      for (const goal of definition.goals) {
        activePositions.add(goal.position);

        const persistedGoal = await tx.challengeGoal.upsert({
          where: {
            challengeDefinitionId_position: {
              challengeDefinitionId: persistedDefinition.id,
              position: goal.position,
            },
          },
          update: {
            title: goal.title ?? null,
            description: goal.description,
            logic: goal.logic ?? 'ALL',
            metadata: goal.metadata ? (goal.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
          },
          create: {
            challengeDefinitionId: persistedDefinition.id,
            position: goal.position,
            title: goal.title ?? null,
            description: goal.description,
            logic: goal.logic ?? 'ALL',
            metadata: goal.metadata ? (goal.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
          },
          select: { id: true },
        });

        result.goalsUpserted += 1;

        await tx.challengeRule.deleteMany({ where: { challengeGoalId: persistedGoal.id } });

        for (const rule of goal.rules) {
          const resolvedRuleConfig = await resolveRuleConfig(
            tx,
            rule.kind,
            rule.config as Record<string, unknown>
          );

          await tx.challengeRule.create({
            data: {
              challengeGoalId: persistedGoal.id,
              kind: rule.kind,
              subjectType: rule.subjectType ?? null,
              operator: rule.operator,
              config: resolvedRuleConfig as Prisma.InputJsonValue,
              weight: rule.weight ?? 1,
            },
          });

          result.rulesCreated += 1;
        }
      }

      const staleGoals = await tx.challengeGoal.findMany({
        where: {
          challengeDefinitionId: persistedDefinition.id,
          position: { notIn: [...activePositions] },
        },
        select: { id: true },
      });

      if (staleGoals.length === 0) continue;

      if (definitionHasRuns) {
        result.staleGoalDeleteSkipped += staleGoals.length;
        continue;
      }

      await tx.challengeGoal.deleteMany({
        where: {
          challengeDefinitionId: persistedDefinition.id,
          position: { notIn: [...activePositions] },
        },
      });

      result.staleGoalsDeleted += staleGoals.length;
    }

    const definitionsRemovedFromCatalog = await tx.challengeDefinition.findMany({
      where: {
        key: { notIn: [...catalogKeys] },
      },
      select: {
        id: true,
        key: true,
      },
    });

    for (const removedDefinition of definitionsRemovedFromCatalog) {
      const hasRuns = (await tx.challengeRun.count({
        where: { challengeDefinitionId: removedDefinition.id },
      })) > 0;

      if (hasRuns) {
        await tx.challengeDefinition.update({
          where: { id: removedDefinition.id },
          data: {
            status: 'HIDDEN',
            archivedAt: new Date(),
            publishedAt: null,
          },
        });
        result.definitionsArchived += 1;
        result.definitionDeleteSkipped += 1;
        continue;
      }

      await tx.challengeDefinition.delete({
        where: { id: removedDefinition.id },
      });
      result.definitionsDeleted += 1;
    }
  });

  return result;
}
