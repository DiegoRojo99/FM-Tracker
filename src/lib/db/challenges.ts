import { prisma } from './prisma';
import { getTrophiesForSave } from './trophies';
import { dedupeTrophiesForChallengeEvaluation } from '../challenges/progression';
import { challengeGoalToCareerChallengeGoal } from '../dto/challenges';
import { evaluateAchievementsForUser } from './achievements';
import { Prisma } from '../../../prisma/generated/client';
import type {
  ChallengeGoalWithDetails,
  ChallengeGoalTeamLink,
  ChallengeWithGoals,
  CareerChallenge,
  CareerChallengeGoalInput,
  CareerChallengeWithDetails,
  CareerChallengeWithSaveDetails,
} from '../types/prisma/Challenge';
import type {
  ChallengeDefinition,
  ChallengeGoal,
  ChallengeRun,
  ChallengeRunGoal,
  ChallengeRule,
  CompetitionGroup,
  Country,
  Game,
  Save,
  Team,
  Trophy,
} from '../../../prisma/generated/client';

type TrophyMatchContext = {
  competitionNameById: Map<number, string>;
  competitionCountryById: Map<number, string>;
  teamCountryById: Map<number, string>;
};

type GoalTargets = {
  competitionId: number | null;
  countryId: string | null;
  teamIds: number[];
};

type ChallengeGoalWithRules = ChallengeGoal & { rules: ChallengeRule[] };

type ChallengeDefinitionWithGoals = ChallengeDefinition & {
  goals: ChallengeGoalWithRules[];
};

type ChallengeRunWithDetails = ChallengeRun & {
  challengeDefinition: ChallengeDefinitionWithGoals;
  runGoals: ChallengeRunGoal[];
  game: Game;
  save: (Save & { currentClub: Team | null }) | null;
};

function extractBonus(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const bonus = (metadata as { bonus?: unknown }).bonus;
  return typeof bonus === 'string' && bonus.length > 0 ? bonus : null;
}

function normalizeCompetitionName(name: string): string {
  return name
    .toLowerCase()
    .replace(/uefa/g, '')
    .replace(/europa\s+conference/g, 'conference')
    .replace(/champions\s+league/g, 'championsleague')
    .replace(/europa\s+league/g, 'europaleague')
    .replace(/conference\s+league/g, 'conferenceleague')
    .replace(/[^a-z0-9]/g, '');
}

function getCompetitionFamily(name: string): 'champions' | 'europa' | 'conference' | null {
  const normalized = normalizeCompetitionName(name);

  if (normalized.includes('championsleague')) return 'champions';
  if (normalized.includes('europaleague')) return 'europa';
  if (normalized.includes('conferenceleague') || normalized.includes('conference')) return 'conference';

  return null;
}

function extractGoalTargets(goal: ChallengeGoalWithRules): GoalTargets {
  const competitionIds = new Set<number>();
  const countryIds = new Set<string>();
  const teamIds = new Set<number>();

  for (const rule of goal.rules) {
    const kind = rule.kind.toLowerCase();
    const config = rule.config as Record<string, unknown>;

    if (kind.includes('competition')) {
      const competitionId = readNumber(config.competitionId) ?? readNumber(config.competitionGroupId) ?? readNumber(config.id);
      if (competitionId !== null) competitionIds.add(competitionId);
    }

    if (kind.includes('country')) {
      const countryId = readString(config.countryId) ?? readString(config.countryCode) ?? readString(config.code);
      if (countryId) countryIds.add(countryId);
    }

    if (kind.includes('team')) {
      const values = readNumberList(config.teamIds) ?? readNumberList(config.teamId) ?? readNumberList(config.ids);
      if (!values) continue;
      for (const teamId of values) teamIds.add(teamId);
    }
  }

  return {
    competitionId: competitionIds.size > 0 ? [...competitionIds][0] : null,
    countryId: countryIds.size > 0 ? [...countryIds][0] : null,
    teamIds: [...teamIds],
  };
}

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0 && !Number.isNaN(Number(value))) return Number(value);
  return null;
}

function readString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) return value;
  return null;
}

function readNumberList(value: unknown): number[] | null {
  if (Array.isArray(value)) {
    const numbers = value.map(readNumber).filter((item): item is number => item !== null);
    return numbers.length > 0 ? numbers : null;
  }

  const singleValue = readNumber(value);
  return singleValue === null ? null : [singleValue];
}

function buildCompetitionMap(competitions: CompetitionGroup[]): Map<number, CompetitionGroup> {
  return new Map(competitions.map((competition) => [competition.id, competition]));
}

function buildCountryMap(countries: Country[]): Map<string, Country> {
  return new Map(countries.map((country) => [country.code, country]));
}

function buildTeamMap(teams: Team[]): Map<number, Team> {
  return new Map(teams.map((team) => [team.id, team]));
}

function buildChallengeGoalDetails(
  goal: ChallengeGoal & { rules: ChallengeRule[] },
  competitionById: Map<number, CompetitionGroup>,
  countryByCode: Map<string, Country>,
  teamById: Map<number, Team>
): ChallengeGoalWithDetails {
  const targets = extractGoalTargets(goal);
  const teams: ChallengeGoalTeamLink[] = targets.teamIds
    .map((teamId) => {
      const team = teamById.get(teamId);
      return team ? { teamId, team } : null;
    })
    .filter((item): item is ChallengeGoalTeamLink => item !== null);

  return {
    ...goal,
    challengeId: goal.challengeDefinitionId,
    competitionId: targets.competitionId,
    countryId: targets.countryId,
    competition: targets.competitionId !== null ? competitionById.get(targets.competitionId) ?? null : null,
    country: targets.countryId !== null ? countryByCode.get(targets.countryId) ?? null : null,
    teams,
  };
}

function buildChallengeWithGoals(
  challenge: ChallengeDefinitionWithGoals,
  competitionById: Map<number, CompetitionGroup>,
  countryByCode: Map<string, Country>,
  teamById: Map<number, Team>
): ChallengeWithGoals {
  return {
    ...challenge,
    name: challenge.title,
    bonus: extractBonus(challenge.metadata),
    goals: challenge.goals
      .slice()
      .sort((left, right) => left.position - right.position)
      .map((goal) => buildChallengeGoalDetails(goal, competitionById, countryByCode, teamById)),
  };
}

async function loadChallengeDefinitions(): Promise<ChallengeDefinitionWithGoals[]> {
  return prisma.challengeDefinition.findMany({
    where: { status: 'PUBLISHED' },
    include: {
      goals: {
        include: {
          rules: true,
        },
        orderBy: { position: 'asc' },
      },
    },
    orderBy: [
      { sortOrder: 'asc' },
      { id: 'asc' },
    ],
  });
}

async function loadChallengeLookups(challenges: ChallengeDefinitionWithGoals[]) {
  const competitionIds = new Set<number>();
  const countryCodes = new Set<string>();
  const teamIds = new Set<number>();

  for (const challenge of challenges) {
    for (const goal of challenge.goals) {
      const targets = extractGoalTargets(goal);
      if (targets.competitionId !== null) competitionIds.add(targets.competitionId);
      if (targets.countryId !== null) countryCodes.add(targets.countryId);
      for (const teamId of targets.teamIds) teamIds.add(teamId);
    }
  }

  const [competitions, countries, teams] = await Promise.all([
    competitionIds.size > 0
      ? prisma.competitionGroup.findMany({
          where: { id: { in: [...competitionIds] } },
        })
      : Promise.resolve([] as CompetitionGroup[]),
    countryCodes.size > 0
      ? prisma.country.findMany({
          where: { code: { in: [...countryCodes] } },
        })
      : Promise.resolve([] as Country[]),
    teamIds.size > 0
      ? prisma.team.findMany({
          where: { id: { in: [...teamIds] } },
        })
      : Promise.resolve([] as Team[]),
  ]);

  return {
    competitionById: buildCompetitionMap(competitions),
    countryByCode: buildCountryMap(countries),
    teamById: buildTeamMap(teams),
  };
}

function mapChallengeDefinition(
  challenge: ChallengeDefinitionWithGoals,
  lookups: Awaited<ReturnType<typeof loadChallengeLookups>>
): ChallengeWithGoals {
  return buildChallengeWithGoals(challenge, lookups.competitionById, lookups.countryByCode, lookups.teamById);
}

async function loadChallengesWithDetails(): Promise<ChallengeWithGoals[]> {
  const challenges = await loadChallengeDefinitions();
  const lookups = await loadChallengeLookups(challenges);
  return challenges.map((challenge) => mapChallengeDefinition(challenge, lookups));
}

function mapRunWithDetails(
  run: ChallengeRunWithDetails,
  challenge: ChallengeWithGoals
): CareerChallengeWithDetails {
  return {
    ...run,
    challengeId: run.challengeDefinitionId,
    challenge,
    goalProgress: run.runGoals,
  };
}

async function loadUserChallengeRuns(userId: string, challengeId?: number): Promise<CareerChallengeWithDetails[]> {
  return loadChallengeRuns({
    userId,
    ...(challengeId !== undefined ? { challengeDefinitionId: challengeId } : {}),
  });
}

async function loadChallengeRuns(where: Prisma.ChallengeRunWhereInput): Promise<CareerChallengeWithDetails[]> {
  const runs = await prisma.challengeRun.findMany({
    where,
    include: {
      challengeDefinition: {
        include: {
          goals: {
            include: { rules: true },
            orderBy: { position: 'asc' },
          },
        },
      },
      runGoals: true,
      game: true,
      save: {
        include: {
          currentClub: true,
        },
      },
    },
    orderBy: { startedAt: 'desc' },
  }) as ChallengeRunWithDetails[];

  const challengeIds = [...new Set(runs.map((run) => run.challengeDefinitionId))];
  const challenges = await prisma.challengeDefinition.findMany({
    where: { id: { in: challengeIds } },
    include: {
      goals: {
        include: { rules: true },
        orderBy: { position: 'asc' },
      },
    },
  });

  const lookups = await loadChallengeLookups(challenges as ChallengeDefinitionWithGoals[]);
  const challengesById = new Map<number, ChallengeWithGoals>(
    challenges.map((challenge) => [challenge.id, mapChallengeDefinition(challenge as ChallengeDefinitionWithGoals, lookups)])
  );

  return runs.map((run) => {
    const challenge = challengesById.get(run.challengeDefinitionId);
    if (!challenge) {
      throw new Error(`Challenge definition ${run.challengeDefinitionId} was not found while loading user runs.`);
    }
    return mapRunWithDetails(run, challenge);
  });
}

export async function getAllChallenges(): Promise<ChallengeWithGoals[]> {
  return loadChallengesWithDetails();
}

export async function getChallengeById(challengeId: number): Promise<ChallengeWithGoals | null> {
  const challenge = await prisma.challengeDefinition.findUnique({
    where: { id: challengeId },
    include: {
      goals: {
        include: { rules: true },
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!challenge) return null;
  if (challenge.status !== 'PUBLISHED') return null;

  const lookups = await loadChallengeLookups([challenge as ChallengeDefinitionWithGoals]);
  return mapChallengeDefinition(challenge as ChallengeDefinitionWithGoals, lookups);
}

export async function getChallengeByKey(challengeKey: string): Promise<ChallengeWithGoals | null> {
  const challenge = await prisma.challengeDefinition.findUnique({
    where: { key: challengeKey },
    include: {
      goals: {
        include: { rules: true },
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!challenge) return null;
  if (challenge.status !== 'PUBLISHED') return null;

  const lookups = await loadChallengeLookups([challenge as ChallengeDefinitionWithGoals]);
  return mapChallengeDefinition(challenge as ChallengeDefinitionWithGoals, lookups);
}

export async function getUserChallenges(userId: string): Promise<CareerChallengeWithDetails[]> {
  return loadUserChallengeRuns(userId);
}

export async function getUserChallengesByChallenge(challengeId: number, userId: string): Promise<CareerChallengeWithSaveDetails[]> {
  return (await loadUserChallengeRuns(userId, challengeId)) as CareerChallengeWithSaveDetails[];
}

export async function getUserChallengesByChallengeKey(challengeKey: string, userId: string): Promise<CareerChallengeWithSaveDetails[]> {
  const challenge = await prisma.challengeDefinition.findUnique({
    where: { key: challengeKey },
    select: { id: true, status: true },
  });

  if (!challenge || challenge.status !== 'PUBLISHED') return [];
  return (await loadUserChallengeRuns(userId, challenge.id)) as CareerChallengeWithSaveDetails[];
}

export async function backfillChallengeProgressForAllSaves(): Promise<{
  savesProcessed: number;
  runsUpdated: number;
  runsCreated: number;
  runsSkipped: number;
}> {
  const challenges = await getAllChallenges();
  if (challenges.length === 0) {
    return {
      savesProcessed: 0,
      runsUpdated: 0,
      runsCreated: 0,
      runsSkipped: 0,
    };
  }

  const saves = await prisma.save.findMany({
    select: {
      id: true,
      userId: true,
      gameId: true,
      trophies: {
        select: {
          id: true,
          competitionGroupId: true,
          teamId: true,
          season: true,
          saveId: true,
          gameId: true,
        },
      },
    },
  });

  let runsUpdated = 0;
  let runsCreated = 0;
  let runsSkipped = 0;

  for (const save of saves) {
    const uniqueTrophies = dedupeTrophiesForChallengeEvaluation(save.trophies as Trophy[]);

    const competitionIds = [...new Set(uniqueTrophies.map((trophy) => trophy.competitionGroupId))];
    const teamIds = [...new Set(uniqueTrophies.map((trophy) => trophy.teamId))];

    const [competitions, teams, existingRuns] = await Promise.all([
      competitionIds.length > 0
        ? prisma.competitionGroup.findMany({
            where: { id: { in: competitionIds } },
            select: { id: true, name: true, countryCode: true },
          })
        : Promise.resolve([] as Array<{ id: number; name: string; countryCode: string | null }>),
      teamIds.length > 0
        ? prisma.team.findMany({
            where: { id: { in: teamIds } },
            select: { id: true, countryCode: true },
          })
        : Promise.resolve([] as Array<{ id: number; countryCode: string }>),
      prisma.challengeRun.findMany({
        where: { saveId: save.id },
        select: { id: true, challengeDefinitionId: true },
      }),
    ]);

    const context: TrophyMatchContext = {
      competitionNameById: new Map(competitions.map((competition) => [competition.id, competition.name])),
      competitionCountryById: new Map(
        competitions
          .filter((competition): competition is typeof competition & { countryCode: string } => !!competition.countryCode)
          .map((competition) => [competition.id, competition.countryCode])
      ),
      teamCountryById: new Map(
        teams
          .filter((team): team is typeof team & { countryCode: string } => !!team.countryCode)
          .map((team) => [team.id, team.countryCode])
      ),
    };

    const existingChallengeIds = new Set(existingRuns.map((run) => run.challengeDefinitionId));

    for (const challenge of challenges) {
      const goalProgress = filterCompletedChallengeGoalsBasedOnTrophies(
        challenge,
        uniqueTrophies,
        context
      );

      const hasProgress = goalProgress.some((goal) => goal.isComplete);
      const hasExistingRun = existingChallengeIds.has(challenge.id);

      if (!hasProgress && !hasExistingRun) {
        runsSkipped += 1;
        continue;
      }

      await upsertCareerChallenge(save.userId, save.id, save.gameId, challenge.id, goalProgress);

      if (hasExistingRun) runsUpdated += 1;
      else runsCreated += 1;
    }
  }

  return {
    savesProcessed: saves.length,
    runsUpdated,
    runsCreated,
    runsSkipped,
  };
}

export async function getDetailedChallengesForSave(saveId: string): Promise<CareerChallengeWithDetails[]> {
  return loadChallengeRuns({ saveId });
}

export async function getDetailedChallengesForSaves(saveIds: string[]): Promise<Map<string, CareerChallengeWithDetails[]>> {
  if (saveIds.length === 0) return new Map();

  const runs = await loadChallengeRuns({ saveId: { in: saveIds } });
  const grouped = new Map<string, CareerChallengeWithDetails[]>();

  for (const run of runs) {
    const existing = grouped.get(run.saveId) ?? [];
    existing.push(run);
    grouped.set(run.saveId, existing);
  }

  return grouped;
}

// Keep the old function name for backward compatibility, but now it reads challenge runs.
export async function getUserChallengeById(challengeId: number, userId: string): Promise<CareerChallengeWithDetails | null> {
  const challenges = await loadUserChallengeRuns(userId, challengeId);
  return challenges[0] ?? null;
}

export async function getTeamMatchingChallenges(teamId: number) {
  const challenges = await getAllChallenges();
  return challenges.filter((challenge) =>
    challenge.goals.some((goal) => goal.teams.some((team) => team.teamId === teamId))
  );
}

export async function getCountryMatchingChallenges(countryCode: string | undefined) {
  if (!countryCode) return [];
  const challenges = await getAllChallenges();
  return challenges.filter((challenge) =>
    challenge.goals.some((goal) => goal.country?.code === countryCode)
  );
}

export async function getCompetitionMatchingChallenges(competitionId: number) {
  const challenges = await getAllChallenges();
  return challenges.filter((challenge) =>
    challenge.goals.some((goal) => goal.competition?.id === competitionId)
  );
}

export async function getChallengesForSave(saveId: string): Promise<CareerChallenge[]> {
  return prisma.challengeRun.findMany({
    where: { saveId },
  });
}

export async function checkForMatchingChallenges(trophyData: Trophy, context: TrophyMatchContext) {
  const allChallenges = await getAllChallenges();
  return allChallenges.filter((challenge) => challenge.goals.some((goal) => filterGoalByTrophy(goal, trophyData, context)));
}

/* Checks for matching challenges and adds them to the user's save */
export async function addChallengeForTrophy(
  uid: string,
  saveId: string,
  trophyData: Trophy
): Promise<void> {
  const saveTrophies = await getTrophiesForSave(saveId);
  if (!saveTrophies.includes(trophyData)) saveTrophies.push(trophyData);

  const uniqueTrophies = dedupeTrophiesForChallengeEvaluation([...saveTrophies, trophyData]);
  const competitionIds = [...new Set(uniqueTrophies.map((trophy) => trophy.competitionGroupId))];
  const teamIds = [...new Set(uniqueTrophies.map((trophy) => trophy.teamId))];

  const [competitions, teams] = await Promise.all([
    prisma.competitionGroup.findMany({
      where: { id: { in: competitionIds } },
      select: { id: true, name: true, countryCode: true },
    }),
    prisma.team.findMany({
      where: { id: { in: teamIds } },
      select: { id: true, countryCode: true },
    }),
  ]);

  const context: TrophyMatchContext = {
    competitionNameById: new Map(competitions.map((competition) => [competition.id, competition.name])),
    competitionCountryById: new Map(
      competitions
        .filter((competition): competition is typeof competition & { countryCode: string } => !!competition.countryCode)
        .map((competition) => [competition.id, competition.countryCode])
    ),
    teamCountryById: new Map(
      teams
        .filter((team): team is typeof team & { countryCode: string } => !!team.countryCode)
        .map((team) => [team.id, team.countryCode])
    ),
  };

  const matchingChallenges = await checkForMatchingChallenges(trophyData, context);

  for (const challenge of matchingChallenges) {
    const processedGoals: CareerChallengeGoalInput[] = filterCompletedChallengeGoalsBasedOnTrophies(
      challenge,
      uniqueTrophies,
      context
    );

    await upsertCareerChallenge(uid, saveId, trophyData.gameId, challenge.id, processedGoals);
  }
}

export async function addChallengeForTeam(
  saveId: string,
  teamId: number
): Promise<void> {
  const matchingChallenges = await getTeamMatchingChallenges(teamId);
  await addNewEmptyCareerChallenges(saveId, matchingChallenges);
}

export async function addChallengeForCountry(
  saveId: string,
  countryCode: string
): Promise<void> {
  const matchingChallenges = await getCountryMatchingChallenges(countryCode);
  await addNewEmptyCareerChallenges(saveId, matchingChallenges);
}

export async function addNewEmptyCareerChallenges(
  saveId: string,
  challenges: ChallengeWithGoals[]
): Promise<void> {
  const save = await prisma.save.findUnique({
    where: { id: saveId },
    select: { id: true, userId: true, gameId: true },
  });
  if (!save) return;

  const userChallenges = await getChallengesForSave(saveId);
  const nonExistingChallenges = challenges.filter((challenge) =>
    !userChallenges.some((careerChallenge) => careerChallenge.challengeDefinitionId === challenge.id)
  );

  for (const challenge of nonExistingChallenges) {
    await upsertCareerChallenge(
      save.userId,
      save.id,
      save.gameId,
      challenge.id,
      challenge.goals.map((goal) => challengeGoalToCareerChallengeGoal({ goal, isCompleted: false }))
    );
  }
}

export async function upsertCareerChallenge(
  uid: string,
  saveId: string,
  gameId: string,
  challengeId: number,
  goalProgress: CareerChallengeGoalInput[]
): Promise<CareerChallengeWithDetails> {
  const completedAt = goalProgress.length > 0 && goalProgress.every((goal) => goal.isComplete) ? new Date() : null;
  const runStatus = completedAt ? 'COMPLETED' as const : 'ACTIVE' as const;
  const progressSnapshot = {
    completedGoals: goalProgress.filter((goal) => goal.isComplete).length,
    totalGoals: goalProgress.length,
  };

  const userChallenge = {
    userId: uid,
    challengeDefinitionId: challengeId,
    gameId,
    saveId,
    startedAt: new Date(),
    completedAt,
    status: runStatus,
    progressSnapshot: progressSnapshot as Prisma.InputJsonValue,
    metadata: Prisma.JsonNull,
  };

  const existingChallenge = await prisma.challengeRun.findFirst({
    where: {
      userId: userChallenge.userId,
      saveId: userChallenge.saveId,
      challengeDefinitionId: userChallenge.challengeDefinitionId,
    },
  });

  let savedChallenge: ChallengeRun;
  if (existingChallenge) {
    savedChallenge = await prisma.challengeRun.update({
      where: { id: existingChallenge.id },
      data: userChallenge,
    });
  } else {
    savedChallenge = await prisma.challengeRun.create({
      data: userChallenge,
    });
  }

  for (const goal of goalProgress) {
    const existingGoal = await prisma.challengeRunGoal.findFirst({
      where: {
        challengeRunId: savedChallenge.id,
        challengeGoalId: goal.challengeGoalId,
      },
    });

    if (existingGoal) {
      const goalUpdateData = {
        ...goal,
        evidence: goal.evidence ?? Prisma.JsonNull,
      };

      await prisma.challengeRunGoal.update({
        where: { id: existingGoal.id },
        data: goalUpdateData,
      });
    } else {
      const goalCreateData = {
        ...goal,
        evidence: goal.evidence ?? Prisma.JsonNull,
        challengeRunId: savedChallenge.id,
      };

      await prisma.challengeRunGoal.create({
        data: goalCreateData,
      });
    }
  }

  await evaluateAchievementsForUser({
    userId: uid,
    saveId,
    gameId,
    eventType: 'challenge.progress.updated',
    eventTimestamp: new Date(),
  });

  const fullChallenge = await prisma.challengeRun.findUnique({
    where: { id: savedChallenge.id },
    include: {
      challengeDefinition: {
        include: {
          goals: {
            include: { rules: true },
            orderBy: { position: 'asc' },
          },
        },
      },
      runGoals: true,
      game: true,
      save: true,
    },
  });

  if (!fullChallenge) {
    throw new Error(`Challenge run ${savedChallenge.id} was not found after upsert.`);
  }

  const lookups = await loadChallengeLookups([fullChallenge.challengeDefinition as ChallengeDefinitionWithGoals]);
  const challenge = mapChallengeDefinition(fullChallenge.challengeDefinition as ChallengeDefinitionWithGoals, lookups);
  const mapped = mapRunWithDetails(
    fullChallenge as ChallengeRunWithDetails,
    challenge
  );

  return {
    ...mapped,
    goalProgress: fullChallenge.runGoals,
  };
}

/* FILTERS */

export function filterCompletedChallengeGoalsBasedOnTrophies(
  challenge: ChallengeWithGoals,
  trophies: Trophy[],
  context: TrophyMatchContext
): CareerChallengeGoalInput[] {
  const uniqueTrophies = dedupeTrophiesForChallengeEvaluation(trophies);

  return challenge.goals.map((goal) => {
    const isCompleted = evaluateGoalCompletion(goal, uniqueTrophies, context);
    return challengeGoalToCareerChallengeGoal({ goal, isCompleted });
  });
}

function evaluateGoalCompletion(
  goal: ChallengeGoalWithDetails,
  trophies: Trophy[],
  context: TrophyMatchContext
): boolean {
  const distinctCountryRule = goal.rules.find((rule) => rule.kind.toLowerCase() === 'country.distinct-titles-min');
  if (distinctCountryRule) {
    const minCountries =
      readNumber((distinctCountryRule.config as Record<string, unknown>).minCountries) ??
      readNumber((distinctCountryRule.config as Record<string, unknown>).minimum) ??
      readNumber((distinctCountryRule.config as Record<string, unknown>).min) ??
      1;

    return getDistinctPrimaryTrophyCountryCodes(trophies, context).size >= minCountries;
  }

  if (goal.rules.some((rule) => rule.kind.toLowerCase() === 'domestic.league.any-country')) {
    return trophies.some((trophy) => isDomesticLeagueTrophy(trophy, context));
  }

  if (goal.rules.some((rule) => rule.kind.toLowerCase() === 'domestic.double.same-country')) {
    return hasDomesticDoubleInSameCountry(trophies, context);
  }

  return trophies.some((trophy) => filterGoalByTrophy(goal, trophy, context));
}

function filterGoalByTrophy(
  goal: ChallengeGoalWithDetails,
  trophy: Trophy,
  context: TrophyMatchContext
): boolean {
  if (goal.competitionId && goal.competitionId !== trophy.competitionGroupId) {
    const goalCompetitionName = goal.competition?.name ?? goal.description;
    const trophyCompetitionName = context.competitionNameById.get(trophy.competitionGroupId);

    const matchesByNormalizedName =
      !!goalCompetitionName &&
      !!trophyCompetitionName &&
      normalizeCompetitionName(goalCompetitionName) === normalizeCompetitionName(trophyCompetitionName);

    const matchesByCompetitionFamily =
      !!goalCompetitionName &&
      !!trophyCompetitionName &&
      getCompetitionFamily(goalCompetitionName) !== null &&
      getCompetitionFamily(goalCompetitionName) === getCompetitionFamily(trophyCompetitionName);

    if (!matchesByNormalizedName && !matchesByCompetitionFamily) {
      return false;
    }
  }

  if (goal.teams?.length && goal.teams.every((team) => team.teamId !== trophy.teamId)) {
    return false;
  }

  if (goal.countryId) {
    const trophyCountryCodes = getCountryCodesForTrophy(trophy, context);
    if (!trophyCountryCodes.includes(goal.countryId)) {
      return false;
    }
  }

  return true;
}

function getCountryCodesForTrophy(trophy: Trophy, context: TrophyMatchContext): string[] {
  const codes = [
    context.competitionCountryById.get(trophy.competitionGroupId),
    context.teamCountryById.get(trophy.teamId),
  ].filter((code): code is string => typeof code === 'string' && code.length > 0);

  return [...new Set(codes)];
}

function getDistinctTrophyCountryCodes(trophies: Trophy[], context: TrophyMatchContext): Set<string> {
  const countryCodes = new Set<string>();

  for (const trophy of trophies) {
    for (const code of getCountryCodesForTrophy(trophy, context)) {
      countryCodes.add(code);
    }
  }

  return countryCodes;
}

function getDistinctPrimaryTrophyCountryCodes(trophies: Trophy[], context: TrophyMatchContext): Set<string> {
  const countryCodes = new Set<string>();

  for (const trophy of trophies) {
    const primaryCode = getPrimaryCountryCodeForTrophy(trophy, context);
    if (primaryCode) countryCodes.add(primaryCode);
  }

  return countryCodes;
}

function getPrimaryCountryCodeForTrophy(trophy: Trophy, context: TrophyMatchContext): string | null {
  // For country-distinct challenge goals, use club country as primary source.
  const teamCountryCode = context.teamCountryById.get(trophy.teamId);
  if (teamCountryCode) return teamCountryCode;

  const competitionCountryCode = context.competitionCountryById.get(trophy.competitionGroupId);
  if (competitionCountryCode) return competitionCountryCode;

  return null;
}

function hasDomesticDoubleInSameCountry(trophies: Trophy[], context: TrophyMatchContext): boolean {
  const leaguesByCountry = new Set<string>();
  const cupsByCountry = new Set<string>();

  for (const trophy of trophies) {
    const countryCode = context.competitionCountryById.get(trophy.competitionGroupId);
    if (!countryCode) continue;

    if (isDomesticLeagueTrophy(trophy, context)) {
      leaguesByCountry.add(countryCode);
    }

    if (isDomesticCupTrophy(trophy, context)) {
      cupsByCountry.add(countryCode);
    }
  }

  return [...leaguesByCountry].some((countryCode) => cupsByCountry.has(countryCode));
}

function isDomesticLeagueTrophy(trophy: Trophy, context: TrophyMatchContext): boolean {
  const competitionName = context.competitionNameById.get(trophy.competitionGroupId);
  const countryCode = context.competitionCountryById.get(trophy.competitionGroupId);
  if (!competitionName || !countryCode) return false;

  const normalized = normalizeCompetitionName(competitionName);

  const isCup = /cup|copa|coppa|coupe|pokal|ta[c\u0327]a/.test(normalized);
  if (isCup) return false;

  return /league|liga|bundesliga|seriea|ligue1|premierleague|eredivisie|division/.test(normalized);
}

function isDomesticCupTrophy(trophy: Trophy, context: TrophyMatchContext): boolean {
  const competitionName = context.competitionNameById.get(trophy.competitionGroupId);
  const countryCode = context.competitionCountryById.get(trophy.competitionGroupId);
  if (!competitionName || !countryCode) return false;

  const normalized = normalizeCompetitionName(competitionName);
  return /cup|copa|coppa|coupe|pokal|supercup|ta[c\u0327]a/.test(normalized);
}
