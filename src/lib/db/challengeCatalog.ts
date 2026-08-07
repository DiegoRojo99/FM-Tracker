import { Prisma } from '../../../prisma/generated/client';
import { prisma } from './prisma';
import { CHALLENGE_CATALOG } from '../challenges/catalog';

type CompetitionKey =
  | 'uefa.champions-league'
  | 'uefa.europa-league'
  | 'uefa.conference-league'
  | 'conmebol.libertadores'
  | 'concacaf.champions-cup'
  | 'caf.champions-league'
  | 'afc.champions-league'
  | 'ofc.champions-league'
  | 'spain.laliga'
  | 'england.premier-league'
  | 'switzerland.super-league';

type TeamKey =
  | 'redbull.salzburg'
  | 'redbull.leipzig'
  | 'redbull.new-york-red-bulls'
  | 'redbull.bragantino'
  | 'city.manchester-city'
  | 'city.girona'
  | 'city.new-york-city'
  | 'city.melbourne-city'
  | 'city.troyes'
  | 'vaduz'
  | 'blueco.chelsea'
  | 'blueco.strasbourg'
  | 'nottingham-forest'
  | 'arsenal'
  | 'atletico-madrid'
  | 'roma'
  | 'benfica'
  | 'ajax'
  | 'celtic'
  | 'fulham'
  | 'freiburg'
  | 'brighton'
  | 'union-berlin'
  | 'watford'
  | 'cd-maldonado'
  | 'fc-andorra'
  | 'ad-ceuta'
  | 'cardiff-city'
  | 'swansea-city'
  | 'wrexham';

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
  if (normalized === 'conmebol.libertadores') return normalized;
  if (normalized === 'concacaf.champions-cup') return normalized;
  if (normalized === 'caf.champions-league') return normalized;
  if (normalized === 'afc.champions-league') return normalized;
  if (normalized === 'ofc.champions-league') return normalized;
  if (normalized === 'spain.laliga') return normalized;
  if (normalized === 'england.premier-league') return normalized;
  if (normalized === 'switzerland.super-league') return normalized;
  return null;
}

function readTeamKey(value: unknown): TeamKey | null {
  if (typeof value !== 'string' || value.trim().length === 0) return null;
  const normalized = value.trim().toLowerCase();

  if (normalized === 'redbull.salzburg') return normalized;
  if (normalized === 'redbull.leipzig') return normalized;
  if (normalized === 'redbull.new-york-red-bulls') return normalized;
  if (normalized === 'redbull.bragantino') return normalized;
  if (normalized === 'city.manchester-city') return normalized;
  if (normalized === 'city.girona') return normalized;
  if (normalized === 'city.new-york-city') return normalized;
  if (normalized === 'city.melbourne-city') return normalized;
  if (normalized === 'city.troyes') return normalized;
  if (normalized === 'vaduz') return normalized;
  if (normalized === 'blueco.chelsea') return normalized;
  if (normalized === 'blueco.strasbourg') return normalized;
  if (normalized === 'nottingham-forest') return normalized;
  if (normalized === 'arsenal') return normalized;
  if (normalized === 'atletico-madrid') return normalized;
  if (normalized === 'roma') return normalized;
  if (normalized === 'benfica') return normalized;
  if (normalized === 'ajax') return normalized;
  if (normalized === 'celtic') return normalized;
  if (normalized === 'fulham') return normalized;
  if (normalized === 'freiburg') return normalized;
  if (normalized === 'brighton') return normalized;
  if (normalized === 'union-berlin') return normalized;
  if (normalized === 'watford') return normalized;
  if (normalized === 'cd-maldonado') return normalized;
  if (normalized === 'fc-andorra') return normalized;
  if (normalized === 'ad-ceuta') return normalized;
  if (normalized === 'cardiff-city') return normalized;
  if (normalized === 'swansea-city') return normalized;
  if (normalized === 'wrexham') return normalized;

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
    'conmebol.libertadores': {
      family: 'libertadores',
      displayName: 'libertadores',
      exactNames: ['CONMEBOL Copa Libertadores', 'Copa Libertadores', 'Libertadores'],
    },
    'concacaf.champions-cup': {
      family: 'concacaf',
      displayName: 'champions cup',
      exactNames: ['CONCACAF Champions Cup', 'CONCACAF Champions League', 'Champions Cup'],
    },
    'caf.champions-league': {
      family: 'caf',
      displayName: 'champions league',
      exactNames: ['CAF Champions League'],
    },
    'afc.champions-league': {
      family: 'afc',
      displayName: 'champions league',
      exactNames: ['AFC Champions League Elite', 'AFC Champions League'],
    },
    'ofc.champions-league': {
      family: 'ofc',
      displayName: 'champions league',
      exactNames: ['OFC Champions League'],
    },
    'spain.laliga': {
      family: 'liga',
      displayName: 'liga',
      exactNames: ['LaLiga', 'Primera Division', 'Primera División', 'Spanish First Division'],
    },
    'england.premier-league': {
      family: 'premier',
      displayName: 'premier league',
      exactNames: ['Premier League', 'English Premier Division'],
    },
    'switzerland.super-league': {
      family: 'super league',
      displayName: 'super league',
      exactNames: ['Swiss Super League', 'Raiffeisen Super League'],
    },
  } as const;

  const search = byKeySearch[competitionKey];

  for (const exactName of search.exactNames) {
    const exactPreferredMatch = await tx.competitionGroup.findFirst({
      where: {
        isActive: true,
        countryCode:
          competitionKey === 'spain.laliga'
            ? { in: ['ESP', 'ES'] }
            : competitionKey === 'england.premier-league'
              ? { in: ['GB-ENG', 'ENG', 'GBR', 'UK'] }
              : competitionKey === 'switzerland.super-league'
                ? { in: ['CHE', 'CH', 'SUI'] }
                : 'EUR',
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
      countryCode:
        competitionKey === 'spain.laliga'
          ? { in: ['ESP', 'ES'] }
          : competitionKey === 'england.premier-league'
            ? { in: ['GB-ENG', 'ENG', 'GBR', 'UK'] }
            : competitionKey === 'switzerland.super-league'
              ? { in: ['CHE', 'CH', 'SUI'] }
              : 'EUR',
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
      countryCode:
        competitionKey === 'spain.laliga'
          ? { in: ['ESP', 'ES'] }
          : competitionKey === 'england.premier-league'
            ? { in: ['GB-ENG', 'ENG', 'GBR', 'UK'] }
            : competitionKey === 'switzerland.super-league'
              ? { in: ['CHE', 'CH', 'SUI'] }
              : 'EUR',
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
  if (normalizedKind === 'competition.equals') {
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

  if (normalizedKind === 'team.in') {
    const teamKey = readTeamKey(rawConfig.teamKey);
    if (!teamKey) return rawConfig;

    const teamLookup = {
      'redbull.salzburg': { names: ['Red Bull Salzburg', 'FC Red Bull Salzburg', 'RB Salzburg', 'Salzburg'], countryCodes: ['AUT', 'AT'] },
      'redbull.leipzig': { names: ['RB Leipzig', 'RasenBallsport Leipzig', 'Leipzig'], countryCodes: ['DEU', 'DE'] },
      'redbull.new-york-red-bulls': { names: ['New York Red Bulls', 'NY Red Bulls', 'New York RB'], countryCodes: ['USA', 'US'] },
      'redbull.bragantino': { names: ['Red Bull Bragantino', 'RB Bragantino', 'Bragantino'], countryCodes: ['BRA', 'BR'] },
      'city.manchester-city': { names: ['Manchester City', 'Man City'], countryCodes: ['ENG', 'GBR', 'UK'] },
      'city.girona': { names: ['Girona', 'Girona FC'], countryCodes: ['ESP', 'ES'] },
      'city.new-york-city': { names: ['New York City', 'New York City FC', 'NYCFC'], countryCodes: ['USA', 'US'] },
      'city.melbourne-city': { names: ['Melbourne City', 'Melbourne City FC'], countryCodes: ['AUS', 'AU'] },
      'city.troyes': { names: ['Troyes', 'ESTAC Troyes', 'ES Troyes AC'], countryCodes: ['FRA', 'FR'] },
      'vaduz': { names: ['Vaduz', 'FC Vaduz'], countryCodes: ['LIE', 'LI', 'CHE', 'CH'] },
      'blueco.chelsea': { names: ['Chelsea', 'Chelsea FC'], countryCodes: ['ENG', 'GBR', 'UK'] },
      'blueco.strasbourg': { names: ['Strasbourg', 'RC Strasbourg', 'RC Strasbourg Alsace'], countryCodes: ['FRA', 'FR'] },
      'nottingham-forest': { names: ['Nottingham Forest', 'Nottingham Forest FC'], countryCodes: ['GB-ENG', 'ENG', 'GBR', 'UK'] },
      'arsenal': { names: ['Arsenal', 'Arsenal FC'], countryCodes: ['GB-ENG', 'ENG', 'GBR', 'UK'] },
      'atletico-madrid': { names: ['Atletico Madrid', 'Atlético Madrid', 'Club Atletico de Madrid'], countryCodes: ['ES', 'ESP'] },
      'roma': { names: ['Roma', 'AS Roma', 'A.S. Roma'], countryCodes: ['IT', 'ITA'] },
      'benfica': { names: ['Benfica', 'SL Benfica', 'Sport Lisboa e Benfica'], countryCodes: ['PT', 'PRT'] },
      'ajax': { names: ['Ajax', 'AFC Ajax', 'Ajax Amsterdam'], countryCodes: ['NL', 'NLD'] },
      'celtic': { names: ['Celtic', 'Celtic FC'], countryCodes: ['GB-SCT', 'SCO', 'GBR', 'UK'] },
      'fulham': { names: ['Fulham', 'Fulham FC'], countryCodes: ['GB-ENG', 'ENG', 'GBR', 'UK'] },
      'freiburg': { names: ['Freiburg', 'SC Freiburg'], countryCodes: ['DEU', 'DE'] },
      'brighton': { names: ['Brighton', 'Brighton & Hove Albion', 'Brighton and Hove Albion', 'Brighton & Hove Albion FC'], countryCodes: ['GB-ENG', 'ENG', 'GBR', 'UK'] },
      'union-berlin': { names: ['Union Berlin', '1. FC Union Berlin', 'FC Union Berlin'], countryCodes: ['DEU', 'DE'] },
      'watford': { names: ['Watford', 'Watford FC'], countryCodes: ['GB-ENG', 'ENG', 'GBR', 'UK'] },
      'cd-maldonado': { names: ['CD Maldonado', 'Deportivo Maldonado', 'Club Deportivo Maldonado'], countryCodes: ['URY', 'UY'] },
      'fc-andorra': { names: ['FC Andorra', 'F.C. Andorra', 'Andorra FC', 'Andorra'], countryCodes: ['AND', 'AD', 'ESP', 'ES'] },
      'ad-ceuta': { names: ['AD Ceuta FC', 'AD Ceuta', 'Ceuta FC', 'Ceuta'], countryCodes: ['ESP', 'ES'] },
      'cardiff-city': { names: ['Cardiff City', 'Cardiff City FC', 'Cardiff'], countryCodes: ['GB-WLS', 'WAL', 'GBR', 'UK', 'GB-ENG', 'ENG'] },
      'swansea-city': { names: ['Swansea City', 'Swansea City AFC', 'Swansea'], countryCodes: ['GB-WLS', 'WAL', 'GBR', 'UK', 'GB-ENG', 'ENG'] },
      'wrexham': { names: ['Wrexham', 'Wrexham AFC', 'Wrexham A.F.C.'], countryCodes: ['GB-WLS', 'WAL', 'GBR', 'UK', 'GB-ENG', 'ENG'] },
    } as const;

    const search = teamLookup[teamKey];

    for (const exactName of search.names) {
      const exactMatch = await tx.team.findFirst({
        where: {
          countryCode: { in: [...search.countryCodes] },
          name: {
            equals: exactName,
            mode: 'insensitive',
          },
        },
        orderBy: [{ id: 'asc' }],
        select: { id: true },
      });

      if (exactMatch) {
        return {
          ...rawConfig,
          teamIds: [exactMatch.id],
          resolvedFromKey: teamKey,
        };
      }
    }

    const fallbackMatch = await tx.team.findFirst({
      where: {
        countryCode: { in: [...search.countryCodes] },
        OR: search.names.map((name) => ({
          name: {
            contains: name,
            mode: 'insensitive' as const,
          },
        })),
      },
      orderBy: [{ id: 'asc' }],
      select: { id: true },
    });

    if (fallbackMatch) {
      return {
        ...rawConfig,
        teamIds: [fallbackMatch.id],
        resolvedFromKey: teamKey,
      };
    }

    // Final fallback without country filter in case imported country codes differ.
    const globalFallbackMatch = await tx.team.findFirst({
      where: {
        OR: search.names.map((name) => ({
          name: {
            contains: name,
            mode: 'insensitive' as const,
          },
        })),
      },
      orderBy: [{ id: 'asc' }],
      select: { id: true },
    });

    if (!globalFallbackMatch) {
      throw new Error(`Unable to resolve teamKey=${teamKey} to Team.id`);
    }

    return {
      ...rawConfig,
      teamIds: [globalFallbackMatch.id],
      resolvedFromKey: teamKey,
    };
  }

  return rawConfig;
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
  }, {
    maxWait: 10_000,
    timeout: 60_000,
  });

  return result;
}
