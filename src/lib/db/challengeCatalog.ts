import { Prisma } from '../../../prisma/generated/client';
import { prisma } from './prisma';
import { CHALLENGE_CATALOG } from '../challenges/catalog';

type SeedChallengeCatalogResult = {
  definitionsCreated: number;
  definitionsUpdated: number;
  goalsUpserted: number;
  rulesCreated: number;
  staleGoalsDeleted: number;
  staleGoalDeleteSkipped: number;
};

export async function seedChallengeCatalog(): Promise<SeedChallengeCatalogResult> {
  const result: SeedChallengeCatalogResult = {
    definitionsCreated: 0,
    definitionsUpdated: 0,
    goalsUpserted: 0,
    rulesCreated: 0,
    staleGoalsDeleted: 0,
    staleGoalDeleteSkipped: 0,
  };

  await prisma.$transaction(async (tx) => {
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
          await tx.challengeRule.create({
            data: {
              challengeGoalId: persistedGoal.id,
              kind: rule.kind,
              subjectType: rule.subjectType ?? null,
              operator: rule.operator,
              config: rule.config as Prisma.InputJsonValue,
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
  });

  return result;
}
